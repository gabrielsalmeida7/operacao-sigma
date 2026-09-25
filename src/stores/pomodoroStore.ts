import { create } from "zustand";
import type { PomodoroPhase } from "@/lib/gamification/pomodoro";
import {
  POMODORO_PHASE_SECONDS,
  nextBreakPhase,
} from "@/lib/gamification/pomodoro";
import { completePomodoroFocus, recordStudyMinutes } from "@/lib/gamification/engine";
import type { CelebrationEvent } from "@/lib/gamification/events";
import { useCelebrationStore } from "@/stores/celebrationStore";

interface PomodoroState {
  phase: PomodoroPhase;
  remainingSec: number;
  isRunning: boolean;
  disciplineId: number | null;
  completedFocusCount: number;
  phaseTotalSec: number;
  setPhase: (phase: PomodoroPhase) => void;
  setDiscipline: (id: number | null) => void;
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

function phaseDuration(phase: PomodoroPhase): number {
  return POMODORO_PHASE_SECONDS[phase];
}

async function handleFocusComplete(
  disciplineId: number | null,
  completedFocusCount: number,
): Promise<void> {
  const minutes = Math.floor(phaseDuration("focus") / 60);
  const result = await completePomodoroFocus(minutes, disciplineId);
  pushCelebrations(result.events);

  const newCount = completedFocusCount + 1;
  const breakPhase = nextBreakPhase(newCount);
  usePomodoroStore.setState({
    isRunning: false,
    completedFocusCount: newCount,
    phase: breakPhase,
    remainingSec: phaseDuration(breakPhase),
    phaseTotalSec: phaseDuration(breakPhase),
  });
}

export const usePomodoroStore = create<PomodoroState>((set, get) => ({
  phase: "focus",
  remainingSec: POMODORO_PHASE_SECONDS.focus,
  isRunning: false,
  disciplineId: null,
  completedFocusCount: 0,
  phaseTotalSec: POMODORO_PHASE_SECONDS.focus,

  setPhase: (phase) => {
    if (get().isRunning) return;
    set({
      phase,
      remainingSec: phaseDuration(phase),
      phaseTotalSec: phaseDuration(phase),
    });
  },

  setDiscipline: (id) => set({ disciplineId: id }),

  start: () => {
    if (get().isRunning) return;
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
    const { phase } = get();
    set({
      isRunning: false,
      remainingSec: phaseDuration(phase),
      phaseTotalSec: phaseDuration(phase),
    });
  },

  skip: async () => {
    const { phase, remainingSec, phaseTotalSec, disciplineId, completedFocusCount } = get();
    if (tickInterval) clearInterval(tickInterval);
    tickInterval = null;

    let events: CelebrationEvent[] = [];

    if (phase === "focus") {
      const elapsedMin = Math.floor((phaseTotalSec - remainingSec) / 60);
      if (elapsedMin >= 1) {
        const partial = await recordStudyMinutes(elapsedMin, disciplineId);
        events = partial.events;
        pushCelebrations(events);
      }
      const newCount = completedFocusCount + 1;
      const breakPhase = nextBreakPhase(newCount);
      set({
        isRunning: false,
        completedFocusCount: newCount,
        phase: breakPhase,
        remainingSec: phaseDuration(breakPhase),
        phaseTotalSec: phaseDuration(breakPhase),
      });
    } else {
      set({
        isRunning: false,
        phase: "focus",
        remainingSec: phaseDuration("focus"),
        phaseTotalSec: phaseDuration("focus"),
      });
    }

    return events;
  },

  tick: () => {
    const { isRunning, remainingSec, phase, disciplineId, completedFocusCount } = get();
    if (!isRunning || remainingSec <= 0) return;

    const next = remainingSec - 1;
    if (next > 0) {
      set({ remainingSec: next });
      return;
    }

    if (tickInterval) clearInterval(tickInterval);
    tickInterval = null;
    set({ remainingSec: 0, isRunning: false });

    if (phase === "focus") {
      void handleFocusComplete(disciplineId, completedFocusCount);
    } else {
      set({
        phase: "focus",
        remainingSec: phaseDuration("focus"),
        phaseTotalSec: phaseDuration("focus"),
      });
    }
  },
}));
