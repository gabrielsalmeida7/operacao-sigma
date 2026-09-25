import { getDb } from "@/lib/db/client";
import { nowIso, weekKey } from "@/lib/dates";
import type { LifeArea, LifeAreaWithStats } from "@/lib/db/types";
import { slugify } from "@/lib/utils";

function mapLifeArea(row: LifeArea): LifeArea {
  return {
    ...row,
    isActive: Boolean(row.isActive),
  };
}

export async function getLifeAreas(): Promise<LifeArea[]> {
  const db = await getDb();
  const rows = await db.select<LifeArea[]>(
    "SELECT * FROM LifeArea ORDER BY sortOrder, name",
  );
  return rows.map(mapLifeArea);
}

export async function getActiveLifeAreas(): Promise<LifeArea[]> {
  const db = await getDb();
  const rows = await db.select<LifeArea[]>(
    "SELECT * FROM LifeArea WHERE isActive = 1 ORDER BY sortOrder, name",
  );
  return rows.map(mapLifeArea);
}

export async function getLifeAreaBySlug(slug: string): Promise<LifeArea | null> {
  const db = await getDb();
  const rows = await db.select<LifeArea[]>("SELECT * FROM LifeArea WHERE slug = ?", [slug]);
  return rows[0] ? mapLifeArea(rows[0]) : null;
}

export async function getDefaultLifeAreaId(): Promise<number | null> {
  const concurso = await getLifeAreaBySlug("concurso");
  if (concurso) return concurso.id;
  const areas = await getLifeAreas();
  return areas[0]?.id ?? null;
}

export async function getLifeAreasWithStats(): Promise<LifeAreaWithStats[]> {
  const db = await getDb();
  const wStart = weekKey();
  const areas = await getLifeAreas();

  const result: LifeAreaWithStats[] = [];
  for (const area of areas) {
    const discStats = await db.select<{ count: number; totalXp: number }[]>(
      `SELECT COUNT(*) as count, COALESCE(SUM(xp), 0) as totalXp
       FROM Discipline WHERE lifeAreaId = ?`,
      [area.id],
    );
    const sessionStats = await db.select<{ minutes: number }[]>(
      `SELECT COALESCE(SUM(s.durationSec), 0) / 60 as minutes
       FROM StudySession s
       JOIN Discipline d ON d.id = s.disciplineId
       WHERE d.lifeAreaId = ? AND s.startedAt >= ?`,
      [area.id, wStart],
    );

    result.push({
      ...area,
      disciplineCount: discStats[0]?.count ?? 0,
      totalXp: discStats[0]?.totalXp ?? 0,
      weeklyStudyMinutes: Math.floor(sessionStats[0]?.minutes ?? 0),
    });
  }

  return result;
}

export interface CreateLifeAreaInput {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

export async function createLifeArea(input: CreateLifeAreaInput): Promise<LifeArea> {
  const db = await getDb();
  const slug = slugify(input.name);
  const maxOrder = await db.select<{ maxOrder: number | null }[]>(
    "SELECT MAX(sortOrder) as maxOrder FROM LifeArea",
  );
  const sortOrder = (maxOrder[0]?.maxOrder ?? -1) + 1;

  await db.execute(
    `INSERT INTO LifeArea (name, slug, description, color, icon, sortOrder, isActive, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
    [
      input.name.trim(),
      slug,
      input.description?.trim() || null,
      input.color ?? "#6366f1",
      input.icon ?? "layers",
      sortOrder,
      nowIso(),
    ],
  );

  const rows = await db.select<LifeArea[]>("SELECT * FROM LifeArea WHERE slug = ?", [slug]);
  return mapLifeArea(rows[0]);
}

export interface UpdateLifeAreaInput {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export async function updateLifeArea(id: number, input: UpdateLifeAreaInput): Promise<void> {
  const db = await getDb();
  const current = await db.select<LifeArea[]>("SELECT * FROM LifeArea WHERE id = ?", [id]);
  if (!current[0]) return;

  const name = input.name?.trim() ?? current[0].name;
  const slug = input.name ? slugify(input.name) : current[0].slug;

  await db.execute(
    `UPDATE LifeArea SET
      name = ?,
      slug = ?,
      description = ?,
      color = ?,
      icon = ?,
      isActive = ?,
      sortOrder = ?
     WHERE id = ?`,
    [
      name,
      slug,
      input.description !== undefined ? input.description.trim() || null : current[0].description,
      input.color ?? current[0].color,
      input.icon ?? current[0].icon,
      input.isActive !== undefined ? (input.isActive ? 1 : 0) : current[0].isActive ? 1 : 0,
      input.sortOrder ?? current[0].sortOrder,
      id,
    ],
  );
}

export async function deleteLifeArea(id: number): Promise<{ ok: boolean; reason?: string }> {
  const db = await getDb();
  const linked = await db.select<{ count: number }[]>(
    "SELECT COUNT(*) as count FROM Discipline WHERE lifeAreaId = ?",
    [id],
  );
  if ((linked[0]?.count ?? 0) > 0) {
    return {
      ok: false,
      reason: "Existem disciplinas vinculadas. Mova-as para outra área antes de excluir.",
    };
  }

  await db.execute("DELETE FROM LifeArea WHERE id = ?", [id]);
  return { ok: true };
}

export async function getDisciplinesByLifeArea(lifeAreaId: number) {
  const db = await getDb();
  return db.select<{ id: number; name: string; xp: number; level: number }[]>(
    "SELECT id, name, xp, level FROM Discipline WHERE lifeAreaId = ? ORDER BY name",
    [lifeAreaId],
  );
}

export async function assignDisciplineToLifeArea(
  disciplineId: number,
  lifeAreaId: number | null,
): Promise<void> {
  const db = await getDb();
  await db.execute("UPDATE Discipline SET lifeAreaId = ? WHERE id = ?", [lifeAreaId, disciplineId]);
}
