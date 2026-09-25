import { getDb } from "@/lib/db/client";
import { daysUntil, nowIso, todayKey } from "@/lib/dates";
import type {
  Project,
  ProjectQuestStats,
  ProjectStatus,
  ProjectWithDetails,
  QuestPriority,
  QuestWithDetails,
} from "@/lib/db/types";
import { PROJECT_DEFAULT_XP, QUEST_DEFAULT_XP } from "@/lib/gamification/constants";
import { getQuestById } from "@/lib/db/repositories/quests";

export type ProjectFilter = "active" | "in_progress" | "overdue" | "done";

function mapProject(row: Project): Project {
  return {
    ...row,
    priority: row.priority as QuestPriority,
    status: row.status as ProjectStatus,
  };
}

export async function getProjectQuestStats(projectId: number): Promise<ProjectQuestStats> {
  const db = await getDb();
  const stats = await db.select<{ total: number; completed: number; inProgress: number }[]>(
    `SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'DONE' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as inProgress
     FROM Quest WHERE projectId = ?`,
    [projectId],
  );
  const s = stats[0] ?? { total: 0, completed: 0, inProgress: 0 };
  const progressPercent = s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0;
  return {
    total: s.total,
    completed: s.completed,
    inProgress: s.inProgress,
    progressPercent,
  };
}

async function enrichProjects(rows: Project[]): Promise<ProjectWithDetails[]> {
  if (rows.length === 0) return [];

  const db = await getDb();
  const today = todayKey();
  const areaIds = [...new Set(rows.map((r) => r.lifeAreaId).filter(Boolean))] as number[];
  const discIds = [...new Set(rows.map((r) => r.disciplineId).filter(Boolean))] as number[];

  const areas =
    areaIds.length > 0
      ? await db.select<{ id: number; name: string; color: string }[]>(
          `SELECT id, name, color FROM LifeArea WHERE id IN (${areaIds.map(() => "?").join(",")})`,
          areaIds,
        )
      : [];

  const discs =
    discIds.length > 0
      ? await db.select<{ id: number; name: string }[]>(
          `SELECT id, name FROM Discipline WHERE id IN (${discIds.map(() => "?").join(",")})`,
          discIds,
        )
      : [];

  const areaMap = new Map(areas.map((a) => [a.id, a]));
  const discMap = new Map(discs.map((d) => [d.id, d]));

  const result: ProjectWithDetails[] = [];
  for (const row of rows) {
    const mapped = mapProject(row);
    const questStats = await getProjectQuestStats(row.id);
    const area = row.lifeAreaId ? areaMap.get(row.lifeAreaId) : undefined;
    const disc = row.disciplineId ? discMap.get(row.disciplineId) : undefined;

    result.push({
      ...mapped,
      lifeAreaName: area?.name ?? null,
      lifeAreaColor: area?.color ?? null,
      disciplineName: disc?.name ?? null,
      isOverdue: Boolean(mapped.dueDate && mapped.dueDate < today && mapped.status !== "DONE"),
      daysRemaining: mapped.dueDate && mapped.status !== "DONE" ? daysUntil(mapped.dueDate) : null,
      questStats,
    });
  }

  return result;
}

function matchesFilter(project: ProjectWithDetails, filter: ProjectFilter): boolean {
  switch (filter) {
    case "active":
      return project.status !== "DONE";
    case "in_progress":
      return project.status === "IN_PROGRESS";
    case "overdue":
      return project.isOverdue;
    case "done":
      return project.status === "DONE";
    default: {
      const _exhaustive: never = filter;
      return _exhaustive;
    }
  }
}

export async function getProjects(filter: ProjectFilter = "active"): Promise<ProjectWithDetails[]> {
  const db = await getDb();
  const rows = await db.select<Project[]>(
    "SELECT * FROM Project ORDER BY CASE WHEN status = 'DONE' THEN 1 ELSE 0 END, dueDate IS NULL, dueDate ASC, createdAt DESC",
  );
  const enriched = await enrichProjects(rows);
  return enriched.filter((p) => matchesFilter(p, filter));
}

export async function getActiveProjects(): Promise<ProjectWithDetails[]> {
  return getProjects("active");
}

export async function getProjectById(id: number): Promise<ProjectWithDetails | null> {
  const db = await getDb();
  const rows = await db.select<Project[]>("SELECT * FROM Project WHERE id = ?", [id]);
  if (!rows[0]) return null;
  const enriched = await enrichProjects([rows[0]]);
  return enriched[0];
}

export async function getProjectQuests(projectId: number): Promise<QuestWithDetails[]> {
  const db = await getDb();
  const rows = await db.select<{ id: number }[]>(
    "SELECT id FROM Quest WHERE projectId = ? ORDER BY CASE WHEN status = 'DONE' THEN 1 ELSE 0 END, dueDate IS NULL, dueDate ASC",
    [projectId],
  );
  const quests: QuestWithDetails[] = [];
  for (const row of rows) {
    const q = await getQuestById(row.id);
    if (q) quests.push(q);
  }
  return quests;
}

export interface CreateProjectInput {
  title: string;
  description?: string;
  lifeAreaId?: number | null;
  disciplineId?: number | null;
  priority?: QuestPriority;
  xpReward?: number;
  dueDate?: string | null;
}

