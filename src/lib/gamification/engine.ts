import { getDb } from "@/lib/db/client";
import { todayKey, nowIso } from "@/lib/dates";
import { levelFromXp, levelProgress } from "./levels";
import { getProfile, updateProfile } from "./profile";
import {
  XP_RATES,
  xpForQuestions,
  xpForStudyMinutes,
  POMODORO_BONUS_XP,
} from "./constants";
import { updateStreak } from "./streaks";
import { updateMissions } from "./missions";
import { checkAchievements } from "./achievements";
import { updateMonthlySnapshots } from "./snapshots";
import type { ActionResult, CelebrationEvent } from "./events";
import { emptyResult, mergeResults } from "./events";
import { getQuestById, markQuestCompleted } from "@/lib/db/repositories/quests";
import {
  getHabitById,
  getTodayHabitLog,
  logHabitCompletion,
  removeTodayHabitLog,
} from "@/lib/db/repositories/habits";
import {
  getProjectById,
  getProjectQuestStats,
  markProjectCompleted,
  syncProjectStatus,
} from "@/lib/db/repositories/projects";
import {
  getRewardById,
  recordRedemption,
} from "@/lib/db/repositories/rewards";
import { updateSegmentProgress } from "@/lib/db/repositories/disciplineTopics";

export { getProfile, updateProfile } from "./profile";

async function ensureDailyStats(date: string) {
  const db = await getDb();
  await db.execute(`INSERT OR IGNORE INTO DailyStats (date) VALUES (?)`, [date]);
}

async function addXpEvent(
  source: string,
  amount: number,
  disciplineId?: number | null,
  metadata?: Record<string, unknown>,
): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT INTO XpEvent (source, amount, metadataJson, disciplineId, createdAt) VALUES (?, ?, ?, ?, ?)`,
    [source, amount, JSON.stringify(metadata ?? {}), disciplineId ?? null, nowIso()],
  );
}

async function applyXp(
  amount: number,
  disciplineId?: number | null,
): Promise<{ profile: Awaited<ReturnType<typeof getProfile>>; events: CelebrationEvent[] }> {
  const profile = await getProfile();
  const prevLevel = profile.level;
  const newTotalXp = Math.max(0, profile.totalXp + amount);
  const newLevel = levelFromXp(newTotalXp);
  const events: CelebrationEvent[] = [];

  await updateProfile({ totalXp: newTotalXp, level: newLevel });
  if (newLevel > prevLevel) {
    events.push({ type: "level_up", level: newLevel });
  }

  if (disciplineId) {
    const db = await getDb();
    const discs = await db.select<{ xp: number; level: number; name: string }[]>(
      "SELECT xp, level, name FROM Discipline WHERE id = ?",
      [disciplineId],
    );
    if (discs[0]) {
      const prevDiscLevel = discs[0].level;
      const discXp = discs[0].xp + amount;
      const discLevel = levelFromXp(discXp);
      await db.execute(
        "UPDATE Discipline SET xp = ?, level = ? WHERE id = ?",
        [discXp, discLevel, disciplineId],
      );
      if (discLevel > prevDiscLevel) {
        events.push({ type: "discipline_level_up", name: discs[0].name, level: discLevel });
      }
    }
  }

  const updated = await getProfile();
  return { profile: updated, events };
}

export async function recordStudyMinutes(
  minutes: number,
  disciplineId?: number | null,
): Promise<ActionResult> {
  const profile = await getProfile();
  if (minutes <= 0) return emptyResult(profile);

  const db = await getDb();
  const date = todayKey();
  await ensureDailyStats(date);

  const xp = xpForStudyMinutes(minutes);

  await db.execute(
    `UPDATE DailyStats SET studyMinutes = studyMinutes + ?, xpEarned = xpEarned + ? WHERE date = ?`,
    [minutes, xp, date],
  );
  await addXpEvent("MINUTE_STUDIED", xp, disciplineId, { minutes });
  await updateProfile({ totalStudyMin: profile.totalStudyMin + minutes });

  const { profile: updated, events: xpEvents } = await applyXp(xp, disciplineId);
  let result = mergeResults({ profile: updated, events: xpEvents }, []);

  const missionEvents = await updateMissions("minutes", minutes);
  result = mergeResults(result, missionEvents);

  const goalEvents = await checkGoalAndStreak();
  result = mergeResults(result, goalEvents);

  const achievementEvents = await checkAchievements();
  result = mergeResults(result, achievementEvents);

  await updateMonthlySnapshots();
  return result;
}

export async function recordQuestions(
  resolved: number,
  correct: number,
  disciplineId?: number | null,
  isSimulado = false,
  options?: {
    topicId?: number | null;
    segment?: number | null;
    phase?: "PDF" | "QUESTIONS" | null;
  },
): Promise<ActionResult> {
  const profile = await getProfile();
  if (resolved <= 0 && !isSimulado) return emptyResult(profile);

  const db = await getDb();
  const date = todayKey();
  await ensureDailyStats(date);

  let xp = isSimulado ? XP_RATES.SIMULADO : xpForQuestions(resolved, correct);
  if (isSimulado) resolved = Math.max(resolved, 1);

  await db.execute(
    `INSERT INTO QuestionLog (resolvedCount, correctCount, disciplineId, topicId, segment, phase, isSimulado, xpEarned, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      resolved,
      correct,
      disciplineId ?? null,
      options?.topicId ?? null,
      options?.segment ?? null,
      options?.phase ?? null,
      isSimulado ? 1 : 0,
      xp,
      nowIso(),
    ],
  );

  if (!isSimulado) {
    await db.execute(
      `UPDATE DailyStats SET questionsResolved = questionsResolved + ?, questionsCorrect = questionsCorrect + ?, xpEarned = xpEarned + ? WHERE date = ?`,
      [resolved, correct, xp, date],
    );
    await updateProfile({
      totalQuestions: profile.totalQuestions + resolved,
      totalCorrect: profile.totalCorrect + correct,
    });
    if (disciplineId) {
      await db.execute(
        "UPDATE Discipline SET totalResolved = totalResolved + ?, totalCorrect = totalCorrect + ? WHERE id = ?",
        [resolved, correct, disciplineId],
      );
    }
    if (options?.topicId && options?.segment) {
      await updateSegmentProgress(options.topicId, options.segment, resolved, correct);
    } else if (options?.topicId) {
      await db.execute(
        "UPDATE DisciplineTopic SET totalResolved = totalResolved + ?, totalCorrect = totalCorrect + ? WHERE id = ?",
        [resolved, correct, options.topicId],
      );
    }
  }

  await addXpEvent(isSimulado ? "SIMULADO" : "QUESTIONS", xp, disciplineId, { resolved, correct });
  const { profile: updated, events: xpEvents } = await applyXp(xp, disciplineId);
  let result = mergeResults({ profile: updated, events: xpEvents }, []);

  if (!isSimulado) {
    const missionEvents = await updateMissions("questions", resolved);
    result = mergeResults(result, missionEvents);
  }

  const achievementEvents = await checkAchievements();
  result = mergeResults(result, achievementEvents);

  await updateMonthlySnapshots();
  return result;
}

