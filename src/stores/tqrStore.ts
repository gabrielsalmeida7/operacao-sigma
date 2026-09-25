import { create } from "zustand";
import type { TqrPhase } from "@/lib/db/types";
import {
  TQR_PHASE_SECONDS,
  initialTqrPhase,
  nextTqrPhase,
} from "@/lib/study-cycles/tqrSession";
import { recordStudyMinutes } from "@/lib/gamification/engine";
import type { CelebrationEvent } from "@/lib/gamification/events";
import { useCelebrationStore } from "@/stores/celebrationStore";

interface TqrState {
  phase: TqrPhase;
  remainingSec: number;
  phaseTotalSec: number;
  isRunning: boolean;
  isDone: boolean;
  disciplineId: number | null;
  mandatoryReview: boolean;
  hasPreviousTopic: boolean;
  configure: (opts: {
    disciplineId: number | null;
    mandatoryReview: boolean;
    hasPreviousTopic: boolean;
  }) => void;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  skip: () => Promise<CelebrationEvent[]>;
  tick: () => void;
}

let tickInterval: ReturnType<typeof setInterval> | null = null;

function pushCelebrations(events: CelebrationEvent[]) {
  if (events.length > 0) {
    useCelebrationStore.getState().pushEvents(events);
  }
}

function phaseDuration(phase: TqrPhase): number {
  return TQR_PHASE_SECONDS[phase];
}

async function completePhase(
  phase: TqrPhase,
  disciplineId: number | null,
  remainingSec: number,
  phaseTotalSec: number,
): Promise<void> {
  const elapsedMin = Math.floor((phaseTotalSec - remainingSec) / 60);
  if (elapsedMin >= 1 && phase !== "questions") {
    const result = await recordStudyMinutes(elapsedMin, disciplineId);
    pushCelebrations(result.events);
  } else if (elapsedMin >= 1 && phase === "questions") {
    const result = await recordStudyMinutes(elapsedMin, disciplineId);
    pushCelebrations(result.events);
  }
}

export const useTqrStore = create<TqrState>((set, get) => ({
  phase: "theory",
  remainingSec: TQR_PHASE_SECONDS.theory,
  phaseTotalSec: TQR_PHASE_SECONDS.theory,
  isRunning: false,
  isDone: false,
  disciplineId: null,
  mandatoryReview: false,
  hasPreviousTopic: false,

  configure: ({ disciplineId, mandatoryReview, hasPreviousTopic }) => {
    if (get().isRunning || get().isDone) return;
    const phase = initialTqrPhase(mandatoryReview, hasPreviousTopic);
    set({
      disciplineId,
      mandatoryReview,
      hasPreviousTopic,
      phase,
      remainingSec: phaseDuration(phase),
      phaseTotalSec: phaseDuration(phase),
      isDone: false,
    });
  },

  start: () => {
    if (get().isRunning || get().isDone) return;
    set({ isRunning: true });
    if (tickInterval) clearInterval(tickInterval);
    tickInterval = setInterval(() => get().tick(), 1000);
  },

  pause: () => {
    if (!get().isRunning) return;
    if (tickInterval) clearInterval(tickInterval);
    tickInterval = null;
    set({ isRunning: false });
  },

  resume: () => {
    get().start();
  },

  reset: () => {
    if (tickInterval) clearInterval(tickInterval);
    tickInterval = null;
    const { mandatoryReview, hasPreviousTopic } = get();
    const phase = initialTqrPhase(mandatoryReview, hasPreviousTopic);
    set({
      isRunning: false,
      isDone: false,
      phase,
      remainingSec: phaseDuration(phase),
      phaseTotalSec: phaseDuration(phase),
    });
  },

  skip: async () => {
    const { phase, remainingSec, phaseTotalSec, disciplineId, isDone } = get();
    if (isDone) return [];
    if (tickInterval) clearInterval(tickInterval);
    tickInterval = null;
    await completePhase(phase, disciplineId, remainingSec, phaseTotalSec);

    const next = nextTqrPhase(phase);
    if (next === "done") {
      set({ isRunning: false, isDone: true, remainingSec: 0 });
      return [];
    }

    set({
      isRunning: false,
      phase: next,
      remainingSec: phaseDuration(next),
      phaseTotalSec: phaseDuration(next),
    });
    return [];
  },

  tick: () => {
    const { isRunning, remainingSec, phase, disciplineId, phaseTotalSec } = get();
    if (!isRunning || remainingSec <= 0) return;

    const next = remainingSec - 1;
    if (next > 0) {
      set({ remainingSec: next });
      return;
    }

    if (tickInterval) clearInterval(tickInterval);
    tickInterval = null;
    set({ remainingSec: 0, isRunning: false });

    void (async () => {
      await completePhase(phase, disciplineId, 0, phaseTotalSec);
      const following = nextTqrPhase(phase);
      if (following === "done") {
        set({ isDone: true, remainingSec: 0, isRunning: false });
        return;
      }
      set({
        phase: following,
        remainingSec: phaseDuration(following),
        phaseTotalSec: phaseDuration(following),
      });
    })();
  },
}));
