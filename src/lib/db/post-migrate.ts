import type Database from "@tauri-apps/plugin-sql";
import { ATRF_CATALOG } from "@/lib/study-cycles/atrfCatalog";

export async function runPostMigrations(db: Database): Promise<void> {
  const discs = await db.select<{ id: number }[]>("SELECT id FROM Discipline");
  for (const d of discs) {
    const stats = await db.select<{ resolved: number; correct: number }[]>(
      `SELECT COALESCE(SUM(resolvedCount), 0) as resolved, COALESCE(SUM(correctCount), 0) as correct
       FROM QuestionLog WHERE disciplineId = ? AND isSimulado = 0`,
      [d.id],
    );
    const s = stats[0] ?? { resolved: 0, correct: 0 };
    await db.execute(
      "UPDATE Discipline SET totalResolved = ?, totalCorrect = ? WHERE id = ?",
      [s.resolved, s.correct, d.id],
    );
  }

  const concurso = await db.select<{ id: number }[]>(
    "SELECT id FROM LifeArea WHERE slug = 'concurso' LIMIT 1",
  );
  if (concurso[0]) {
    await db.execute(
      "UPDATE Discipline SET lifeAreaId = ? WHERE lifeAreaId IS NULL",
      [concurso[0].id],
    );
  }

  await upsertAtrfCatalog(db, concurso[0]?.id ?? null);
}

async function upsertAtrfCatalog(db: Database, concursoId: number | null): Promise<void> {
  const now = new Date().toISOString();
  const existing = await db.select<{ id: number; slug: string; name: string }[]>(
    "SELECT id, slug, name FROM Discipline",
  );
  const bySlug = new Map(existing.map((d) => [d.slug, d]));
  const byName = new Map(existing.map((d) => [d.name, d]));

  for (const entry of ATRF_CATALOG) {
    let row = bySlug.get(entry.slug);
    if (!row && entry.aliases) {
      row = entry.aliases.map((alias) => byName.get(alias)).find(Boolean);
    }

    if (!row) {
      await db.execute(
        `INSERT INTO Discipline
         (name, slug, lifeAreaId, cycleRole, cycleState, weightPercent, cognitiveGroup,
          unlockAfterSlug, theoryComplete, cycleSortOrder, isInCycle, studyPriority, blockMinutes, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?)`,
        [
          entry.name,
          entry.slug,
          concursoId,
          entry.cycleRole,
          entry.cycleState,
          entry.weightPercent,
          entry.cognitiveGroup,
          entry.unlockAfterSlug,
          entry.cycleSortOrder,
          entry.isInCycle ? 1 : 0,
          entry.studyPriority,
          entry.blockMinutes,
          now,
        ],
      );
      continue;
    }

    await db.execute(
      `UPDATE Discipline SET
        name = ?,
        slug = ?,
        cycleRole = ?,
        weightPercent = CASE WHEN weightPercent = 0 THEN ? ELSE weightPercent END,
        cognitiveGroup = ?,
        unlockAfterSlug = ?,
        cycleSortOrder = ?,
        blockMinutes = CASE WHEN blockMinutes = 60 THEN ? ELSE blockMinutes END
       WHERE id = ?`,
      [
        entry.name,
        entry.slug,
        entry.cycleRole,
        entry.weightPercent,
        entry.cognitiveGroup,
        entry.unlockAfterSlug,
        entry.cycleSortOrder,
        entry.blockMinutes,
        row.id,
      ],
    );
  }
}
