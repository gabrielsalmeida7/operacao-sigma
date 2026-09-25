import { getDb } from "@/lib/db/client";
import { nowIso } from "@/lib/dates";
import type {
  CycleBlockType,
  CycleStatus,
  StudyCycle,
  StudyCycleBlock,
  StudyCycleBlockWithDiscipline,
  StudyCycleCompletion,
  StudyPriority,
} from "@/lib/db/types";
import { generateCycleBlocks, estimateCycleMinutes } from "@/lib/study-cycles/cycleGenerator";
import { resolveCycleStatus } from "@/lib/study-cycles/nextItemResolver";
import { lapColor, DEFAULT_SESSION_MINUTES, DEFAULT_WEEKLY_SESSIONS } from "@/lib/study-cycles/constants";
import { shouldMoveToMaintenance, buildTransitionPlan } from "@/lib/study-cycles/transitionEngine";
import { getDisciplines, updateDisciplineCycleSettings } from "./disciplines";
import { evaluateAccuracyGate } from "@/lib/study-cycles/tqrSession";
import { getTopicsByDiscipline, applyTopicAccuracyGate, incrementDisciplinePdf } from "./disciplineTopics";

function parseJson<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

function mapCycle(row: StudyCycle): StudyCycle {
  return {
    ...row,
    editalId: row.editalId ?? null,
    isActive: Boolean(row.isActive),
    studyWeekdays: parseJson<Record<string, string>>(row.studyWeekdaysJson, {}),
    reviewDaySlots: parseJson<number[]>(row.reviewDaySlotsJson, [3, 5, 8]),
    weeklySessions: row.weeklySessions ?? DEFAULT_WEEKLY_SESSIONS,
    sessionMinutes: row.sessionMinutes ?? DEFAULT_SESSION_MINUTES,
    currentLap: row.currentLap ?? 1,
    weekColorIndex: row.weekColorIndex ?? 0,
  };
}

function mapBlock(row: StudyCycleBlock): StudyCycleBlock {
  return {
    ...row,
    blockType: row.blockType as CycleBlockType,
    disciplineId: row.disciplineId ?? null,
    isManualOverride: Boolean(row.isManualOverride),
    thematicFocus: row.thematicFocus ?? null,
    studyHint: row.studyHint ?? null,
  };
}

export async function getActiveCycle(): Promise<StudyCycle | null> {
  const db = await getDb();
  const rows = await db.select<StudyCycle[]>(
    "SELECT * FROM StudyCycle WHERE isActive = 1 ORDER BY id DESC LIMIT 1",
  );
  return rows[0] ? mapCycle(rows[0]) : null;
}

export async function getCycleBlocks(cycleId: number): Promise<StudyCycleBlockWithDiscipline[]> {
  const db = await getDb();
  const rows = await db.select<
    (StudyCycleBlock & {
      disciplineName: string | null;
      disciplinePriority: string | null;
      disciplineSlug: string | null;
    })[]
  >(
    `SELECT b.*, d.name as disciplineName, d.studyPriority as disciplinePriority, d.slug as disciplineSlug
     FROM StudyCycleBlock b
     LEFT JOIN Discipline d ON d.id = b.disciplineId
     WHERE b.cycleId = ?
     ORDER BY b.blockNumber`,
    [cycleId],
  );

  return rows.map((r) => ({
    ...mapBlock(r),
    disciplineName: r.disciplineName,
    disciplinePriority: (r.disciplinePriority as StudyPriority | null) ?? null,
    disciplineSlug: r.disciplineSlug,
  }));
}

export async function getCycleCompletions(cycleId: number): Promise<StudyCycleCompletion[]> {
  const db = await getDb();
  return db.select<StudyCycleCompletion[]>(
    "SELECT * FROM StudyCycleCompletion WHERE cycleId = ? ORDER BY lap, blockNumber",
    [cycleId],
  );
}

