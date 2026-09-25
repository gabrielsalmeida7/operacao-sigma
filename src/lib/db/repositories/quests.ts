import { getDb } from "@/lib/db/client";
import { nowIso, todayKey } from "@/lib/dates";
import type { Quest, QuestPriority, QuestStatus, QuestWithDetails } from "@/lib/db/types";
import { QUEST_DEFAULT_XP } from "@/lib/gamification/constants";

export type QuestFilter = "all" | "today" | "overdue" | "in_progress" | "done";

function mapQuest(row: Quest): Quest {
  return {
    ...row,
    priority: row.priority as QuestPriority,
    status: row.status as QuestStatus,
    projectId: row.projectId ?? null,
  };
}

function enrichQuest(row: Quest): QuestWithDetails {
  const today = todayKey();
  const mapped = mapQuest(row);
  return {
    ...mapped,
    lifeAreaName: null,
    lifeAreaColor: null,
    disciplineName: null,
    projectTitle: null,
    isOverdue: Boolean(
      mapped.dueDate && mapped.dueDate < today && mapped.status !== "DONE",
    ),
    isDueToday: mapped.dueDate === today,
  };
}

async function enrichQuests(rows: Quest[]): Promise<QuestWithDetails[]> {
  if (rows.length === 0) return [];

  const db = await getDb();
  const areaIds = [...new Set(rows.map((r) => r.lifeAreaId).filter(Boolean))] as number[];
  const discIds = [...new Set(rows.map((r) => r.disciplineId).filter(Boolean))] as number[];
  const projectIds = [...new Set(rows.map((r) => r.projectId).filter(Boolean))] as number[];

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

  const projects =
    projectIds.length > 0
      ? await db.select<{ id: number; title: string }[]>(
          `SELECT id, title FROM Project WHERE id IN (${projectIds.map(() => "?").join(",")})`,
          projectIds,
        )
      : [];

  const areaMap = new Map(areas.map((a) => [a.id, a]));
  const discMap = new Map(discs.map((d) => [d.id, d]));
  const projectMap = new Map(projects.map((p) => [p.id, p]));

  return rows.map((row) => {
    const base = enrichQuest(row);
    const area = row.lifeAreaId ? areaMap.get(row.lifeAreaId) : undefined;
    const disc = row.disciplineId ? discMap.get(row.disciplineId) : undefined;
    const project = row.projectId ? projectMap.get(row.projectId) : undefined;
    return {
      ...base,
      lifeAreaName: area?.name ?? null,
      lifeAreaColor: area?.color ?? null,
      disciplineName: disc?.name ?? null,
      projectTitle: project?.title ?? null,
    };
  });
}

function matchesFilter(quest: QuestWithDetails, filter: QuestFilter): boolean {
  switch (filter) {
    case "all":
      return quest.status !== "DONE";
    case "today":
      return quest.status !== "DONE" && (quest.isDueToday || (!quest.dueDate && quest.status === "NOT_STARTED"));
    case "overdue":
      return quest.isOverdue;
    case "in_progress":
      return quest.status === "IN_PROGRESS";
    case "done":
      return quest.status === "DONE";
    default: {
      const _exhaustive: never = filter;
      return _exhaustive;
    }
  }
}

export async function getQuests(filter: QuestFilter = "all"): Promise<QuestWithDetails[]> {
  const db = await getDb();
  const rows = await db.select<Quest[]>(
    "SELECT * FROM Quest ORDER BY CASE WHEN status = 'DONE' THEN 1 ELSE 0 END, dueDate IS NULL, dueDate ASC, createdAt DESC",
  );
  const enriched = await enrichQuests(rows);
  return enriched.filter((q) => matchesFilter(q, filter));
}

export async function getQuestById(id: number): Promise<QuestWithDetails | null> {
  const db = await getDb();
  const rows = await db.select<Quest[]>("SELECT * FROM Quest WHERE id = ?", [id]);
  if (!rows[0]) return null;
  const enriched = await enrichQuests([rows[0]]);
  return enriched[0];
}

