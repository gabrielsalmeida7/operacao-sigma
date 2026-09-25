import { getDb } from "@/lib/db/client";
import { todayKey, weekKey, nowIso } from "@/lib/dates";
import type { MissionProgress, MissionTemplate } from "@/lib/db/types";
import { applyXpInternal } from "./xp-helper";
import type { CelebrationEvent } from "./events";

async function getOrCreateProgress(templateId: number, periodKey: string): Promise<MissionProgress> {
  const db = await getDb();
  const rows = await db.select<MissionProgress[]>(
    "SELECT * FROM MissionProgress WHERE templateId = ? AND periodKey = ?",
    [templateId, periodKey],
  );
  if (rows[0]) return rows[0];

  await db.execute(
    "INSERT INTO MissionProgress (templateId, periodKey) VALUES (?, ?)",
    [templateId, periodKey],
  );
  const created = await db.select<MissionProgress[]>(
    "SELECT * FROM MissionProgress WHERE templateId = ? AND periodKey = ?",
    [templateId, periodKey],
  );
  return created[0];
}

export async function updateMissions(
  unit: "minutes" | "questions",
  amount: number,
): Promise<CelebrationEvent[]> {
  const db = await getDb();
  const templates = await db.select<MissionTemplate[]>(
    "SELECT * FROM MissionTemplate WHERE unit = ?",
    [unit === "minutes" ? "minutes" : "questions"],
  );

  const dayKey = todayKey();
  const wKey = weekKey();
  const events: CelebrationEvent[] = [];

  for (const template of templates) {
    const periodKey = template.type === "DAILY" ? dayKey : wKey;
    const progress = await getOrCreateProgress(template.id, periodKey);

    if (progress.completed) continue;

    const newCurrent = progress.current + amount;
    const completed = newCurrent >= template.target;

    await db.execute(
      "UPDATE MissionProgress SET current = ?, completed = ? WHERE id = ?",
      [newCurrent, completed ? 1 : 0, progress.id],
    );

    if (completed && !progress.rewarded) {
      await db.execute("UPDATE MissionProgress SET rewarded = 1 WHERE id = ?", [progress.id]);
      await db.execute(
        "INSERT INTO XpEvent (source, amount, metadataJson, createdAt) VALUES (?, ?, ?, ?)",
        ["MISSION", template.xpReward, JSON.stringify({ code: template.code, title: template.title }), nowIso()],
      );
      await applyXpInternal(template.xpReward);
      events.push({ type: "mission", title: template.title, xp: template.xpReward });
    }
  }

  return events;
}

export async function getMissionsWithProgress() {
  const db = await getDb();
  const templates = await db.select<MissionTemplate[]>("SELECT * FROM MissionTemplate ORDER BY type, id");
  const dayKey = todayKey();
  const wKey = weekKey();

  const result = [];
  for (const t of templates) {
    const periodKey = t.type === "DAILY" ? dayKey : wKey;
    const progress = await getOrCreateProgress(t.id, periodKey);
    result.push({ template: t, progress });
  }
  return result;
}