export async function getActiveCycleWithBlocks() {
  const cycle = await getActiveCycle();
  if (!cycle) return null;
  await maybeUpgradeLegacyCycle(cycle);
  const latest = (await getActiveCycle()) ?? cycle;
  const blocks = await getCycleBlocks(latest.id);
  return { cycle: latest, blocks };
}

async function maybeUpgradeLegacyCycle(cycle: StudyCycle): Promise<void> {
  const blocks = await getCycleBlocks(cycle.id);
  const looksLegacy =
    blocks.length === cycle.dayCount * cycle.blocksPerDay &&
    blocks.length === 24 &&
    cycle.weeklySessions === 12 &&
    blocks.every((b) => !b.thematicFocus);
  if (!looksLegacy) return;
  await regenerateCycleBlocks(cycle.id, false);
}

export async function createCycle(
  name: string,
  editalId?: number | null,
  weeklySessions = DEFAULT_WEEKLY_SESSIONS,
): Promise<StudyCycle> {
  const db = await getDb();
  await db.execute("UPDATE StudyCycle SET isActive = 0");

  const ts = nowIso();
  await db.execute(
    `INSERT INTO StudyCycle
     (name, editalId, weeklySessions, sessionMinutes, currentLap, weekColorIndex, isActive, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, 1, 0, 1, ?, ?)`,
    [name, editalId ?? null, weeklySessions, DEFAULT_SESSION_MINUTES, ts, ts],
  );

  const rows = await db.select<StudyCycle[]>("SELECT * FROM StudyCycle ORDER BY id DESC LIMIT 1");
  const cycle = mapCycle(rows[0]);
  await regenerateCycleBlocks(cycle.id, false);
  return cycle;
}

