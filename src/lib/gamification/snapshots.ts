import { getDb } from "@/lib/db/client";
import type { MonthlySnapshot } from "@/lib/db/types";

export async function updateMonthlySnapshots(): Promise<void> {
  const db = await getDb();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const stats = await db.select<{
    studyMinutes: number;
    questionsResolved: number;
    xpEarned: number;
  }[]>(
    `SELECT
      COALESCE(SUM(studyMinutes), 0) as studyMinutes,
      COALESCE(SUM(questionsResolved), 0) as questionsResolved,
      COALESCE(SUM(xpEarned), 0) as xpEarned
    FROM DailyStats
    WHERE date LIKE ?`,
    [`${year}-${month.toString().padStart(2, "0")}%`],
  );

  const s = stats[0];
  if (!s) return;

  await db.execute(
    `INSERT INTO MonthlySnapshot (year, month, studyMinutes, questionsResolved, xpEarned)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(year, month) DO UPDATE SET
       studyMinutes = excluded.studyMinutes,
       questionsResolved = excluded.questionsResolved,
       xpEarned = excluded.xpEarned`,
    [year, month, s.studyMinutes, s.questionsResolved, s.xpEarned],
  );
}

export async function getMonthlySnapshots(): Promise<MonthlySnapshot[]> {
  const db = await getDb();
  await updateMonthlySnapshots();
  return db.select<MonthlySnapshot[]>(
    "SELECT * FROM MonthlySnapshot ORDER BY year, month",
  );
}

export async function getTodayStats() {
  const db = await getDb();
  const today = new Date().toISOString().slice(0, 10);
  const rows = await db.select<{
    studyMinutes: number;
    questionsResolved: number;
    xpEarned: number;
    goalMet: number;
  }[]>("SELECT * FROM DailyStats WHERE date = ?", [today]);

  return rows[0] ?? { studyMinutes: 0, questionsResolved: 0, xpEarned: 0, goalMet: 0 };
}
