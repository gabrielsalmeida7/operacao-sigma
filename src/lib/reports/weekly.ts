import { getDb } from "@/lib/db/client";
import { weekKey } from "@/lib/dates";
import { getProfile } from "@/lib/gamification/profile";
import { computeAccuracy } from "@/lib/db/repositories/disciplines";
import { format, subWeeks, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface WeeklyReport {
  weekLabel: string;
  studyMinutes: number;
  questionsResolved: number;
  questionsCorrect: number;
  xpEarned: number;
  accuracyPercent: number | null;
  goalsMet: number;
  streak: number;
  prevWeek: {
    studyMinutes: number;
    questionsResolved: number;
    xpEarned: number;
    accuracyPercent: number | null;
  };
  deltas: {
    studyMinutes: number;
    questionsResolved: number;
    xpEarned: number;
  };
  bestDiscipline: { name: string; percent: number } | null;
  worstDiscipline: { name: string; percent: number } | null;
  dailyBreakdown: { day: string; label: string; minutes: number; questions: number }[];
}

async function weekStats(since: string, until: string) {
  const db = await getDb();
  const stats = await db.select<{
    studyMinutes: number;
    questionsResolved: number;
    questionsCorrect: number;
    xpEarned: number;
    goalsMet: number;
  }[]>(
    `SELECT
      COALESCE(SUM(studyMinutes), 0) as studyMinutes,
      COALESCE(SUM(questionsResolved), 0) as questionsResolved,
      COALESCE(SUM(questionsCorrect), 0) as questionsCorrect,
      COALESCE(SUM(xpEarned), 0) as xpEarned,
      COALESCE(SUM(goalMet), 0) as goalsMet
    FROM DailyStats WHERE date >= ? AND date <= ?`,
    [since, until],
  );
  return stats[0] ?? { studyMinutes: 0, questionsResolved: 0, questionsCorrect: 0, xpEarned: 0, goalsMet: 0 };
}

function deltaPercent(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

export async function generateWeeklyReport(): Promise<WeeklyReport> {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const prevStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
  const prevEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });

  const since = format(weekStart, "yyyy-MM-dd");
  const until = format(weekEnd, "yyyy-MM-dd");
  const prevSince = format(prevStart, "yyyy-MM-dd");
  const prevUntil = format(prevEnd, "yyyy-MM-dd");

  const current = await weekStats(since, until);
  const prev = await weekStats(prevSince, prevUntil);
  const profile = await getProfile();

  const accuracy = computeAccuracy(current.questionsResolved, current.questionsCorrect);
  const prevAccuracy = computeAccuracy(prev.questionsResolved, prev.questionsCorrect);

  const db = await getDb();
  const wKey = weekKey();
  const discStats = await db.select<{ name: string; resolved: number; correct: number }[]>(
    `SELECT d.name, COALESCE(SUM(q.resolvedCount), 0) as resolved, COALESCE(SUM(q.correctCount), 0) as correct
     FROM Discipline d
     LEFT JOIN QuestionLog q ON q.disciplineId = d.id AND q.createdAt >= ? AND q.isSimulado = 0
     GROUP BY d.id HAVING resolved > 0`,
    [wKey],
  );

  const ranked = discStats
    .map((d) => ({ name: d.name, ...computeAccuracy(d.resolved, d.correct) }))
    .filter((d) => d.percent !== null)
    .sort((a, b) => (b.percent ?? 0) - (a.percent ?? 0));

  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const dailyBreakdown = [];
  for (const day of days) {
    const key = format(day, "yyyy-MM-dd");
    const row = await db.select<{ studyMinutes: number; questionsResolved: number }[]>(
      "SELECT studyMinutes, questionsResolved FROM DailyStats WHERE date = ?",
      [key],
    );
    dailyBreakdown.push({
      day: key,
      label: format(day, "EEE", { locale: ptBR }),
      minutes: row[0]?.studyMinutes ?? 0,
      questions: row[0]?.questionsResolved ?? 0,
    });
  }

  return {
    weekLabel: format(weekStart, "dd MMM", { locale: ptBR }) + " – " + format(weekEnd, "dd MMM yyyy", { locale: ptBR }),
    studyMinutes: current.studyMinutes,
    questionsResolved: current.questionsResolved,
    questionsCorrect: current.questionsCorrect,
    xpEarned: current.xpEarned,
    accuracyPercent: accuracy.percent,
    goalsMet: current.goalsMet,
    streak: profile.currentStreak,
    prevWeek: {
      studyMinutes: prev.studyMinutes,
      questionsResolved: prev.questionsResolved,
      xpEarned: prev.xpEarned,
      accuracyPercent: prevAccuracy.percent,
    },
    deltas: {
      studyMinutes: deltaPercent(current.studyMinutes, prev.studyMinutes),
      questionsResolved: deltaPercent(current.questionsResolved, prev.questionsResolved),
      xpEarned: deltaPercent(current.xpEarned, prev.xpEarned),
    },
    bestDiscipline: ranked[0] ? { name: ranked[0].name, percent: ranked[0].percent! } : null,
    worstDiscipline: ranked.length > 1 ? { name: ranked[ranked.length - 1].name, percent: ranked[ranked.length - 1].percent! } : null,
    dailyBreakdown,
  };
}
