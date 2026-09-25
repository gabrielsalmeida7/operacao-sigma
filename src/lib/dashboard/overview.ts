import { endOfWeek, format, startOfWeek } from "date-fns";
import { getDb } from "@/lib/db/client";
import { weekKey } from "@/lib/dates";
import { getActiveLifeAreas } from "@/lib/db/repositories/lifeAreas";
import { getQuestCounts, getQuests } from "@/lib/db/repositories/quests";
import { getHabits } from "@/lib/db/repositories/habits";
import { getActiveProjects } from "@/lib/db/repositories/projects";
import { getMissionsWithProgress } from "@/lib/gamification/missions";
import type { HabitWithStats, ProjectWithDetails, QuestWithDetails } from "@/lib/db/types";

export interface LifeAreaRadarPoint {
  area: string;
  fullName: string;
  score: number;
  color: string;
  studyMinutes: number;
  habitsDone: number;
  questsDone: number;
}

export interface DashboardWeeklyStats {
  studyMinutes: number;
  questionsResolved: number;
  xpEarned: number;
  goalsMet: number;
}

export interface DashboardOverview {
  lifeAreaRadar: LifeAreaRadarPoint[];
  weekly: DashboardWeeklyStats;
  questCounts: Awaited<ReturnType<typeof getQuestCounts>>;
  priorityQuests: QuestWithDetails[];
  habits: {
    total: number;
    completedToday: number;
    pending: HabitWithStats[];
  };
  missions: Awaited<ReturnType<typeof getMissionsWithProgress>>;
  activeProjects: ProjectWithDetails[];
}

function shortAreaName(name: string): string {
  if (name.length <= 14) return name;
  if (name.toLowerCase().includes("desenvolvimento")) return "Dev. Pessoal";
  return `${name.slice(0, 12)}…`;
}

function normalize(values: number[]): number[] {
  const max = Math.max(...values, 1);
  return values.map((v) => Math.round((v / max) * 100) / 100);
}

async function getWeeklyStats(): Promise<DashboardWeeklyStats> {
  const db = await getDb();
  const start = weekKey();
  const end = format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");

  const rows = await db.select<{
    studyMinutes: number;
    questionsResolved: number;
    xpEarned: number;
    goalsMet: number;
  }[]>(
    `SELECT
      COALESCE(SUM(studyMinutes), 0) as studyMinutes,
      COALESCE(SUM(questionsResolved), 0) as questionsResolved,
      COALESCE(SUM(xpEarned), 0) as xpEarned,
      COALESCE(SUM(goalMet), 0) as goalsMet
    FROM DailyStats WHERE date >= ? AND date <= ?`,
    [start, end],
  );

  const s = rows[0];
  return {
    studyMinutes: s?.studyMinutes ?? 0,
    questionsResolved: s?.questionsResolved ?? 0,
    xpEarned: s?.xpEarned ?? 0,
    goalsMet: s?.goalsMet ?? 0,
  };
}

async function getLifeAreaRadarData(): Promise<LifeAreaRadarPoint[]> {
  const db = await getDb();
  const wStart = weekKey();
  const areas = await getActiveLifeAreas();

  if (areas.length === 0) return [];

  const habitCounts = await db.select<{ lifeAreaId: number | null; count: number }[]>(
    `SELECT h.lifeAreaId, COUNT(*) as count
     FROM HabitLog hl
     JOIN Habit h ON h.id = hl.habitId
     WHERE hl.date >= ?
     GROUP BY h.lifeAreaId`,
    [wStart],
  );

  const questCounts = await db.select<{ lifeAreaId: number | null; count: number }[]>(
    `SELECT lifeAreaId, COUNT(*) as count
     FROM Quest
     WHERE status = 'DONE' AND completedAt >= ?
     GROUP BY lifeAreaId`,
    [wStart],
  );

  const studyMinutes: number[] = [];
  const habitsDone: number[] = [];
  const questsDone: number[] = [];

  for (const area of areas) {
    const sessionStats = await db.select<{ minutes: number }[]>(
      `SELECT COALESCE(SUM(s.durationSec), 0) / 60 as minutes
       FROM StudySession s
       JOIN Discipline d ON d.id = s.disciplineId
       WHERE d.lifeAreaId = ? AND s.startedAt >= ?`,
      [area.id, wStart],
    );

    studyMinutes.push(Math.floor(sessionStats[0]?.minutes ?? 0));
    habitsDone.push(habitCounts.find((h) => h.lifeAreaId === area.id)?.count ?? 0);
    questsDone.push(questCounts.find((q) => q.lifeAreaId === area.id)?.count ?? 0);
  }

  const studyNorm = normalize(studyMinutes);
  const habitsNorm = normalize(habitsDone);
  const questsNorm = normalize(questsDone);

  return areas.map((area, i) => ({
    area: shortAreaName(area.name),
    fullName: area.name,
    color: area.color,
    studyMinutes: studyMinutes[i] ?? 0,
    habitsDone: habitsDone[i] ?? 0,
    questsDone: questsDone[i] ?? 0,
    score: Math.round(((studyNorm[i]! + habitsNorm[i]! + questsNorm[i]!) / 3) * 100) / 100,
  }));
}

async function getPriorityQuests(): Promise<QuestWithDetails[]> {
  const overdue = await getQuests("overdue");
  const today = await getQuests("today");
  const inProgress = await getQuests("in_progress");

  const seen = new Set<number>();
  const result: QuestWithDetails[] = [];

  for (const list of [overdue, today, inProgress]) {
    for (const quest of list) {
      if (seen.has(quest.id) || result.length >= 5) continue;
      seen.add(quest.id);
      result.push(quest);
    }
  }

  return result;
}

export async function getDashboardOverview(): Promise<DashboardOverview> {
  const [lifeAreaRadar, weekly, questCounts, priorityQuests, habitsList, missions, projects] =
    await Promise.all([
      getLifeAreaRadarData(),
      getWeeklyStats(),
      getQuestCounts(),
      getPriorityQuests(),
      getHabits(false),
      getMissionsWithProgress(),
      getActiveProjects(),
    ]);

  const activeProjects = projects
    .filter((p) => p.status !== "DONE")
    .sort((a, b) => {
      if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return 0;
    })
    .slice(0, 3);

  return {
    lifeAreaRadar,
    weekly,
    questCounts,
    priorityQuests,
    habits: {
      total: habitsList.length,
      completedToday: habitsList.filter((h) => h.completedToday).length,
      pending: habitsList.filter((h) => !h.completedToday).slice(0, 4),
    },
    missions,
    activeProjects,
  };
}

export function getWeekRangeLabel(): string {
  const start = startOfWeek(new Date(), { weekStartsOn: 1 });
  const end = endOfWeek(new Date(), { weekStartsOn: 1 });
  return `${format(start, "d MMM")} – ${format(end, "d MMM")}`;
}