export interface CreateQuestInput {
  title: string;
  description?: string;
  lifeAreaId?: number | null;
  disciplineId?: number | null;
  projectId?: number | null;
  priority?: QuestPriority;
  xpReward?: number;
  dueDate?: string | null;
}

export async function createQuest(input: CreateQuestInput): Promise<QuestWithDetails> {
  const db = await getDb();
  const now = nowIso();
  const priority = input.priority ?? "MEDIUM";
  const xpReward = input.xpReward ?? QUEST_DEFAULT_XP[priority];

  await db.execute(
    `INSERT INTO Quest (title, description, lifeAreaId, disciplineId, projectId, priority, status, xpReward, dueDate, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, 'NOT_STARTED', ?, ?, ?, ?)`,
    [
      input.title.trim(),
      input.description?.trim() || null,
      input.lifeAreaId ?? null,
      input.disciplineId ?? null,
      input.projectId ?? null,
      priority,
      xpReward,
      input.dueDate || null,
      now,
      now,
    ],
  );

  const rows = await db.select<Quest[]>("SELECT * FROM Quest ORDER BY id DESC LIMIT 1");
  const enriched = await enrichQuests([rows[0]]);
  return enriched[0];
}

export interface UpdateQuestInput {
  title?: string;
  description?: string;
  lifeAreaId?: number | null;
  disciplineId?: number | null;
  projectId?: number | null;
  priority?: QuestPriority;
  xpReward?: number;
  dueDate?: string | null;
  status?: QuestStatus;
}

export async function updateQuest(id: number, input: UpdateQuestInput): Promise<void> {
  const db = await getDb();
  const current = await db.select<Quest[]>("SELECT * FROM Quest WHERE id = ?", [id]);
  if (!current[0]) return;

  const q = mapQuest(current[0]);
  const priority = input.priority ?? q.priority;
  const xpReward = input.xpReward ?? (input.priority ? QUEST_DEFAULT_XP[priority] : q.xpReward);

  await db.execute(
    `UPDATE Quest SET
      title = ?,
      description = ?,
      lifeAreaId = ?,
      disciplineId = ?,
      projectId = ?,
      priority = ?,
      xpReward = ?,
      dueDate = ?,
      status = ?,
      updatedAt = ?
     WHERE id = ?`,
    [
      input.title?.trim() ?? q.title,
      input.description !== undefined ? input.description.trim() || null : q.description,
      input.lifeAreaId !== undefined ? input.lifeAreaId : q.lifeAreaId,
      input.disciplineId !== undefined ? input.disciplineId : q.disciplineId,
      input.projectId !== undefined ? input.projectId : q.projectId,
      priority,
      xpReward,
      input.dueDate !== undefined ? input.dueDate || null : q.dueDate,
      input.status ?? q.status,
      nowIso(),
      id,
    ],
  );
}

export async function deleteQuest(id: number): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM Quest WHERE id = ?", [id]);
}

export async function setQuestStatus(id: number, status: QuestStatus): Promise<void> {
  const db = await getDb();
  await db.execute("UPDATE Quest SET status = ?, updatedAt = ? WHERE id = ?", [status, nowIso(), id]);
}

export async function markQuestCompleted(id: number): Promise<Quest> {
  const db = await getDb();
  const now = nowIso();
  await db.execute(
    "UPDATE Quest SET status = 'DONE', completedAt = ?, updatedAt = ? WHERE id = ?",
    [now, now, id],
  );
  const rows = await db.select<Quest[]>("SELECT * FROM Quest WHERE id = ?", [id]);
  return mapQuest(rows[0]);
}

export async function getQuestCounts(): Promise<Record<QuestFilter, number>> {
  const db = await getDb();
  const rows = await db.select<Quest[]>("SELECT * FROM Quest");
  const allEnriched = await enrichQuests(rows);
  return {
    all: allEnriched.filter((q) => matchesFilter(q, "all")).length,
    today: allEnriched.filter((q) => matchesFilter(q, "today")).length,
    overdue: allEnriched.filter((q) => matchesFilter(q, "overdue")).length,
    in_progress: allEnriched.filter((q) => matchesFilter(q, "in_progress")).length,
    done: allEnriched.filter((q) => matchesFilter(q, "done")).length,
  };
}
