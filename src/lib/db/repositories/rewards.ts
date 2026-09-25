import { getDb } from "@/lib/db/client";
import { nowIso } from "@/lib/dates";
import type { Reward, RewardRedemption, RewardWithStats } from "@/lib/db/types";
import { REWARD_DEFAULT_XP_COST } from "@/lib/gamification/constants";

function mapReward(row: Reward): Reward {
  return { ...row, isActive: Boolean(row.isActive) };
}

async function enrichReward(row: Reward): Promise<RewardWithStats> {
  const db = await getDb();
  const counts = await db.select<{ count: number }[]>(
    "SELECT COUNT(*) as count FROM RewardRedemption WHERE rewardId = ?",
    [row.id],
  );
  return {
    ...mapReward(row),
    timesRedeemed: counts[0]?.count ?? 0,
  };
}

export async function getRewards(includeInactive = false): Promise<RewardWithStats[]> {
  const db = await getDb();
  const rows = await db.select<Reward[]>(
    includeInactive
      ? "SELECT * FROM Reward ORDER BY isActive DESC, xpCost, title"
      : "SELECT * FROM Reward WHERE isActive = 1 ORDER BY xpCost, title",
  );
  return Promise.all(rows.map(enrichReward));
}

export async function getRewardById(id: number): Promise<RewardWithStats | null> {
  const db = await getDb();
  const rows = await db.select<Reward[]>("SELECT * FROM Reward WHERE id = ?", [id]);
  if (!rows[0]) return null;
  return enrichReward(rows[0]);
}

export interface CreateRewardInput {
  title: string;
  description?: string;
  xpCost?: number;
}

export async function createReward(input: CreateRewardInput): Promise<RewardWithStats> {
  const db = await getDb();
  const now = nowIso();
  const xpCost = input.xpCost ?? REWARD_DEFAULT_XP_COST;
  await db.execute(
    `INSERT INTO Reward (title, description, xpCost, isActive, createdAt, updatedAt)
     VALUES (?, ?, ?, 1, ?, ?)`,
    [input.title.trim(), input.description?.trim() || null, xpCost, now, now],
  );
  const rows = await db.select<Reward[]>("SELECT * FROM Reward ORDER BY id DESC LIMIT 1");
  return enrichReward(rows[0]!);
}

export interface UpdateRewardInput {
  title?: string;
  description?: string;
  xpCost?: number;
  isActive?: boolean;
}

export async function updateReward(id: number, input: UpdateRewardInput): Promise<RewardWithStats | null> {
  const db = await getDb();
  const existing = await getRewardById(id);
  if (!existing) return null;

  const now = nowIso();
  await db.execute(
    `UPDATE Reward SET title = ?, description = ?, xpCost = ?, isActive = ?, updatedAt = ? WHERE id = ?`,
    [
      input.title?.trim() ?? existing.title,
      input.description !== undefined ? (input.description.trim() || null) : existing.description,
      input.xpCost ?? existing.xpCost,
      input.isActive !== undefined ? (input.isActive ? 1 : 0) : (existing.isActive ? 1 : 0),
      now,
      id,
    ],
  );
  return getRewardById(id);
}

export async function deleteReward(id: number): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM Reward WHERE id = ?", [id]);
}

export async function recordRedemption(
  rewardId: number | null,
  title: string,
  xpSpent: number,
): Promise<RewardRedemption> {
  const db = await getDb();
  const now = nowIso();
  await db.execute(
    `INSERT INTO RewardRedemption (rewardId, title, xpSpent, redeemedAt) VALUES (?, ?, ?, ?)`,
    [rewardId, title, xpSpent, now],
  );
  const rows = await db.select<RewardRedemption[]>(
    "SELECT * FROM RewardRedemption ORDER BY id DESC LIMIT 1",
  );
  return rows[0]!;
}

export async function getRecentRedemptions(limit = 20): Promise<RewardRedemption[]> {
  const db = await getDb();
  return db.select<RewardRedemption[]>(
    "SELECT * FROM RewardRedemption ORDER BY redeemedAt DESC LIMIT ?",
    [limit],
  );
}
