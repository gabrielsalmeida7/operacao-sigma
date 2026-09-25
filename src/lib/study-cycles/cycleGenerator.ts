import type { CycleBlockType, CognitiveGroup, Discipline, StudyCycleBlock } from "@/lib/db/types";
import { ATRF_12H_TEMPLATE, ATRF_BASE_SLUGS } from "./atrfCatalog";
import { DEFAULT_SESSION_MINUTES, DEFAULT_WEEKLY_SESSIONS } from "./constants";

export interface GeneratedBlock {
  blockNumber: number;
  dayNumber: number;
  slotInDay: number;
  blockType: CycleBlockType;
  disciplineId: number | null;
  thematicFocus: string | null;
  studyHint: string | null;
}

interface GenerateOptions {
  disciplines: Discipline[];
  weeklySessions?: number;
  sessionMinutes?: number;
  preserveManual?: StudyCycleBlock[];
}

function oppositeGroup(group: CognitiveGroup): CognitiveGroup[] {
  switch (group) {
    case "LAW":
      return ["EXACT", "LANGUAGE"];
    case "EXACT":
      return ["LAW", "LANGUAGE"];
    case "LANGUAGE":
      return ["LAW", "EXACT"];
    default: {
      const _never: never = group;
      return _never;
    }
  }
}

function canUseAtrf12hTemplate(disciplines: Discipline[], weeklySessions: number): boolean {
  if (weeklySessions !== DEFAULT_WEEKLY_SESSIONS) return false;
  const bySlug = new Map(disciplines.map((d) => [d.slug, d]));
  const allBaseActive = ATRF_BASE_SLUGS.every((slug) => {
    const d = bySlug.get(slug);
    return d?.cycleState === "ACTIVE" && d.isInCycle;
  });
  if (!allBaseActive) return false;
  const extraActive = disciplines.some(
    (d) => d.isInCycle && d.cycleState === "ACTIVE" && !ATRF_BASE_SLUGS.includes(d.slug),
  );
  return !extraActive;
}

function deriveDaySlot(blockNumber: number): { dayNumber: number; slotInDay: number } {
  const slotsPerDay = 3;
  return {
    dayNumber: Math.ceil(blockNumber / slotsPerDay),
    slotInDay: ((blockNumber - 1) % slotsPerDay) + 1,
  };
}

function allocateSessionCounts(
  weeklySessions: number,
  disciplines: Discipline[],
): Map<number, number> {
  const counts = new Map<number, number>();
  const maintenance = disciplines.filter((d) => d.cycleState === "MAINTENANCE" && d.isInCycle);
  const active = disciplines.filter((d) => d.cycleState === "ACTIVE" && d.isInCycle);

  for (const d of maintenance) {
    counts.set(d.id, 1);
  }

  const remaining = Math.max(weeklySessions - maintenance.length, 0);
  if (active.length === 0 || remaining === 0) return counts;

  const totalWeight = active.reduce((s, d) => s + Math.max(d.weightPercent, 1), 0);
  const raw = active.map((d) => ({
    id: d.id,
    exact: (remaining * Math.max(d.weightPercent, 1)) / totalWeight,
  }));

  const rounded = raw.map((r) => ({ id: r.id, count: Math.max(1, Math.round(r.exact)) }));
  let sum = rounded.reduce((s, r) => s + r.count, 0);

  while (sum > remaining) {
    const candidate = [...rounded].sort((a, b) => b.count - a.count).find((r) => r.count > 1);
    if (!candidate) break;
    candidate.count -= 1;
    sum -= 1;
  }

  while (sum < remaining) {
    const candidate = [...rounded].sort((a, b) => a.count - b.count)[0];
    if (!candidate) break;
    candidate.count += 1;
    sum += 1;
  }

  for (const r of rounded) {
    counts.set(r.id, r.count);
  }

  return counts;
}

