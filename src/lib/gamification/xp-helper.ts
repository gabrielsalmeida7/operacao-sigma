import { getDb } from "@/lib/db/client";
import { nowIso } from "@/lib/dates";
import { levelFromXp } from "./levels";

export async function applyXpInternal(amount: number, disciplineId?: number | null): Promise<void> {
  const db = await getDb();
  const profiles = await db.select<{ totalXp: number }[]>("SELECT totalXp FROM UserProfile WHERE id = 1");
  const current = profiles[0]?.totalXp ?? 0;
  const newTotal = current + amount;
  const newLevel = levelFromXp(newTotal);

  await db.execute(
    "UPDATE UserProfile SET totalXp = ?, level = ?, updatedAt = ? WHERE id = 1",
    [newTotal, newLevel, nowIso()],
  );

  if (disciplineId) {
    const discs = await db.select<{ xp: number }[]>("SELECT xp FROM Discipline WHERE id = ?", [disciplineId]);
    if (discs[0]) {
      const discXp = discs[0].xp + amount;
      await db.execute(
        "UPDATE Discipline SET xp = ?, level = ? WHERE id = ?",
        [discXp, levelFromXp(discXp), disciplineId],
      );
    }
  }
}
