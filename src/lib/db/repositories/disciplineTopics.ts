import { getDb } from "@/lib/db/client";
import { nowIso } from "@/lib/dates";
import type {
  DisciplineTopic,
  TopicSegmentProgress,
  TopicStudyStatus,
  TopicWithSegments,
} from "@/lib/db/types";

async function ensureSegments(topicId: number): Promise<TopicSegmentProgress[]> {
  const db = await getDb();
  for (let segment = 1; segment <= 3; segment++) {
    await db.execute(
      `INSERT OR IGNORE INTO TopicSegmentProgress (topicId, segment, resolved, correct) VALUES (?, ?, 0, 0)`,
      [topicId, segment],
    );
  }
  const rows = await db.select<TopicSegmentProgress[]>(
    "SELECT * FROM TopicSegmentProgress WHERE topicId = ? ORDER BY segment",
    [topicId],
  );
  return rows;
}

function mapTopicWithSegments(
  topic: DisciplineTopic,
  segments: TopicSegmentProgress[],
): TopicWithSegments {
  const totalResolvedAll = segments.reduce((s, seg) => s + seg.resolved, 0);
  const totalCorrectAll = segments.reduce((s, seg) => s + seg.correct, 0);
  const accuracyPercent =
    totalResolvedAll > 0 ? Math.round((totalCorrectAll / totalResolvedAll) * 100) : null;
  const target = topic.targetAccuracyPercent;
  const meetsTarget =
    target != null && accuracyPercent != null ? accuracyPercent >= target : false;

  return {
    ...topic,
    referenceUrl: topic.referenceUrl ?? null,
    targetAccuracyPercent: topic.targetAccuracyPercent ?? null,
    topicStatus: (topic.topicStatus ?? "IN_PROGRESS") as TopicStudyStatus,
    lastAccuracyPercent: topic.lastAccuracyPercent ?? null,
    segments,
    totalResolvedAll,
    totalCorrectAll,
    accuracyPercent,
    meetsTarget,
  };
}

export async function getTopicsByDiscipline(disciplineId: number): Promise<TopicWithSegments[]> {
  const db = await getDb();
  const topics = await db.select<DisciplineTopic[]>(
    "SELECT * FROM DisciplineTopic WHERE disciplineId = ? ORDER BY sortOrder, lessonCode",
    [disciplineId],
  );

  const result: TopicWithSegments[] = [];
  for (const topic of topics) {
    const segments = await ensureSegments(topic.id);
    result.push(mapTopicWithSegments(topic, segments));
  }
  return result;
}

export async function getAllTopicsGrouped() {
  const db = await getDb();
  const disciplines = await db.select<{ id: number; name: string }[]>(
    "SELECT id, name FROM Discipline ORDER BY name",
  );

  const groups = [];
  for (const d of disciplines) {
    const topics = await getTopicsByDiscipline(d.id);
    groups.push({ disciplineId: d.id, disciplineName: d.name, topics });
  }
  return groups;
}