function interleaveQueue(disciplines: Discipline[], counts: Map<number, number>): Discipline[] {
  const byId = new Map(disciplines.map((d) => [d.id, d]));
  const remaining = new Map(counts);
  const total = [...remaining.values()].reduce((s, n) => s + n, 0);
  const queue: Discipline[] = [];
  const lastIndex = new Map<number, number>();

  for (let i = 0; i < total; i++) {
    const last = queue[queue.length - 1] ?? null;
    const candidates = [...remaining.entries()]
      .filter(([, n]) => n > 0)
      .map(([id]) => byId.get(id))
      .filter((d): d is Discipline => Boolean(d));

    if (candidates.length === 0) break;

    const preferredGroups = last ? oppositeGroup(last.cognitiveGroup) : null;

    candidates.sort((a, b) => {
      const aConsecutive = last?.id === a.id ? 1 : 0;
      const bConsecutive = last?.id === b.id ? 1 : 0;
      if (aConsecutive !== bConsecutive) return aConsecutive - bConsecutive;

      const aGroup = preferredGroups?.includes(a.cognitiveGroup) ? 0 : 1;
      const bGroup = preferredGroups?.includes(b.cognitiveGroup) ? 0 : 1;
      if (aGroup !== bGroup) return aGroup - bGroup;

      const aLast = lastIndex.get(a.id) ?? -99;
      const bLast = lastIndex.get(b.id) ?? -99;
      if (aLast !== bLast) return aLast - bLast;

      const aRem = remaining.get(a.id) ?? 0;
      const bRem = remaining.get(b.id) ?? 0;
      if (aRem !== bRem) return bRem - aRem;

      return a.cycleSortOrder - b.cycleSortOrder;
    });

    const picked = candidates[0];
    queue.push(picked);
    remaining.set(picked.id, (remaining.get(picked.id) ?? 1) - 1);
    lastIndex.set(picked.id, i);
  }

  return queue;
}

export function generateCycleBlocks(options: GenerateOptions): GeneratedBlock[] {
  const weeklySessions = options.weeklySessions ?? DEFAULT_WEEKLY_SESSIONS;
  const inCycle = options.disciplines.filter(
    (d) => d.isInCycle && (d.cycleState === "ACTIVE" || d.cycleState === "MAINTENANCE"),
  );

  const manualByBlock = new Map<number, StudyCycleBlock>();
  for (const block of options.preserveManual ?? []) {
    if (block.isManualOverride) {
      manualByBlock.set(block.blockNumber, block);
    }
  }

  const bySlug = new Map(inCycle.map((d) => [d.slug, d]));
  let ordered: { discipline: Discipline | null; thematicFocus: string | null; studyHint: string | null }[] = [];

  if (canUseAtrf12hTemplate(options.disciplines, weeklySessions)) {
    ordered = ATRF_12H_TEMPLATE.map((slot) => ({
      discipline: bySlug.get(slot.slug) ?? null,
      thematicFocus: slot.thematicFocus,
      studyHint: slot.studyHint,
    }));
  } else {
    const counts = allocateSessionCounts(weeklySessions, inCycle);
    const queue = interleaveQueue(inCycle, counts);
    ordered = queue.map((d) => ({
      discipline: d,
      thematicFocus: null,
      studyHint: null,
    }));
  }

  const total = Math.max(ordered.length, weeklySessions, 1);
  const blocks: GeneratedBlock[] = [];

  for (let i = 0; i < total; i++) {
    const blockNumber = i + 1;
    const slot = deriveDaySlot(blockNumber);
    const manual = manualByBlock.get(blockNumber);
    if (manual) {
      blocks.push({
        blockNumber,
        dayNumber: slot.dayNumber,
        slotInDay: slot.slotInDay,
        blockType: manual.blockType,
        disciplineId: manual.disciplineId,
        thematicFocus: manual.thematicFocus,
        studyHint: manual.studyHint,
      });
      continue;
    }

    const item = ordered[i];
    if (!item) break;

    blocks.push({
      blockNumber,
      dayNumber: slot.dayNumber,
      slotInDay: slot.slotInDay,
      blockType: "DISCIPLINE",
      disciplineId: item.discipline?.id ?? null,
      thematicFocus: item.thematicFocus,
      studyHint: item.studyHint,
    });
  }

  return blocks;
}

export function previewWeightedQueue(
  disciplines: Discipline[],
  weeklySessions: number,
): GeneratedBlock[] {
  return generateCycleBlocks({ disciplines, weeklySessions, preserveManual: [] });
}

export function estimateCycleMinutes(
  disciplines: Discipline[],
  weeklySessions = DEFAULT_WEEKLY_SESSIONS,
  sessionMinutes = DEFAULT_SESSION_MINUTES,
): number {
  const inCycle = disciplines.filter((d) => d.isInCycle);
  if (inCycle.length === 0) return 0;
  const avg =
    inCycle.reduce((s, d) => s + (d.blockMinutes || sessionMinutes), 0) / inCycle.length;
  return Math.round((weeklySessions || inCycle.length) * avg);
}
