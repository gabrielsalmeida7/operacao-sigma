import type {
  CycleBlockType,
  CycleRole,
  CycleState,
  CognitiveGroup,
  StudyPhase,
  StudyPriority,
  TopicStudyStatus,
} from "@/lib/db/types";

export const STUDY_PRIORITIES: StudyPriority[] = ["VERY_HIGH", "HIGH", "MEDIUM", "LOW"];

export const PRIORITY_LABELS: Record<StudyPriority, string> = {
  VERY_HIGH: "Altíssima",
  HIGH: "Alta",
  MEDIUM: "Média",
  LOW: "Baixa",
};

export const PRIORITY_ORDER: Record<StudyPriority, number> = {
  VERY_HIGH: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

export const PRIORITY_COLORS: Record<StudyPriority, { bg: string; text: string; border: string }> = {
  VERY_HIGH: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/30" },
  HIGH: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30" },
  MEDIUM: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" },
  LOW: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30" },
};

/** Cores do quadro de ciclo — dark mode */
export const BOARD_PRIORITY_COLORS: Record<
  StudyPriority,
  { row: string; badge: string; title: string; pill: string; pillText: string }
> = {
  VERY_HIGH: {
    row: "bg-red-500/10",
    badge: "bg-red-600",
    title: "text-red-300",
    pill: "bg-red-500/10 border-red-500/30",
    pillText: "text-red-300",
  },
  HIGH: {
    row: "bg-amber-500/10",
    badge: "bg-amber-500",
    title: "text-amber-300",
    pill: "bg-amber-500/10 border-amber-500/30",
    pillText: "text-amber-300",
  },
  MEDIUM: {
    row: "bg-emerald-500/10",
    badge: "bg-emerald-600",
    title: "text-emerald-300",
    pill: "bg-emerald-500/10 border-emerald-500/30",
    pillText: "text-emerald-300",
  },
  LOW: {
    row: "bg-blue-500/10",
    badge: "bg-blue-600",
    title: "text-blue-300",
    pill: "bg-blue-500/10 border-blue-500/30",
    pillText: "text-blue-300",
  },
};

export const BOARD_REVIEW_COLORS = {
  row: "bg-muted/60",
  badge: "bg-zinc-500",
  title: "text-zinc-300",
  pill: "bg-zinc-500/10 border-zinc-500/30",
  pillText: "text-zinc-300",
};

export const REVIEW_COLORS = {
  bg: "bg-zinc-500/10",
  text: "text-zinc-400",
  border: "border-zinc-500/30",
};

export const STUDY_PHASE_LABELS: Record<StudyPhase, string> = {
  PDF: "PDF",
  QUESTIONS: "Questão",
};

export const WEEKDAY_LABELS: Record<string, string> = {
  MON: "SEG",
  TUE: "TER",
  WED: "QUA",
  THU: "QUI",
  FRI: "SEX",
  SAT: "SAB",
  SUN: "DOM",
};

export const WEEKDAY_OPTIONS = Object.entries(WEEKDAY_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export const DEFAULT_REVIEW_DAYS = [3, 5, 8];
export const DEFAULT_DAY_COUNT = 8;
export const DEFAULT_BLOCKS_PER_DAY = 3;

export const BLOCK_TYPE_LABELS: Record<CycleBlockType, string> = {
  DISCIPLINE: "Disciplina",
  REVIEW: "Questões/Revisão",
  MIXED: "Ciclo misto",
};

export const SEGMENT_LABELS = ["A", "B", "C"] as const;

export const DEFAULT_WEEKLY_SESSIONS = 12;
export const DEFAULT_SESSION_MINUTES = 50;
export const TQR_ACCURACY_GATE = 70;

export const WEEK_LAP_COLORS = [
  { key: "blue", hex: "#2563eb", label: "Azul", cell: "bg-blue-600", text: "text-white" },
  { key: "green", hex: "#16a34a", label: "Verde", cell: "bg-emerald-600", text: "text-white" },
  { key: "amber", hex: "#d97706", label: "Âmbar", cell: "bg-amber-500", text: "text-white" },
  { key: "purple", hex: "#7c3aed", label: "Roxo", cell: "bg-violet-600", text: "text-white" },
  { key: "rose", hex: "#e11d48", label: "Rosa", cell: "bg-rose-600", text: "text-white" },
  { key: "cyan", hex: "#0891b2", label: "Ciano", cell: "bg-cyan-600", text: "text-white" },
] as const;

export function lapColor(lap: number) {
  const index = ((lap - 1) % WEEK_LAP_COLORS.length + WEEK_LAP_COLORS.length) % WEEK_LAP_COLORS.length;
  return WEEK_LAP_COLORS[index];
}

export const CYCLE_ROLE_LABELS: Record<CycleRole, string> = {
  BASE: "Base",
  SPECIFIC: "Específica",
  FINAL: "Reta final",
};

export const CYCLE_STATE_LABELS: Record<CycleState, string> = {
  ACTIVE: "Ativa",
  MAINTENANCE: "Manutenção",
  LOCKED: "Bloqueada",
};

export const COGNITIVE_GROUP_LABELS: Record<CognitiveGroup, string> = {
  LAW: "Direito",
  EXACT: "Exatas",
  LANGUAGE: "Linguagem",
};

export const TOPIC_STATUS_LABELS: Record<TopicStudyStatus, string> = {
  IN_PROGRESS: "Em andamento",
  COMPLETED: "Concluído",
  MANDATORY_REVIEW: "Revisão obrigatória",
};
