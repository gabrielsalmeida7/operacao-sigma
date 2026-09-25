import { getDb } from "@/lib/db/client";
import { nowIso } from "@/lib/dates";
import type { UserProfile } from "@/lib/db/types";

export async function getProfile(): Promise<UserProfile> {
  const db = await getDb();
  const rows = await db.select<UserProfile[]>("SELECT * FROM UserProfile WHERE id = 1");
  return rows[0];
}

export async function updateProfile(data: Partial<UserProfile>): Promise<void> {
  const db = await getDb();
  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.name !== undefined) { fields.push("name = ?"); values.push(data.name); }
  if (data.dailyGoalMin !== undefined) { fields.push("dailyGoalMin = ?"); values.push(data.dailyGoalMin); }
  if (data.totalXp !== undefined) { fields.push("totalXp = ?"); values.push(data.totalXp); }
  if (data.level !== undefined) { fields.push("level = ?"); values.push(data.level); }
  if (data.currentStreak !== undefined) { fields.push("currentStreak = ?"); values.push(data.currentStreak); }
  if (data.bestStreak !== undefined) { fields.push("bestStreak = ?"); values.push(data.bestStreak); }
  if (data.lastStreakDate !== undefined) { fields.push("lastStreakDate = ?"); values.push(data.lastStreakDate); }
  if (data.totalStudyMin !== undefined) { fields.push("totalStudyMin = ?"); values.push(data.totalStudyMin); }
  if (data.totalQuestions !== undefined) { fields.push("totalQuestions = ?"); values.push(data.totalQuestions); }
  if (data.totalCorrect !== undefined) { fields.push("totalCorrect = ?"); values.push(data.totalCorrect); }

  fields.push("updatedAt = ?");
  values.push(nowIso());

  if (fields.length > 0) {
    await db.execute(`UPDATE UserProfile SET ${fields.join(", ")} WHERE id = 1`, values);
  }
}
