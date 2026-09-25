import type {
  CycleStatus,
  Discipline,
  StudyCycleBlockWithDiscipline,
  TopicWithSegments,
} from "@/lib/db/types";
import { BLOCK_TYPE_LABELS } from "./constants";

function padLesson(code: string): string {
  return code.padStart(2, "0");
}

function formatPdfItem(discipline: Discipline): string {
  const nextPdf = discipline.pdfsCurrent + 1;
  if (discipline.pdfsTotal <= 0) {
    return `Aula ${padLesson(String(nextPdf))} — ${discipline.name}`;
  }
  if (nextPdf > discipline.pdfsTotal) {
    return `${discipline.name} — PDFs concluídos`;
  }
  return `Aula ${padLesson(String(nextPdf))} — ${discipline.name}`;
}

function formatBookmark(discipline: Discipline): string | null {
  const parts: string[] = [];
  if (discipline.bookmarkLessonCode?.trim()) {
    parts.push(`Aula ${padLesson(discipline.bookmarkLessonCode.trim())}`);
  }
  if (discipline.bookmarkPdfName?.trim()) {
    parts.push(discipline.bookmarkPdfName.trim());
  }
  if (discipline.bookmarkNote?.trim()) {
    parts.push(discipline.bookmarkNote.trim());
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}

function formatWhereStopped(discipline: Discipline, topics: TopicWithSegments[]): string {
  const bookmark = formatBookmark(discipline);
  if (bookmark) {
    return bookmark;
  }

  if (discipline.studyPhase === "PDF") {
    if (discipline.pdfsCurrent <= 0 && discipline.pdfsTotal > 0) {
      return "Nunca iniciado";
    }
    if (discipline.pdfsTotal > 0) {
      return `PDF ${discipline.pdfsCurrent}/${discipline.pdfsTotal}`;
    }
    return discipline.pdfsCurrent > 0 ? `PDF ${discipline.pdfsCurrent}` : "Nunca iniciado";
  }

  const incomplete = topics.find((t) => t.topicStatus !== "COMPLETED");
  if (!incomplete) {
    return topics.length > 0 ? "Tópicos concluídos" : "Nunca iniciado";
  }

  const seg =
    incomplete.segments.find(
      (s) => s.resolved < (incomplete.totalQuestionsAvailable || s.resolved + 1),
    ) ?? incomplete.segments[0];

  const segLabel = seg ? ["A", "B", "C"][seg.segment - 1] ?? String(seg.segment) : "A";
  return `Segmento ${segLabel} — ${incomplete.name}`;
}

function findNextQuestionItem(topics: TopicWithSegments[]): string {
  const mandatory = topics.find((t) => t.topicStatus === "MANDATORY_REVIEW");
  if (mandatory) {
    return `Revisão obrigatória — ${mandatory.name}`;
  }

  for (const topic of topics) {
    if (topic.topicStatus === "COMPLETED") continue;
    for (const seg of topic.segments) {
      const target = topic.totalQuestionsAvailable || 0;
      if (target === 0 || seg.resolved < target) {
        const segLabel = ["A", "B", "C"][seg.segment - 1] ?? String(seg.segment);
        return `Aula ${padLesson(topic.lessonCode)} — ${topic.name} (Seg. ${segLabel})`;
      }
    }
  }
  return "Revisão geral de questões";
}

function previousCompletedTopic(topics: TopicWithSegments[]): TopicWithSegments | null {
  const completed = topics.filter((t) => t.topicStatus === "COMPLETED");
  return completed[completed.length - 1] ?? null;
}

function currentTopic(topics: TopicWithSegments[]): TopicWithSegments | null {
  return (
    topics.find((t) => t.topicStatus === "MANDATORY_REVIEW") ??
    topics.find((t) => t.topicStatus === "IN_PROGRESS") ??
    topics.find((t) => t.topicStatus !== "COMPLETED") ??
    null
  );
}

function emptyStatus(totalBlocks: number): CycleStatus {
  return {
    nextSubject: "—",
    nextItem: "Configure e gere um ciclo",
    whereStopped: "—",
    currentBlock: null,
    totalBlocks,
    mandatoryReview: false,
    previousTopicName: null,
    thematicFocus: null,
    studyHint: null,
  };
}

export function resolveCycleStatus(
  currentBlock: StudyCycleBlockWithDiscipline | null,
  discipline: Discipline | null,
  topics: TopicWithSegments[],
  totalBlocks: number,
): CycleStatus {
  if (!currentBlock) {
    return emptyStatus(totalBlocks);
  }

  if (currentBlock.blockType === "REVIEW" || currentBlock.blockType === "MIXED") {
    return {
      nextSubject: BLOCK_TYPE_LABELS[currentBlock.blockType],
      nextItem:
        currentBlock.blockType === "MIXED"
          ? "Revisões, discursivas e simulados"
          : "Resolver questões de revisão mistas",
      whereStopped: currentBlock.blockType === "MIXED" ? "Sábado — ciclo misto" : "Bloco de revisão",
      currentBlock,
      totalBlocks,
      mandatoryReview: false,
      previousTopicName: null,
      thematicFocus: currentBlock.thematicFocus,
      studyHint: currentBlock.studyHint,
    };
  }

  if (!discipline) {
    return {
      nextSubject: "—",
      nextItem: "Disciplina não definida nesta sessão",
      whereStopped: "—",
      currentBlock,
      totalBlocks,
      mandatoryReview: false,
      previousTopicName: null,
      thematicFocus: currentBlock.thematicFocus,
      studyHint: currentBlock.studyHint,
    };
  }

  const nextItem =
    discipline.studyPhase === "PDF" ? formatPdfItem(discipline) : findNextQuestionItem(topics);
  const current = currentTopic(topics);
  const previous = previousCompletedTopic(topics);
  const mandatoryReview = current?.topicStatus === "MANDATORY_REVIEW";

  return {
    nextSubject: discipline.name,
    nextItem,
    whereStopped: formatWhereStopped(discipline, topics),
    currentBlock,
    totalBlocks,
    mandatoryReview,
    previousTopicName: previous?.name ?? null,
    thematicFocus: currentBlock.thematicFocus,
    studyHint: currentBlock.studyHint,
  };
}

export function resolveCurrentTopic(topics: TopicWithSegments[]): TopicWithSegments | null {
  return currentTopic(topics);
}
