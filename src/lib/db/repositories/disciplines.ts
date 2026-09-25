import { getDb } from "@/lib/db/client";
import { nowIso, weekKey } from "@/lib/dates";
import type {
  CognitiveGroup,
  CycleRole,
  CycleState,
  Discipline,
  DisciplineAccuracy,
  StudyPriority,
  StudyPhase,
} from "@/lib/db/types";
import { levelProgress } from "@/lib/gamification/levels";
import { getDefaultLifeAreaId } from "@/lib/db/repositories/lifeAreas";
import { slugify } from "@/lib/utils";

export function computeAccuracy(resolved: number, correct: number): DisciplineAccuracy {
  if (resolved <= 0) return { resolved: 0, correct: 0, percent: null };
  return {
    resolved,
    correct,
    percent: Math.round((correct / resolved) * 100),
  };
}

export function accuracyColor(percent: number | null): "strong" | "attention" | "weak" | "none" {
  if (percent === null) return "none";
  if (percent >= 70) return "strong";
  if (percent >= 50) return "attention";
  return "weak";
}

function mapDiscipline(row: Discipline): Discipline {
  return {
    ...row,
    totalResolved: row.totalResolved ?? 0,
    totalCorrect: row.totalCorrect ?? 0,
    lifeAreaId: row.lifeAreaId ?? null,
    studyPriority: (row.studyPriority ?? "MEDIUM") as StudyPriority,
    studyPhase: (row.studyPhase ?? "PDF") as StudyPhase,
    blockMinutes: row.blockMinutes ?? 60,
    pdfsTotal: row.pdfsTotal ?? 0,
    pdfsCurrent: row.pdfsCurrent ?? 0,
    isInCycle: Boolean(row.isInCycle ?? true),
    targetAccuracyPercent: row.targetAccuracyPercent ?? null,
    cycleRole: (row.cycleRole ?? "BASE") as CycleRole,
    cycleState: (row.cycleState ?? "ACTIVE") as CycleState,
    weightPercent: row.weightPercent ?? 0,
    cognitiveGroup: (row.cognitiveGroup ?? "LAW") as CognitiveGroup,
    unlockAfterSlug: row.unlockAfterSlug ?? null,
    theoryComplete: Boolean(row.theoryComplete),
    cycleSortOrder: row.cycleSortOrder ?? 0,
    bookmarkLessonCode: row.bookmarkLessonCode ?? null,
    bookmarkPdfName: row.bookmarkPdfName ?? null,
    bookmarkNote: row.bookmarkNote ?? null,
  };
}

export async function getDisciplines(): Promise<Discipline[]> {
  const db = await getDb();
  const rows = await db.select<Discipline[]>("SELECT * FROM Discipline ORDER BY name");
  return rows.map(mapDiscipline);
}

export async function getCycleDisciplines(): Promise<Discipline[]> {
  const db = await getDb();
  const rows = await db.select<Discipline[]>(
    `SELECT * FROM Discipline
     WHERE isInCycle = 1 AND cycleState IN ('ACTIVE', 'MAINTENANCE')
     ORDER BY cycleSortOrder, name`,
  );
  return rows.map(mapDiscipline);
}

export async function createDiscipline(name: string, lifeAreaId?: number | null): Promise<Discipline> {
  const db = await getDb();
  const slug = slugify(name);
  const areaId = lifeAreaId ?? (await getDefaultLifeAreaId());

  await db.execute(
    `INSERT INTO Discipline (name, slug, lifeAreaId, createdAt) VALUES (?, ?, ?, ?)`,
    [name, slug, areaId, nowIso()],
  );
  const rows = await db.select<Discipline[]>("SELECT * FROM Discipline WHERE slug = ?", [slug]);
  return mapDiscipline(rows[0]);
}

export async function updateDisciplineLifeArea(
  disciplineId: number,
  lifeAreaId: number | null,
): Promise<void> {
  const db = await getDb();
  await db.execute("UPDATE Discipline SET lifeAreaId = ? WHERE id = ?", [lifeAreaId, disciplineId]);
}

