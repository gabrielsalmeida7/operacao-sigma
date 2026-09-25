import { getDb } from "@/lib/db/client";
import { nowIso, todayKey, weekKey } from "@/lib/dates";
import type { Habit, HabitWithStats } from "@/lib/db/types";
import { HABIT_DEFAULT_XP } from "@/lib/gamification/constants";
import { buildHeatMapDays, computeHabitStreaks } from "@/lib/gamification/habitStreaks";

function mapHabit(row: Habit): Habit {
  return { ...row, isActive: Boolean(row.isActive) };
}

async function getCompletedDates(habitId: number): Promise<string[]> {
  const db = await getDb();
  const rows = await db.select<{ date: string }[]>(
    "SELECT date FROM HabitLog WHERE habitId = ? ORDER BY date",
    [habitId],
  );
  return rows.map((r) => r.date);
}

async function enrichHabit(row: Habit): Promise<HabitWithStats> {
  const db = await getDb();
  const today = todayKey();
  const completedDates = await getCompletedDates(row.id);
  const streaks = computeHabitStreaks(completedDates, today);
  const heatMap = buildHeatMapDays(new Set(completedDates));

  let lifeAreaName: string | null = null;
  let lifeAreaColor: string | null = null;
  if (row.lifeAreaId) {
    const areas = await db.select<{ name: string; color: string }[]>(
      "SELECT name, color FROM LifeArea WHERE id = ?",
      [row.lifeAreaId],
    );
    lifeAreaName = areas[0]?.name ?? null;
    lifeAreaColor = areas[0]?.color ?? null;
  }

  const wStart = weekKey();
  const weekCount = await db.select<{ count: number }[]>(
    "SELECT COUNT(*) as count FROM HabitLog WHERE habitId = ? AND date >= ?",
    [row.id, wStart],
  );

  return {
    ...mapHabit(row),
    lifeAreaName,
    lifeAreaColor,
    currentStreak: streaks.current,
    bestStreak: streaks.best,
    completedToday: completedDates.includes(today),
    heatMap,
    completionsThisWeek: weekCount[0]?.count ?? 0,
  };
}

export async function getHabits(includeInactive = false): Promise<HabitWithStats[]> {
  const db = await getDb();
  const rows = await db.select<Habit[]>(
    includeInactive
      ? "SELECT * FROM Habit ORDER BY isActive DESC, title"
      : "SELECT * FROM Habit WHERE isActive = 1 ORDER BY title",
  );
  return Promise.all(rows.map(enrichHabit));
}

export async function getHabitById(id: number): Promise<HabitWithStats | null> {
  const db = await getDb();
  const rows = await db.select<Habit[]>("SELECT * FROM Habit WHERE id = ?", [id]);
  if (!rows[0]) return null;
  return enrichHabit(rows[0]);
}

export interface CreateHabitInput {
  title: string;
  description?: string;
  lifeAreaId?: number | null;
  xpReward?: number;
}

export async function createHabit(input: CreateHabitInput): Promise<HabitWithStats> {
  const db = await getDb();
  const now = nowIso();
  await db.execute(
    `INSERT INTO Habit (title, description, lifeAreaId, xpReward, isActive, createdAt)
     VALUES (?, ?, ?, ?, 1, ?)`,
    [
      input.title.trim(),
      input.description?.trim() || null,
      input.lifeAreaId ?? null,
      input.xpReward ?? HABIT_DEFAULT_XP,
      now,
    ],
  );
  const rows = await db.select<Habit[]>("SELECT * FROM Habit ORDER BY id DESC LIMIT 1");
  return enrichHabit(rows[0]);
}

export interface UpdateHabitInput {
  title?: string;
  description?: string;
  lifeAreaId?: number | null;
  xpReward?: number;
  isActive?: boolean;
}

export async function updateHabit(id: number, input: UpdateHabitInput): Promise<void> {
  const db = await getDb();
  const current = await db.select<Habit[]>("SELECT * FROM Habit WHERE id = ?", [id]);
  if (!current[0]) return;
  const h = mapHabit(current[0]);

  await db.execute(
    `UPDATE Habit SET title = ?, description = ?, lifeAreaId = ?, xpReward = ?, isActive = ? WHERE id = ?`,
    [
      input.title?.trim() ?? h.title,
      input.description !== undefined ? input.description.trim() || null : h.description,
      input.lifeAreaId !== undefined ? input.lifeAreaId : h.lifeAreaId,
      input.xpReward ?? h.xpReward,
      input.isActive !== undefined ? (input.isActive ? 1 : 0) : h.isActive ? 1 : 0,
      id,
    ],
  );
}

export async function deleteHabit(id: number): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM HabitLog WHERE habitId = ?", [id]);
  await db.execute("DELETE FROM Habit WHERE id = ?", [id]);
}

export async function isHabitCompletedToday(habitId: number): Promise<boolean> {
  const db = await getDb();
  const rows = await db.select<{ count: number }[]>(
    "SELECT COUNT(*) as count FROM HabitLog WHERE habitId = ? AND date = ?",
    [habitId, todayKey()],
  );
  return (rows[0]?.count ?? 0) > 0;
}

export async function getTodayHabitLog(habitId: number) {
  const db = await getDb();
  const rows = await db.select<{ id: number; xpEarned: number }[]>(
    "SELECT id, xpEarned FROM HabitLog WHERE habitId = ? AND date = ?",
    [habitId, todayKey()],
  );
  return rows[0] ?? null;
}

export async function logHabitCompletion(habitId: number, xpEarned: number): Promise<void> {
  const db = await getDb();
  await db.execute(
    "INSERT INTO HabitLog (habitId, date, xpEarned, createdAt) VALUES (?, ?, ?, ?)",
    [habitId, todayKey(), xpEarned, nowIso()],
  );
}

export async function removeTodayHabitLog(habitId: number): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM HabitLog WHERE habitId = ? AND date = ?", [habitId, todayKey()]);
}