export async function createProject(input: CreateProjectInput): Promise<ProjectWithDetails> {
  const db = await getDb();
  const now = nowIso();
  const priority = input.priority ?? "MEDIUM";

  await db.execute(
    `INSERT INTO Project (title, description, lifeAreaId, disciplineId, priority, status, xpReward, dueDate, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, 'NOT_STARTED', ?, ?, ?, ?)`,
    [
      input.title.trim(),
      input.description?.trim() || null,
      input.lifeAreaId ?? null,
      input.disciplineId ?? null,
      priority,
      input.xpReward ?? PROJECT_DEFAULT_XP,
      input.dueDate || null,
      now,
      now,
    ],
  );

  const rows = await db.select<Project[]>("SELECT * FROM Project ORDER BY id DESC LIMIT 1");
  const enriched = await enrichProjects([rows[0]]);
  return enriched[0];
}

export interface UpdateProjectInput {
  title?: string;
  description?: string;
  lifeAreaId?: number | null;
  disciplineId?: number | null;
  priority?: QuestPriority;
  xpReward?: number;
  dueDate?: string | null;
  status?: ProjectStatus;
}

export async function updateProject(id: number, input: UpdateProjectInput): Promise<void> {
  const db = await getDb();
  const current = await db.select<Project[]>("SELECT * FROM Project WHERE id = ?", [id]);
  if (!current[0]) return;

  const p = mapProject(current[0]);

  await db.execute(
    `UPDATE Project SET
      title = ?,
      description = ?,
      lifeAreaId = ?,
      disciplineId = ?,
      priority = ?,
      xpReward = ?,
      dueDate = ?,
      status = ?,
      updatedAt = ?
     WHERE id = ?`,
    [
      input.title?.trim() ?? p.title,
      input.description !== undefined ? input.description.trim() || null : p.description,
      input.lifeAreaId !== undefined ? input.lifeAreaId : p.lifeAreaId,
      input.disciplineId !== undefined ? input.disciplineId : p.disciplineId,
      input.priority ?? p.priority,
      input.xpReward ?? p.xpReward,
      input.dueDate !== undefined ? input.dueDate || null : p.dueDate,
      input.status ?? p.status,
      nowIso(),
      id,
    ],
  );
}

export async function deleteProject(id: number): Promise<void> {
  const db = await getDb();
  await db.execute("UPDATE Quest SET projectId = NULL WHERE projectId = ?", [id]);
  await db.execute("DELETE FROM Project WHERE id = ?", [id]);
}

export async function syncProjectStatus(projectId: number): Promise<void> {
  const db = await getDb();
  const project = await db.select<Project[]>("SELECT * FROM Project WHERE id = ?", [projectId]);
  if (!project[0] || mapProject(project[0]).status === "DONE") return;

  const stats = await getProjectQuestStats(projectId);
  let status: ProjectStatus = "NOT_STARTED";
  if (stats.inProgress > 0 || stats.completed > 0) {
    status = "IN_PROGRESS";
  }

  await db.execute(
    "UPDATE Project SET status = ?, updatedAt = ? WHERE id = ?",
    [status, nowIso(), projectId],
  );
}

export async function markProjectCompleted(id: number): Promise<Project> {
  const db = await getDb();
  const now = nowIso();
  await db.execute(
    "UPDATE Project SET status = 'DONE', completedAt = ?, updatedAt = ? WHERE id = ?",
    [now, now, id],
  );
  const rows = await db.select<Project[]>("SELECT * FROM Project WHERE id = ?", [id]);
  return mapProject(rows[0]);
}

export async function getProjectCounts(): Promise<Record<ProjectFilter, number>> {
  const db = await getDb();
  const rows = await db.select<Project[]>("SELECT * FROM Project");
  const enriched = await enrichProjects(rows);
  return {
    active: enriched.filter((p) => matchesFilter(p, "active")).length,
    in_progress: enriched.filter((p) => matchesFilter(p, "in_progress")).length,
    overdue: enriched.filter((p) => matchesFilter(p, "overdue")).length,
    done: enriched.filter((p) => matchesFilter(p, "done")).length,
  };
}

export async function linkQuestToProject(questId: number, projectId: number | null): Promise<void> {
  const db = await getDb();
  await db.execute(
    "UPDATE Quest SET projectId = ?, updatedAt = ? WHERE id = ?",
    [projectId, nowIso(), questId],
  );
  if (projectId) {
    await syncProjectStatus(projectId);
  }
}

export async function createQuestForProject(projectId: number, title: string): Promise<void> {
  const project = await getProjectById(projectId);
  if (!project) return;

  const db = await getDb();
  const now = nowIso();
  await db.execute(
    `INSERT INTO Quest (title, lifeAreaId, disciplineId, projectId, priority, status, xpReward, dueDate, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, 'NOT_STARTED', ?, ?, ?, ?)`,
    [
      title.trim(),
      project.lifeAreaId,
      project.disciplineId,
      projectId,
      project.priority,
      QUEST_DEFAULT_XP[project.priority],
      project.dueDate,
      now,
      now,
    ],
  );
  await syncProjectStatus(projectId);
}