async function checkGoalAndStreak(): Promise<CelebrationEvent[]> {
  const db = await getDb();
  const date = todayKey();
  const profile = await getProfile();
  const stats = await db.select<{ studyMinutes: number; goalMet: number }[]>(
    "SELECT studyMinutes, goalMet FROM DailyStats WHERE date = ?",
    [date],
  );

  if (!stats[0]) return [];
  const { studyMinutes, goalMet } = stats[0];

  if (!goalMet && studyMinutes >= profile.dailyGoalMin) {
    await db.execute("UPDATE DailyStats SET goalMet = 1 WHERE date = ?", [date]);
    await addXpEvent("DAILY_GOAL", XP_RATES.DAILY_GOAL);
    await applyXp(XP_RATES.DAILY_GOAL);
    await updateStreak(true);
    await checkAchievements();
    return [{ type: "daily_goal" }];
  }
  return [];
}

export async function refreshStreakOnLoad(): Promise<void> {
  await updateStreak(false);
}

export function getLevelProgress(totalXp: number) {
  return levelProgress(totalXp);
}

export async function completeQuest(questId: number): Promise<ActionResult> {
  const profile = await getProfile();
  const quest = await getQuestById(questId);
  if (!quest) return emptyResult(profile);
  if (quest.status === "DONE") return emptyResult(profile);

  await markQuestCompleted(questId);
  await addXpEvent("QUEST", quest.xpReward, quest.disciplineId, {
    questId: quest.id,
    title: quest.title,
  });

  const { profile: updated, events: xpEvents } = await applyXp(quest.xpReward, quest.disciplineId);
  let result = mergeResults({ profile: updated, events: xpEvents }, [
    { type: "quest", title: quest.title, xp: quest.xpReward },
  ]);

  const achievementEvents = await checkAchievements();
  result = mergeResults(result, achievementEvents);
  await updateMonthlySnapshots();

  if (quest.projectId) {
    await syncProjectStatus(quest.projectId);
    const projectEvents = await tryAutoCompleteProject(quest.projectId);
    result = mergeResults(result, projectEvents);
  }

  return result;
}

