import { getDb } from "@/lib/db/client";
import { nowIso, todayKey } from "@/lib/dates";
import type { StudyActivityLog, StudyActivityLogWithNames, StudyPhase } from "@/lib/db/types";

function mapLog(row: StudyActivityLog): StudyActivityLog {
  return {
    ...row,
    topicId: row.topicId ?? null,
    isFinished: Boolean(row.isFinished),
    phase: row.phase as StudyPhase,
  };
}

export async function getActivityLogs(limit = 100): Promise<StudyActivityLogWithNames[]> {
  const db = await getDb();
  const rows = await db.select<
    (StudyActivityLog & { disciplineName: string; topicName: string | null })[]
  >(
    `SELECT l.*, d.name as disciplineName, t.name as topicName
     FROM StudyActivityLog l
     JOIN Discipline d ON d.id = l.disciplineId
     LEFT JOIN DisciplineTopic t ON t.id = l.topicId
     ORDER BY l.date DESC, l.id DESC
     LIMIT ?`,
    [limit],
  );

  return rows.map((r) => ({
    ...mapLog(r),
    disciplineName: r.disciplineName,
    topicName: r.topicName,
  }));
}

export async function createActivityLog(data: {
  disciplineId: number;
  topicId?: number | null;
  phase: StudyPhase;
  reference: string;
  date?: string;
  quantity?: number;
  correctCount?: number;
  isFinished?: boolean;
}): Promise<StudyActivityLog> {
  const db = await getDb();
  const ts = nowIso();

  await db.execute(
    `INSERT INTO StudyActivityLog
     (disciplineId, topicId, phase, reference, date, quantity, correctCount, isFinished, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.disciplineId,
      data.topicId ?? null,
      data.phase,
      data.reference,
      data.date ?? todayKey(),
      data.quantity ?? 0,
      data.correctCount ?? 0,
      data.isFinished ? 1 : 0,
      ts,
    ],
  );

  const rows = await db.select<StudyActivityLog[]>(
    "SELECT * FROM StudyActivityLog ORDER BY id DESC LIMIT 1",
  );
  return mapLog(rows[0]);
}

export async function updateActivityLog(
  id: number,
  data: Partial<
    Pick<
      StudyActivityLog,
      "phase" | "reference" | "date" | "quantity" | "correctCount" | "isFinished" | "topicId"
    >
  >,
): Promise<void> {
  const db = await getDb();
  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.phase !== undefined) {
    fields.push("phase = ?");
    values.push(data.phase);
  }
  if (data.reference !== undefined) {
    fields.push("reference = ?");
    values.push(data.reference);
  }
  if (data.date !== undefined) {
    fields.push("date = ?");
    values.push(data.date);
  }
  if (data.quantity !== undefined) {
    fields.push("quantity = ?");
    values.push(data.quantity);
  }
  if (data.correctCount !== undefined) {
    fields.push("correctCount = ?");
    values.push(data.correctCount);
  }
  if (data.isFinished !== undefined) {
    fields.push("isFinished = ?");
    values.push(data.isFinished ? 1 : 0);
  }
  if (data.topicId !== undefined) {
    fields.push("topicId = ?");
    values.push(data.topicId);
  }

  if (fields.length === 0) return;
  values.push(id);
  await db.execute(`UPDATE StudyActivityLog SET ${fields.join(", ")} WHERE id = ?`, values);
}

export async function deleteActivityLog(id: number): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM StudyActivityLog WHERE id = ?", [id]);
}

export async function toggleActivityFinished(id: number): Promise<void> {
  const db = await getDb();
  await db.execute(
    "UPDATE StudyActivityLog SET isFinished = CASE WHEN isFinished = 1 THEN 0 ELSE 1 END WHERE id = ?",
    [id],
  );
}