export async function updateDisciplineCycleSettings(
  id: number,
  data: Partial<
    Pick<
      Discipline,
      | "studyPriority"
      | "studyPhase"
      | "blockMinutes"
      | "pdfsTotal"
      | "pdfsCurrent"
      | "isInCycle"
      | "targetAccuracyPercent"
      | "cycleRole"
      | "cycleState"
      | "weightPercent"
      | "cognitiveGroup"
      | "unlockAfterSlug"
      | "theoryComplete"
      | "cycleSortOrder"
      | "bookmarkLessonCode"
      | "bookmarkPdfName"
      | "bookmarkNote"
    >
  >,
): Promise<void> {
  const db = await getDb();
  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.studyPriority !== undefined) {
    fields.push("studyPriority = ?");
    values.push(data.studyPriority);
  }
  if (data.studyPhase !== undefined) {
    fields.push("studyPhase = ?");
    values.push(data.studyPhase);
  }
  if (data.blockMinutes !== undefined) {
    fields.push("blockMinutes = ?");
    values.push(data.blockMinutes);
  }
  if (data.pdfsTotal !== undefined) {
    fields.push("pdfsTotal = ?");
    values.push(data.pdfsTotal);
  }
  if (data.pdfsCurrent !== undefined) {
    fields.push("pdfsCurrent = ?");
    values.push(data.pdfsCurrent);
  }
  if (data.isInCycle !== undefined) {
    fields.push("isInCycle = ?");
    values.push(data.isInCycle ? 1 : 0);
  }
  if (data.targetAccuracyPercent !== undefined) {
    fields.push("targetAccuracyPercent = ?");
    values.push(data.targetAccuracyPercent);
  }
  if (data.cycleRole !== undefined) {
    fields.push("cycleRole = ?");
    values.push(data.cycleRole);
  }
  if (data.cycleState !== undefined) {
    fields.push("cycleState = ?");
    values.push(data.cycleState);
  }
  if (data.weightPercent !== undefined) {
    fields.push("weightPercent = ?");
    values.push(data.weightPercent);
  }
  if (data.cognitiveGroup !== undefined) {
    fields.push("cognitiveGroup = ?");
    values.push(data.cognitiveGroup);
  }
  if (data.unlockAfterSlug !== undefined) {
    fields.push("unlockAfterSlug = ?");
    values.push(data.unlockAfterSlug);
  }
  if (data.theoryComplete !== undefined) {
    fields.push("theoryComplete = ?");
    values.push(data.theoryComplete ? 1 : 0);
  }
  if (data.cycleSortOrder !== undefined) {
    fields.push("cycleSortOrder = ?");
    values.push(data.cycleSortOrder);
  }
  if (data.bookmarkLessonCode !== undefined) {
    fields.push("bookmarkLessonCode = ?");
    values.push(data.bookmarkLessonCode);
  }
  if (data.bookmarkPdfName !== undefined) {
    fields.push("bookmarkPdfName = ?");
    values.push(data.bookmarkPdfName);
  }
  if (data.bookmarkNote !== undefined) {
    fields.push("bookmarkNote = ?");
    values.push(data.bookmarkNote);
  }

  if (fields.length === 0) return;
  values.push(id);
  await db.execute(`UPDATE Discipline SET ${fields.join(", ")} WHERE id = ?`, values);
}

export async function deleteDiscipline(id: number): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM EditalDiscipline WHERE disciplineId = ?", [id]);
  await db.execute("DELETE FROM DisciplineTopic WHERE disciplineId = ?", [id]);
  await db.execute("DELETE FROM StudyCycleBlock WHERE disciplineId = ?", [id]);
  await db.execute("DELETE FROM StudyActivityLog WHERE disciplineId = ?", [id]);
  await db.execute("DELETE FROM Discipline WHERE id = ?", [id]);
}

export async function getDisciplinesWithProgress() {
  const disciplines = await getDisciplines();
  return disciplines.map((d) => ({
    ...d,
    progress: levelProgress(d.xp),
    accuracy: computeAccuracy(d.totalResolved ?? 0, d.totalCorrect ?? 0),
  }));
}

export async function getDisciplineCycleRows() {
  const disciplines = await getDisciplines();
  return disciplines.map((d) => {
    const accuracy = computeAccuracy(d.totalResolved, d.totalCorrect);
    const pdfProgressPercent =
      d.pdfsTotal > 0 ? Math.round((d.pdfsCurrent / d.pdfsTotal) * 100) : null;
    return {
      ...d,
      pdfProgressPercent,
      accuracyPercent: accuracy.percent,
    };
  });
}

export async function getWeeklyDisciplineHighlights() {
  const db = await getDb();
  const wKey = weekKey();
  const rows = await db.select<{
    disciplineId: number;
    name: string;
    resolved: number;
    correct: number;
    minutes: number;
  }[]>(
    `SELECT d.id as disciplineId, d.name,
      COALESCE(SUM(ql.resolvedCount), 0) as resolved,
      COALESCE(SUM(ql.correctCount), 0) as correct,
      COALESCE(SUM(ss.durationSec), 0) / 60 as minutes
     FROM Discipline d
     LEFT JOIN QuestionLog ql ON ql.disciplineId = d.id AND strftime('%Y-%W', ql.createdAt) = ?
     LEFT JOIN StudySession ss ON ss.disciplineId = d.id AND strftime('%Y-%W', ss.startedAt) = ?
     GROUP BY d.id
     HAVING resolved > 0 OR minutes > 0
     ORDER BY resolved DESC`,
    [wKey, wKey],
  );

  if (rows.length === 0) return { strongest: null, weakest: null };

  const withAccuracy = rows.map((r) => ({
    ...r,
    accuracy: computeAccuracy(r.resolved, r.correct),
  }));

  const sorted = [...withAccuracy].sort(
    (a, b) => (b.accuracy.percent ?? 0) - (a.accuracy.percent ?? 0),
  );

  return {
    strongest: sorted[0] ?? null,
    weakest: sorted[sorted.length - 1] ?? null,
  };
}
