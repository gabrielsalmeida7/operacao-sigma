import { getDb } from "@/lib/db/client";
import type { ActivityItem } from "@/lib/db/types";

export async function getRecentActivity(limit = 50, typeFilter?: ActivityItem["type"]): Promise<ActivityItem[]> {
  const db = await getDb();
  const items: ActivityItem[] = [];

  const sessions = await db.select<{
    id: number; durationSec: number; endedAt: string | null; startedAt: string;
    disciplineId: number | null; xpEarned: number;
  }[]>(
    "SELECT * FROM StudySession WHERE isActive = 0 AND endedAt IS NOT NULL ORDER BY endedAt DESC LIMIT ?",
    [limit],
  );

  for (const s of sessions) {
    let disciplineName: string | undefined;
    if (s.disciplineId) {
      const d = await db.select<{ name: string }[]>("SELECT name FROM Discipline WHERE id = ?", [s.disciplineId]);
      disciplineName = d[0]?.name;
    }
    const mins = Math.floor(s.durationSec / 60);
    items.push({
      id: `study-${s.id}`,
      type: "study",
      title: `Sessão de estudo — ${mins} min`,
      subtitle: disciplineName,
      xp: s.xpEarned,
      createdAt: s.endedAt ?? s.startedAt,
      disciplineName,
    });
  }

  const questions = await db.select<{
    id: number; resolvedCount: number; correctCount: number;
    isSimulado: number; xpEarned: number; createdAt: string; disciplineId: number | null;
  }[]>("SELECT * FROM QuestionLog ORDER BY createdAt DESC LIMIT ?", [limit]);

  for (const q of questions) {
    let disciplineName: string | undefined;
    if (q.disciplineId) {
      const d = await db.select<{ name: string }[]>("SELECT name FROM Discipline WHERE id = ?", [q.disciplineId]);
      disciplineName = d[0]?.name;
    }
    items.push({
      id: `q-${q.id}`,
      type: q.isSimulado ? "simulado" : "questions",
      title: q.isSimulado
        ? "Simulado concluído"
        : `${q.resolvedCount} questões (${q.correctCount} corretas)`,
      subtitle: disciplineName,
      xp: q.xpEarned,
      createdAt: q.createdAt,
      disciplineName,
    });
  }

  const achievements = await db.select<{
    unlockedAt: string; title: string; xpReward: number;
  }[]>(
    `SELECT ua.unlockedAt, a.title, a.xpReward
     FROM UserAchievement ua JOIN Achievement a ON a.id = ua.achievementId
     ORDER BY ua.unlockedAt DESC LIMIT ?`,
    [limit],
  );

  for (const a of achievements) {
    items.push({
      id: `ach-${a.unlockedAt}-${a.title}`,
      type: "achievement",
      title: `Conquista: ${a.title}`,
      xp: a.xpReward,
      createdAt: a.unlockedAt,
    });
  }

  const xpEvents = await db.select<{
    id: number; source: string; amount: number; createdAt: string; metadataJson: string;
  }[]>(
    `SELECT * FROM XpEvent WHERE source IN ('MISSION', 'DAILY_GOAL', 'QUEST', 'PROJECT', 'HABIT', 'POMODORO', 'REWARD') ORDER BY createdAt DESC LIMIT ?`,
    [limit],
  );

  for (const e of xpEvents) {
    const meta = JSON.parse(e.metadataJson || "{}") as { title?: string; code?: string };

    if (e.source === "DAILY_GOAL") {
      items.push({
        id: `xp-${e.id}`,
        type: "daily_goal",
        title: "Meta diária cumprida",
        xp: e.amount,
        createdAt: e.createdAt,
      });
    } else if (e.source === "MISSION") {
      items.push({
        id: `xp-${e.id}`,
        type: "mission",
        title: `Missão: ${meta.title ?? meta.code ?? ""}`,
        xp: e.amount,
        createdAt: e.createdAt,
      });
    } else if (e.source === "QUEST") {
      items.push({
        id: `xp-${e.id}`,
        type: "quest",
        title: `Quest: ${meta.title ?? ""}`,
        xp: e.amount,
        createdAt: e.createdAt,
      });
    } else if (e.source === "PROJECT") {
      items.push({
        id: `xp-${e.id}`,
        type: "project",
        title: `Projeto: ${meta.title ?? ""}`,
        xp: e.amount,
        createdAt: e.createdAt,
      });
    } else if (e.source === "HABIT") {
      const undone = (meta as { undone?: boolean }).undone;
      items.push({
        id: `xp-${e.id}`,
        type: "habit",
        title: undone ? `Hábito desfeito: ${meta.title ?? ""}` : `Hábito: ${meta.title ?? ""}`,
        xp: e.amount,
        createdAt: e.createdAt,
      });
    } else if (e.source === "POMODORO") {
      const minutes = (meta as { minutes?: number }).minutes ?? 25;
      items.push({
        id: `xp-${e.id}`,
        type: "pomodoro",
        title: `Pomodoro — ${minutes} min de foco`,
        xp: e.amount,
        createdAt: e.createdAt,
      });
    } else if (e.source === "REWARD") {
      items.push({
        id: `xp-${e.id}`,
        type: "reward",
        title: `Resgate: ${meta.title ?? "Recompensa"}`,
        xp: e.amount,
        createdAt: e.createdAt,
      });
    }
  }

  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const filtered = typeFilter ? items.filter((i) => i.type === typeFilter) : items;
  return filtered.slice(0, limit);
}