export async function createTopic(
  disciplineId: number,
  data: {
    lessonCode: string;
    name: string;
    referenceUrl?: string | null;
    weight?: number;
    totalQuestionsAvailable?: number;
    targetAccuracyPercent?: number | null;
    sortOrder?: number;
  },
): Promise<DisciplineTopic> {
  const db = await getDb();
  await db.execute(
    `INSERT INTO DisciplineTopic
     (disciplineId, lessonCode, name, referenceUrl, sortOrder, weight, totalQuestionsAvailable, targetAccuracyPercent, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      disciplineId,
      data.lessonCode,
      data.name,
      data.referenceUrl ?? null,
      data.sortOrder ?? 0,
      data.weight ?? 1,
      data.totalQuestionsAvailable ?? 0,
      data.targetAccuracyPercent ?? null,
      nowIso(),
    ],
  );

  const rows = await db.select<DisciplineTopic[]>(
    "SELECT * FROM DisciplineTopic WHERE disciplineId = ? ORDER BY id DESC LIMIT 1",
    [disciplineId],
  );
  await ensureSegments(rows[0].id);
  return rows[0];
}

export async function updateTopic(
  id: number,
  data: Partial<
    Pick<
      DisciplineTopic,
      | "lessonCode"
      | "name"
      | "referenceUrl"
      | "weight"
      | "totalQuestionsAvailable"
      | "targetAccuracyPercent"
      | "sortOrder"
    >
  >,
): Promise<void> {
  const db = await getDb();
  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.lessonCode !== undefined) {
    fields.push("lessonCode = ?");
    values.push(data.lessonCode);
  }
  if (data.name !== undefined) {
    fields.push("name = ?");
    values.push(data.name);
  }
  if (data.referenceUrl !== undefined) {
    fields.push("referenceUrl = ?");
    values.push(data.referenceUrl);
  }
  if (data.weight !== undefined) {
    fields.push("weight = ?");
    values.push(data.weight);
  }
  if (data.totalQuestionsAvailable !== undefined) {
    fields.push("totalQuestionsAvailable = ?");
    values.push(data.totalQuestionsAvailable);
  }
  if (data.targetAccuracyPercent !== undefined) {
    fields.push("targetAccuracyPercent = ?");
    values.push(data.targetAccuracyPercent);
  }
  if (data.sortOrder !== undefined) {
    fields.push("sortOrder = ?");
    values.push(data.sortOrder);
  }

  if (fields.length === 0) return;
  values.push(id);
  await db.execute(`UPDATE DisciplineTopic SET ${fields.join(", ")} WHERE id = ?`, values);
}

export async function deleteTopic(id: number): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM TopicSegmentProgress WHERE topicId = ?", [id]);
  await db.execute("DELETE FROM StudyActivityLog WHERE topicId = ?", [id]);
  await db.execute("DELETE FROM DisciplineTopic WHERE id = ?", [id]);
}

export async function updateSegmentProgress(
  topicId: number,
  segment: number,
  resolvedDelta: number,
  correctDelta: number,
): Promise<void> {
  const db = await getDb();
  await ensureSegments(topicId);

  await db.execute(
    `UPDATE TopicSegmentProgress
     SET resolved = resolved + ?, correct = correct + ?
     WHERE topicId = ? AND segment = ?`,
    [resolvedDelta, correctDelta, topicId, segment],
  );

  await db.execute(
    `UPDATE DisciplineTopic
     SET totalResolved = totalResolved + ?, totalCorrect = totalCorrect + ?
     WHERE id = ?`,
    [resolvedDelta, correctDelta, topicId],
  );
}

export async function setSegmentProgress(
  topicId: number,
  segment: number,
  resolved: number,
  correct: number,
): Promise<void> {
  const db = await getDb();
  await ensureSegments(topicId);

  const prev = await db.select<TopicSegmentProgress[]>(
    "SELECT * FROM TopicSegmentProgress WHERE topicId = ? AND segment = ?",
    [topicId, segment],
  );
  const prevResolved = prev[0]?.resolved ?? 0;
  const prevCorrect = prev[0]?.correct ?? 0;

  await db.execute(
    `UPDATE TopicSegmentProgress SET resolved = ?, correct = ? WHERE topicId = ? AND segment = ?`,
    [resolved, correct, topicId, segment],
  );

  await db.execute(
    `UPDATE DisciplineTopic
     SET totalResolved = totalResolved + ?, totalCorrect = totalCorrect + ?
     WHERE id = ?`,
    [resolved - prevResolved, correct - prevCorrect, topicId],
  );
}

export async function applyTopicAccuracyGate(
  topicId: number,
  percent: number,
  passed: boolean,
): Promise<void> {
  const db = await getDb();
  const status: TopicStudyStatus = passed ? "COMPLETED" : "MANDATORY_REVIEW";
  await db.execute(
    "UPDATE DisciplineTopic SET topicStatus = ?, lastAccuracyPercent = ? WHERE id = ?",
    [status, percent, topicId],
  );
}

export async function incrementDisciplinePdf(disciplineId: number): Promise<boolean> {
  const db = await getDb();
  await db.execute(
    "UPDATE Discipline SET pdfsCurrent = pdfsCurrent + 1 WHERE id = ?",
    [disciplineId],
  );
  const rows = await db.select<{ pdfsCurrent: number; pdfsTotal: number }[]>(
    "SELECT pdfsCurrent, pdfsTotal FROM Discipline WHERE id = ?",
    [disciplineId],
  );
  const row = rows[0];
  return Boolean(row && row.pdfsTotal > 0 && row.pdfsCurrent >= row.pdfsTotal);
}

export async function getTopicById(id: number): Promise<TopicWithSegments | null> {
  const db = await getDb();
  const rows = await db.select<DisciplineTopic[]>("SELECT * FROM DisciplineTopic WHERE id = ?", [
    id,
  ]);
  if (!rows[0]) return null;
  const segments = await ensureSegments(rows[0].id);
  return mapTopicWithSegments(rows[0], segments);
}
