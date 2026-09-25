import { getDb } from "@/lib/db/client";
import { nowIso } from "@/lib/dates";
import type { StudySession } from "@/lib/db/types";
import { recordStudyMinutes } from "@/lib/gamification/engine";
import type { CelebrationEvent } from "@/lib/gamification/events";

export async function getActiveSession(): Promise<StudySession | null> {
  const db = await getDb();
  const rows = await db.select<StudySession[]>(
    "SELECT * FROM StudySession WHERE isActive = 1 ORDER BY id DESC LIMIT 1",
  );
  return rows[0] ?? null;
}

export async function startSession(disciplineId?: number | null): Promise<StudySession> {
  const db = await getDb();
  const active = await getActiveSession();
  if (active) return active;

  await db.execute(
    `INSERT INTO StudySession (startedAt, disciplineId, isActive) VALUES (?, ?, 1)`,
    [nowIso(), disciplineId ?? null],
  );
  const rows = await db.select<StudySession[]>("SELECT * FROM StudySession ORDER BY id DESC LIMIT 1");
  return rows[0];
}

export async function pauseSession(sessionId: number, elapsedSec: number): Promise<CelebrationEvent[]> {
  const db = await getDb();
  const rows = await db.select<StudySession[]>("SELECT * FROM StudySession WHERE id = ?", [sessionId]);
  const session = rows[0];
  if (!session) return [];

  const prevMinutes = Math.floor(session.durationSec / 60);
  const newMinutes = Math.floor(elapsedSec / 60);
  const deltaMinutes = newMinutes - prevMinutes;
  const events: CelebrationEvent[] = [];

  if (deltaMinutes > 0) {
    const result = await recordStudyMinutes(deltaMinutes, session.disciplineId);
    events.push(...result.events);
  }

  await db.execute(
    "UPDATE StudySession SET durationSec = ?, xpEarned = ? WHERE id = ?",
    [elapsedSec, newMinutes, sessionId],
  );
  return events;
}

export async function endSession(sessionId: number, elapsedSec: number): Promise<CelebrationEvent[]> {
  const db = await getDb();
  const events = await pauseSession(sessionId, elapsedSec);
  await db.execute(
    "UPDATE StudySession SET endedAt = ?, isActive = 0 WHERE id = ?",
    [nowIso(), sessionId],
  );
  return events;
}

export async function updateSessionDiscipline(sessionId: number, disciplineId: number | null): Promise<void> {
  const db = await getDb();
  await db.execute("UPDATE StudySession SET disciplineId = ? WHERE id = ?", [disciplineId, sessionId]);
}
