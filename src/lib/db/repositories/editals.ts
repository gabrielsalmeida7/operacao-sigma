import { getDb } from "@/lib/db/client";
import { nowIso, daysUntil } from "@/lib/dates";
import type { TargetEdital, EditalDiscipline, Discipline } from "@/lib/db/types";

function mapEdital(row: TargetEdital & { isActive: number | boolean }): TargetEdital {
  return { ...row, isActive: Boolean(row.isActive) };
}

export async function getEditals(): Promise<TargetEdital[]> {
  const db = await getDb();
  const rows = await db.select<(TargetEdital & { isActive: number })[]>(
    "SELECT * FROM TargetEdital ORDER BY examDate ASC",
  );
  return rows.map(mapEdital);
}

export async function getActiveEditals(): Promise<TargetEdital[]> {
  const all = await getEditals();
  return all.filter((e) => e.isActive);
}

export async function getNearestEdital(): Promise<(TargetEdital & { daysRemaining: number }) | null> {
  const active = await getActiveEditals();
  if (active.length === 0) return null;
  const sorted = [...active].sort((a, b) => daysUntil(a.examDate) - daysUntil(b.examDate));
  const nearest = sorted[0];
  return { ...nearest, daysRemaining: daysUntil(nearest.examDate) };
}

export async function createEdital(data: {
  name: string;
  organ?: string;
  examDate: string;
  notes?: string;
  disciplineIds?: number[];
}): Promise<TargetEdital> {
  const db = await getDb();
  await db.execute(
    "INSERT INTO TargetEdital (name, organ, examDate, notes, createdAt) VALUES (?, ?, ?, ?, ?)",
    [data.name, data.organ ?? null, data.examDate, data.notes ?? null, nowIso()],
  );
  const rows = await db.select<(TargetEdital & { isActive: number })[]>(
    "SELECT * FROM TargetEdital ORDER BY id DESC LIMIT 1",
  );
  const edital = mapEdital(rows[0]);
  if (data.disciplineIds?.length) {
    await setEditalDisciplines(edital.id, data.disciplineIds);
  }
  return edital;
}

export async function updateEdital(
  id: number,
  data: Partial<{ name: string; organ: string; examDate: string; notes: string; isActive: boolean }>,
): Promise<void> {
  const db = await getDb();
  const fields: string[] = [];
  const values: unknown[] = [];
  if (data.name !== undefined) { fields.push("name = ?"); values.push(data.name); }
  if (data.organ !== undefined) { fields.push("organ = ?"); values.push(data.organ); }
  if (data.examDate !== undefined) { fields.push("examDate = ?"); values.push(data.examDate); }
  if (data.notes !== undefined) { fields.push("notes = ?"); values.push(data.notes); }
  if (data.isActive !== undefined) { fields.push("isActive = ?"); values.push(data.isActive ? 1 : 0); }
  if (fields.length > 0) {
    values.push(id);
    await db.execute(`UPDATE TargetEdital SET ${fields.join(", ")} WHERE id = ?`, values);
  }
}

export async function deleteEdital(id: number): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM EditalDiscipline WHERE editalId = ?", [id]);
  await db.execute("DELETE FROM TargetEdital WHERE id = ?", [id]);
}

export async function setEditalDisciplines(editalId: number, disciplineIds: number[]): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM EditalDiscipline WHERE editalId = ?", [editalId]);
  for (const disciplineId of disciplineIds) {
    await db.execute(
      "INSERT INTO EditalDiscipline (editalId, disciplineId, weight) VALUES (?, ?, 1)",
      [editalId, disciplineId],
    );
  }
}

export async function getEditalDisciplines(editalId: number): Promise<(EditalDiscipline & { discipline: Discipline })[]> {
  const db = await getDb();
  const links = await db.select<EditalDiscipline[]>(
    "SELECT * FROM EditalDiscipline WHERE editalId = ?",
    [editalId],
  );
  const result = [];
  for (const link of links) {
    const d = await db.select<Discipline[]>("SELECT * FROM Discipline WHERE id = ?", [link.disciplineId]);
    if (d[0]) result.push({ ...link, discipline: d[0] });
  }
  return result;
}

export async function getEditalsWithDetails() {
  const editals = await getEditals();
  return Promise.all(
    editals.map(async (e) => ({
      ...e,
      daysRemaining: daysUntil(e.examDate),
      disciplines: await getEditalDisciplines(e.id),
    })),
  );
}