export async function completeProject(projectId: number): Promise<ActionResult> {
  const profile = await getProfile();
  const project = await getProjectById(projectId);
  if (!project || project.status === "DONE") return emptyResult(profile);

  await markProjectCompleted(projectId);
  await addXpEvent("PROJECT", project.xpReward, project.disciplineId, {
    projectId: project.id,
    title: project.title,
  });

  const { profile: updated, events: xpEvents } = await applyXp(project.xpReward, project.disciplineId);
  let result = mergeResults({ profile: updated, events: xpEvents }, [
    { type: "project", title: project.title, xp: project.xpReward },
  ]);

  const achievementEvents = await checkAchievements();
  result = mergeResults(result, achievementEvents);
  await updateMonthlySnapshots();

  return result;
}

async function tryAutoCompleteProject(projectId: number): Promise<CelebrationEvent[]> {
  const stats = await getProjectQuestStats(projectId);
  if (stats.total === 0 || stats.completed < stats.total) return [];
  const result = await completeProject(projectId);
  return result.events;
}

export async function toggleHabitToday(habitId: number): Promise<ActionResult & { completed: boolean }> {
  const profile = await getProfile();
  const habit = await getHabitById(habitId);
  if (!habit) return { ...emptyResult(profile), completed: false };

  const existing = await getTodayHabitLog(habitId);

  if (existing) {
    await removeTodayHabitLog(habitId);
    await addXpEvent("HABIT", -existing.xpEarned, null, {
      habitId,
      title: habit.title,
      undone: true,
    });
    const { profile: updated, events: xpEvents } = await applyXp(-existing.xpEarned);
    await updateMonthlySnapshots();
    return { profile: updated, events: xpEvents, completed: false };
  }

  await logHabitCompletion(habitId, habit.xpReward);
  await addXpEvent("HABIT", habit.xpReward, null, {
    habitId,
    title: habit.title,
  });

  const { profile: updated, events: xpEvents } = await applyXp(habit.xpReward);
  let result = mergeResults({ profile: updated, events: xpEvents }, [
    { type: "habit", title: habit.title, xp: habit.xpReward },
  ]);

  const achievementEvents = await checkAchievements();
  result = mergeResults(result, achievementEvents);
  await updateMonthlySnapshots();

  return { ...result, completed: true };
}

export async function completePomodoroFocus(
  minutes: number,
  disciplineId?: number | null,
): Promise<ActionResult> {
  let result = await recordStudyMinutes(minutes, disciplineId);
  await addXpEvent("POMODORO", POMODORO_BONUS_XP, disciplineId, { minutes });
  const { profile: updated, events: xpEvents } = await applyXp(POMODORO_BONUS_XP, disciplineId);
  result = mergeResults(
    { profile: updated, events: [...result.events, ...xpEvents] },
    [{ type: "pomodoro", minutes, xp: POMODORO_BONUS_XP }],
  );
  return result;
}

export async function redeemReward(rewardId: number): Promise<ActionResult & { success: boolean; error?: string }> {
  const profile = await getProfile();
  const reward = await getRewardById(rewardId);

  if (!reward || !reward.isActive) {
    return { ...emptyResult(profile), success: false, error: "Recompensa não encontrada" };
  }

  if (reward.xpCost <= 0) {
    return { ...emptyResult(profile), success: false, error: "Custo de XP inválido" };
  }

  if (profile.totalXp < reward.xpCost) {
    return {
      ...emptyResult(profile),
      success: false,
      error: `XP insuficiente (precisa ${reward.xpCost}, tem ${profile.totalXp})`,
    };
  }

  await recordRedemption(reward.id, reward.title, reward.xpCost);
  await addXpEvent("REWARD", -reward.xpCost, null, {
    rewardId: reward.id,
    title: reward.title,
  });

  const { profile: updated, events: xpEvents } = await applyXp(-reward.xpCost);
  const result = mergeResults({ profile: updated, events: xpEvents }, [
    { type: "reward", title: reward.title, xp: -reward.xpCost },
  ]);

  await updateMonthlySnapshots();
  return { ...result, success: true };
}
