import { getDb } from "@/lib/db/client";
import { todayKey, nowIso } from "@/lib/dates";
import type { DailyCheckIn } from "@/lib/db/types";

export async function getTodayCheckIn(): Promise<DailyCheckIn | null> {
  const db = await getDb();
  const rows = await db.select<DailyCheckIn[]>(
    "SELECT * FROM DailyCheckIn WHERE date = ?",
    [todayKey()],
  );
  return rows[0] ?? null;
}

export async function createCheckIn(missionText: string): Promise<DailyCheckIn> {
  const db = await getDb();
  const date = todayKey();
  await db.execute(
    `INSERT OR REPLACE INTO DailyCheckIn (date, missionText, completed, createdAt) VALUES (?, ?, 0, ?)`,
    [date, missionText, nowIso()],
  );
  const rows = await db.select<DailyCheckIn[]>("SELECT * FROM DailyCheckIn WHERE date = ?", [date]);
  return rows[0];
}

export async function completeCheckIn(completed: boolean): Promise<void> {
  const db = await getDb();
  await db.execute(
    "UPDATE DailyCheckIn SET completed = ? WHERE date = ?",
    [completed ? 1 : 0, todayKey()],
  );
}
