import { getDb } from "@/lib/db/client";
import { nowIso } from "@/lib/dates";
import type { Achievement } from "@/lib/db/types";
import { applyXpInternal } from "./xp-helper";
import type { CelebrationEvent } from "./events";

export async function checkAchievements(): Promise<CelebrationEvent[]> {
  const db = await getDb();
  const profile = await db.select<{
    currentStreak: number;
    totalQuestions: number;
    totalStudyMin: number;
  }[]>("SELECT currentStreak, totalQuestions, totalStudyMin FROM UserProfile WHERE id = 1");

  const p = profile[0];
  if (!p) return [];

  const unlocked = await db.select<{ achievementId: number }[]>(
    "SELECT achievementId FROM UserAchievement",
  );
  const unlockedIds = new Set(unlocked.map((u) => u.achievementId));

  const all = await db.select<Achievement[]>("SELECT * FROM Achievement");
  const events: CelebrationEvent[] = [];

  for (const a of all) {
    if (unlockedIds.has(a.id)) continue;

    let met = false;
    switch (a.category) {
      case "consistency":
        if (a.code === "first_day") {
          const days = await db.select<{ count: number }[]>(
            "SELECT COUNT(*) as count FROM DailyStats WHERE goalMet = 1",
          );
          met = (days[0]?.count ?? 0) >= 1;
        } else {
          met = p.currentStreak >= a.threshold;
        }
        break;
      case "questions":
        met = p.totalQuestions >= a.threshold;
        break;
      case "hours":
        met = p.totalStudyMin >= a.threshold;
        break;
    }

    if (met) {
      await db.execute(
        "INSERT INTO UserAchievement (achievementId, unlockedAt) VALUES (?, ?)",
        [a.id, nowIso()],
      );
      if (a.xpReward > 0) {
        await db.execute(
          "INSERT INTO XpEvent (source, amount, metadataJson, createdAt) VALUES (?, ?, ?, ?)",
          ["ACHIEVEMENT", a.xpReward, JSON.stringify({ code: a.code, title: a.title }), nowIso()],
        );
        await applyXpInternal(a.xpReward);
      }
      events.push({ type: "achievement", title: a.title, xp: a.xpReward });
    }
  }

  return events;
}

export async function getAchievementsWithStatus() {
  const db = await getDb();
  const achievements = await db.select<Achievement[]>("SELECT * FROM Achievement ORDER BY category, threshold");
  const unlocked = await db.select<{ achievementId: number; unlockedAt: string }[]>(
    "SELECT achievementId, unlockedAt FROM UserAchievement",
  );
  const map = new Map(unlocked.map((u) => [u.achievementId, u.unlockedAt]));

  return achievements.map((a) => ({
    ...a,
    unlocked: map.has(a.id),
    unlockedAt: map.get(a.id) ?? null,
  }));
}
