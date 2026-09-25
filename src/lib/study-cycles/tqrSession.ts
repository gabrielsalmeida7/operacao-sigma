import type { TqrPhase } from "@/lib/db/types";
import { TQR_ACCURACY_GATE } from "./constants";

export const TQR_PHASE_SECONDS: Record<TqrPhase, number> = {
  current_review: 8 * 60,
  error_review: 30 * 60,
  theory: 40 * 60,
  questions: 10 * 60,
};

export const TQR_PHASE_LABELS: Record<TqrPhase, string> = {
  current_review: "Revisão corrente",
  error_review: "Reestudo dos erros",
  theory: "Teoria (PDF)",
  questions: "Questões de fixação",
};

export function initialTqrPhase(mandatoryReview: boolean, hasPreviousTopic: boolean): TqrPhase {
  if (mandatoryReview) return "error_review";
  if (hasPreviousTopic) return "current_review";
  return "theory";
}

export function nextTqrPhase(phase: TqrPhase): TqrPhase | "done" {
  switch (phase) {
    case "current_review":
      return "theory";
    case "error_review":
      return "questions";
    case "theory":
      return "questions";
    case "questions":
      return "done";
    default: {
      const _never: never = phase;
      return _never;
    }
  }
}

export function evaluateAccuracyGate(resolved: number, correct: number): {
  percent: number;
  passed: boolean;
} {
  if (resolved <= 0) return { percent: 0, passed: false };
  const percent = Math.round((correct / resolved) * 100);
  return { percent, passed: percent >= TQR_ACCURACY_GATE };
}