export async function regenerateCycleBlocks(
  cycleId: number,
  preserveManual = true,
): Promise<void> {
  const db = await getDb();
  const cycleRows = await db.select<StudyCycle[]>("SELECT * FROM StudyCycle WHERE id = ?", [
    cycleId,
  ]);
  if (!cycleRows[0]) return;

  const cycle = mapCycle(cycleRows[0]);
  const disciplines = await getDisciplines();

  let preserveManualBlocks: StudyCycleBlock[] = [];
  if (preserveManual) {
    const existing = await db.select<StudyCycleBlock[]>(
      "SELECT * FROM StudyCycleBlock WHERE cycleId = ? AND isManualOverride = 1",
      [cycleId],
    );
    preserveManualBlocks = existing.map(mapBlock);
  }

  await db.execute("DELETE FROM StudyCycleBlock WHERE cycleId = ?", [cycleId]);

  const generated = generateCycleBlocks({
    disciplines,
    weeklySessions: cycle.weeklySessions,
    sessionMinutes: cycle.sessionMinutes,
    preserveManual: preserveManualBlocks,
  });

  for (const block of generated) {
    const isManual = preserveManualBlocks.some((m) => m.blockNumber === block.blockNumber);
    await db.execute(
      `INSERT INTO StudyCycleBlock
       (cycleId, blockNumber, dayNumber, slotInDay, blockType, disciplineId, isManualOverride, thematicFocus, studyHint)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        cycleId,
        block.blockNumber,
        block.dayNumber,
        block.slotInDay,
        block.blockType,
        block.disciplineId,
        isManual ? 1 : 0,
        block.thematicFocus,
        block.studyHint,
      ],
    );
  }

  await db.execute("UPDATE StudyCycle SET updatedAt = ? WHERE id = ?", [nowIso(), cycleId]);
}

export async function updateCycleSettings(
  cycleId: number,
  data: {
    name?: string;
    studyWeekdays?: Record<string, string>;
    reviewDaySlots?: number[];
    currentBlockNumber?: number;
    weeklySessions?: number;
    sessionMinutes?: number;
    currentLap?: number;
    weekColorIndex?: number;
  },
): Promise<void> {
  const db = await getDb();
  const fields: string[] = ["updatedAt = ?"];
  const values: unknown[] = [nowIso()];

  if (data.name !== undefined) {
    fields.push("name = ?");
    values.push(data.name);
  }
  if (data.studyWeekdays !== undefined) {
    fields.push("studyWeekdaysJson = ?");
    values.push(JSON.stringify(data.studyWeekdays));
  }
  if (data.reviewDaySlots !== undefined) {
    fields.push("reviewDaySlotsJson = ?");
    values.push(JSON.stringify(data.reviewDaySlots));
  }
  if (data.currentBlockNumber !== undefined) {
    fields.push("currentBlockNumber = ?");
    values.push(data.currentBlockNumber);
  }
  if (data.weeklySessions !== undefined) {
    fields.push("weeklySessions = ?");
    values.push(data.weeklySessions);
  }
  if (data.sessionMinutes !== undefined) {
    fields.push("sessionMinutes = ?");
    values.push(data.sessionMinutes);
  }
  if (data.currentLap !== undefined) {
    fields.push("currentLap = ?");
    values.push(data.currentLap);
  }
  if (data.weekColorIndex !== undefined) {
    fields.push("weekColorIndex = ?");
    values.push(data.weekColorIndex);
  }

  values.push(cycleId);
  await db.execute(`UPDATE StudyCycle SET ${fields.join(", ")} WHERE id = ?`, values);
}

export async function paintCycleSession(
  cycleId: number,
  blockNumber: number,
  lap: number,
): Promise<void> {
  const db = await getDb();
  const color = lapColor(lap);
  await db.execute(
    `INSERT OR REPLACE INTO StudyCycleCompletion (cycleId, blockNumber, lap, weekColor, completedAt)
     VALUES (?, ?, ?, ?, ?)`,
    [cycleId, blockNumber, lap, color.hex, nowIso()],
  );
}

export async function advanceCycleBlock(cycleId: number): Promise<number> {
  const result = await completeCycleSession(cycleId, { applyTransition: false });
  return result.nextBlock;
}

export async function completeCycleSession(
  cycleId: number,
  options?: { applyTransition?: boolean },
): Promise<{ nextBlock: number; lap: number; unlockedSlug: string | null }> {
  const db = await getDb();
  const rows = await db.select<StudyCycle[]>("SELECT * FROM StudyCycle WHERE id = ?", [cycleId]);
  if (!rows[0]) return { nextBlock: 1, lap: 1, unlockedSlug: null };

  const cycle = mapCycle(rows[0]);
  const blocks = await getCycleBlocks(cycleId);
  const totalBlocks = blocks.length || cycle.weeklySessions || 1;
  const currentBlock =
    blocks.find((b) => b.blockNumber === cycle.currentBlockNumber) ?? null;

  await paintCycleSession(cycleId, cycle.currentBlockNumber, cycle.currentLap);

  let nextBlock = cycle.currentBlockNumber + 1;
  let nextLap = cycle.currentLap;
  if (nextBlock > totalBlocks) {
    nextBlock = 1;
    nextLap = cycle.currentLap + 1;
  }

  await updateCycleSettings(cycleId, {
    currentBlockNumber: nextBlock,
    currentLap: nextLap,
    weekColorIndex: (nextLap - 1) % 6,
  });

  let unlockedSlug: string | null = null;
  if (options?.applyTransition !== false && currentBlock?.disciplineId) {
    unlockedSlug = await applyDisciplineTransition(cycleId, currentBlock.disciplineId);
  }

  return { nextBlock, lap: nextLap, unlockedSlug };
}

export async function applyDisciplineTransition(
  cycleId: number,
  disciplineId: number,
): Promise<string | null> {
  const disciplines = await getDisciplines();
  const completed = disciplines.find((d) => d.id === disciplineId);
  if (!completed) return null;
  if (!shouldMoveToMaintenance(completed) || completed.cycleState === "MAINTENANCE") {
    return null;
  }

  await updateDisciplineCycleSettings(disciplineId, {
    theoryComplete: true,
    cycleState: "MAINTENANCE",
    studyPhase: "QUESTIONS",
    isInCycle: true,
  });

  const refreshed = await getDisciplines();
  const afterComplete = refreshed.map((d) =>
    d.id === disciplineId ? { ...d, theoryComplete: true, cycleState: "MAINTENANCE" as const } : d,
  );
  const plan = buildTransitionPlan(completed, afterComplete);

  if (plan.unlockedDisciplineId) {
    await updateDisciplineCycleSettings(plan.unlockedDisciplineId, {
      cycleState: "ACTIVE",
      isInCycle: true,
      studyPhase: "PDF",
    });
  }

  await regenerateCycleBlocks(cycleId, true);
  return plan.unlockedSlug;
}

export async function markTheoryComplete(cycleId: number, disciplineId: number): Promise<string | null> {
  const db = await getDb();
  await db.execute(
    "UPDATE Discipline SET theoryComplete = 1, pdfsCurrent = CASE WHEN pdfsTotal > 0 THEN pdfsTotal ELSE pdfsCurrent END WHERE id = ?",
    [disciplineId],
  );
  return applyDisciplineTransition(cycleId, disciplineId);
}

export async function finishTqrSession(params: {
  cycleId: number;
  disciplineId: number | null;
  topicId: number | null;
  resolved: number;
  correct: number;
}): Promise<{ percent: number; passed: boolean; unlockedSlug: string | null }> {
  const { percent, passed } = evaluateAccuracyGate(params.resolved, params.correct);

  if (params.topicId) {
    await applyTopicAccuracyGate(params.topicId, percent, passed);
  }

  if (passed && params.disciplineId) {
    const disciplines = await getDisciplines();
    const disc = disciplines.find((d) => d.id === params.disciplineId);
    if (disc?.studyPhase === "PDF") {
      const theoryDone = await incrementDisciplinePdf(params.disciplineId);
      if (theoryDone) {
        const db = await getDb();
        await db.execute("UPDATE Discipline SET theoryComplete = 1 WHERE id = ?", [
          params.disciplineId,
        ]);
      }
    }
  }

  const result = await completeCycleSession(params.cycleId, { applyTransition: passed });
  return { percent, passed, unlockedSlug: result.unlockedSlug };
}

export async function setCycleBlockNumber(cycleId: number, blockNumber: number): Promise<void> {
  await updateCycleSettings(cycleId, { currentBlockNumber: blockNumber });
}

export async function updateCycleBlock(
  blockId: number,
  data: {
    disciplineId?: number | null;
    blockType?: CycleBlockType;
    isManualOverride?: boolean;
    thematicFocus?: string | null;
    studyHint?: string | null;
  },
): Promise<void> {
  const db = await getDb();
  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.disciplineId !== undefined) {
    fields.push("disciplineId = ?");
    values.push(data.disciplineId);
  }
  if (data.blockType !== undefined) {
    fields.push("blockType = ?");
    values.push(data.blockType);
  }
  if (data.isManualOverride !== undefined) {
    fields.push("isManualOverride = ?");
    values.push(data.isManualOverride ? 1 : 0);
  }
  if (data.thematicFocus !== undefined) {
    fields.push("thematicFocus = ?");
    values.push(data.thematicFocus);
  }
  if (data.studyHint !== undefined) {
    fields.push("studyHint = ?");
    values.push(data.studyHint);
  }

  if (fields.length === 0) return;
  values.push(blockId);
  await db.execute(`UPDATE StudyCycleBlock SET ${fields.join(", ")} WHERE id = ?`, values);
}

export async function undoLastCycleSession(cycleId: number): Promise<boolean> {
  const db = await getDb();
  const rows = await db.select<StudyCycle[]>("SELECT * FROM StudyCycle WHERE id = ?", [cycleId]);
  if (!rows[0]) return false;

  const latest = await db.select<StudyCycleCompletion[]>(
    `SELECT * FROM StudyCycleCompletion
     WHERE cycleId = ?
     ORDER BY datetime(completedAt) DESC, id DESC
     LIMIT 1`,
    [cycleId],
  );
  const last = latest[0];
  if (!last) return false;

  await db.execute("DELETE FROM StudyCycleCompletion WHERE id = ?", [last.id]);
  await updateCycleSettings(cycleId, {
    currentBlockNumber: last.blockNumber,
    currentLap: last.lap,
    weekColorIndex: (last.lap - 1) % 6,
  });
  return true;
}

export async function reorderCycleBlocks(
  cycleId: number,
  orderedBlockIds: number[],
): Promise<void> {
  const db = await getDb();
  const blocks = await getCycleBlocks(cycleId);
  const byId = new Map(blocks.map((b) => [b.id, b]));
  const slotsPerDay = 3;

  for (const id of orderedBlockIds) {
    await db.execute("UPDATE StudyCycleBlock SET blockNumber = ? WHERE id = ?", [-id, id]);
  }

  for (let i = 0; i < orderedBlockIds.length; i++) {
    const block = byId.get(orderedBlockIds[i]);
    if (!block) continue;
    const blockNumber = i + 1;
    const dayNumber = Math.ceil(blockNumber / slotsPerDay);
    const slotInDay = ((blockNumber - 1) % slotsPerDay) + 1;

    await db.execute(
      `UPDATE StudyCycleBlock
       SET blockNumber = ?, dayNumber = ?, slotInDay = ?, isManualOverride = 1
       WHERE id = ?`,
      [blockNumber, dayNumber, slotInDay, block.id],
    );
  }

  await db.execute("UPDATE StudyCycle SET updatedAt = ? WHERE id = ?", [nowIso(), cycleId]);
}

export async function getCycleSummary() {
  const active = await getActiveCycleWithBlocks();
  const disciplines = await getDisciplines();
  const inCycle = disciplines.filter((d) => d.isInCycle);
  const completions = active ? await getCycleCompletions(active.cycle.id) : [];

  if (!active) {
    return {
      cycle: null,
      blocks: [] as StudyCycleBlockWithDiscipline[],
      completions,
      status: resolveCycleStatus(null, null, [], 12),
      subjectCount: inCycle.length,
      estimatedMinutes: estimateCycleMinutes(disciplines),
      totalPdfs: inCycle.reduce((s, d) => s + d.pdfsTotal, 0),
    };
  }

  const currentBlock =
    active.blocks.find((b) => b.blockNumber === active.cycle.currentBlockNumber) ?? null;

  let discipline = null;
  let topics: Awaited<ReturnType<typeof getTopicsByDiscipline>> = [];

  if (currentBlock?.disciplineId) {
    discipline = disciplines.find((d) => d.id === currentBlock.disciplineId) ?? null;
    topics = await getTopicsByDiscipline(currentBlock.disciplineId);
  }

  const totalBlocks = active.blocks.length || active.cycle.weeklySessions;
  const status = resolveCycleStatus(currentBlock, discipline, topics, totalBlocks);

  return {
    cycle: active.cycle,
    blocks: active.blocks,
    completions,
    status,
    subjectCount: inCycle.length,
    estimatedMinutes: estimateCycleMinutes(
      disciplines,
      active.cycle.weeklySessions,
      active.cycle.sessionMinutes,
    ),
    totalPdfs: inCycle.reduce((s, d) => s + d.pdfsTotal, 0),
  };
}

export async function getCycleStatus(): Promise<CycleStatus> {
  const summary = await getCycleSummary();
  return summary.status;
}

export async function ensureActiveCycle(defaultName = "Ciclo ATRF"): Promise<StudyCycle> {
  const existing = await getActiveCycle();
  if (existing) return existing;
  return createCycle(defaultName);
}
