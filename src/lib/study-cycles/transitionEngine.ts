import type { Discipline } from "@/lib/db/types";
import { SPECIFIC_INSERTION_ORDER, TRIBUTARIO_SLUG } from "./atrfCatalog";

export interface TransitionPlan {
  completedDisciplineId: number;
  unlockedDisciplineId: number | null;
  unlockedSlug: string | null;
}

function isUnlocked(entry: Discipline, bySlug: Map<string, Discipline>): boolean {
  if (!entry.unlockAfterSlug) return true;
  const required = bySlug.get(entry.unlockAfterSlug);
  if (!required) return false;
  return required.theoryComplete || required.cycleState === "MAINTENANCE";
}

export function findNextSpecificToUnlock(disciplines: Discipline[]): Discipline | null {
  const bySlug = new Map(disciplines.map((d) => [d.slug, d]));
  for (const slug of SPECIFIC_INSERTION_ORDER) {
    const candidate = bySlug.get(slug);
    if (!candidate) continue;
    if (candidate.cycleState !== "LOCKED") continue;
    if (!isUnlocked(candidate, bySlug)) continue;
    if (candidate.unlockAfterSlug === TRIBUTARIO_SLUG) {
      const tributario = bySlug.get(TRIBUTARIO_SLUG);
      if (!tributario?.theoryComplete && tributario?.cycleState !== "MAINTENANCE") {
        continue;
      }
    }
    return candidate;
  }
  return null;
}

export function shouldMoveToMaintenance(discipline: Discipline): boolean {
  if (discipline.theoryComplete) return true;
  if (discipline.pdfsTotal > 0 && discipline.pdfsCurrent >= discipline.pdfsTotal) return true;
  return false;
}

export function buildTransitionPlan(
  completed: Discipline,
  disciplines: Discipline[],
): TransitionPlan {
  const unlocked = findNextSpecificToUnlock(disciplines);
  return {
    completedDisciplineId: completed.id,
    unlockedDisciplineId: unlocked?.id ?? null,
    unlockedSlug: unlocked?.slug ?? null,
  };
}
