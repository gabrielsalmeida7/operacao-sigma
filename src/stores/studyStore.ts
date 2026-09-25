import { create } from "zustand";
import type { StudySession } from "@/lib/db/types";
import type { CelebrationEvent } from "@/lib/gamification/events";
import {
  startSession,
  pauseSession,
  endSession,
  getActiveSession,
  updateSessionDiscipline,
} from "@/lib/db/repositories/sessions";
import { useCelebrationStore } from "@/stores/celebrationStore";

interface StudyState {
  session: StudySession | null;
  isRunning: boolean;
  elapsedSec: number;
  disciplineId: number | null;
  init: () => Promise<void>;
  start: (disciplineId?: number | null) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => void;
  stop: () => Promise<CelebrationEvent[]>;
  tick: () => void;
  setDiscipline: (id: number | null) => Promise<void>;
  syncElapsed: (sec: number) => void;
}

let tickInterval: ReturnType<typeof setInterval> | null = null;

function pushCelebrations(events: CelebrationEvent[]) {
  if (events.length > 0) {
    useCelebrationStore.getState().pushEvents(events);
  }
}

export const useStudyStore = create<StudyState>((set, get) => ({
  session: null,
  isRunning: false,
  elapsedSec: 0,
  disciplineId: null,

  init: async () => {
    const active = await getActiveSession();
    if (active) {
      set({
        session: active,
        elapsedSec: active.durationSec,
        disciplineId: active.disciplineId,
        isRunning: false,
      });
    }
  },

  start: async (disciplineId) => {
    const session = await startSession(disciplineId);
    set({
      session,
      isRunning: true,
      elapsedSec: 0,
      disciplineId: disciplineId ?? null,
    });
    if (tickInterval) clearInterval(tickInterval);
    tickInterval = setInterval(() => get().tick(), 1000);
  },

  pause: async () => {
    const { session, elapsedSec, isRunning } = get();
    if (!session || !isRunning) return;
    if (tickInterval) clearInterval(tickInterval);
    tickInterval = null;
    const events = await pauseSession(session.id, elapsedSec);
    pushCelebrations(events);
    set({ isRunning: false });
  },

  resume: () => {
    if (get().isRunning) return;
    set({ isRunning: true });
    if (tickInterval) clearInterval(tickInterval);
    tickInterval = setInterval(() => get().tick(), 1000);
  },

  stop: async () => {
    const { session, elapsedSec } = get();
    if (tickInterval) clearInterval(tickInterval);
    tickInterval = null;
    let events: CelebrationEvent[] = [];
    if (session) events = await endSession(session.id, elapsedSec);
    pushCelebrations(events);
    set({ session: null, isRunning: false, elapsedSec: 0, disciplineId: null });
    return events;
  },

  tick: () => {
    const { isRunning, elapsedSec, session } = get();
    if (!isRunning) return;
    const next = elapsedSec + 1;
    set({ elapsedSec: next });
    if (session && next % 60 === 0) {
      pauseSession(session.id, next).then(pushCelebrations).catch(console.error);
    }
  },

  setDiscipline: async (id) => {
    const { session } = get();
    set({ disciplineId: id });
    if (session) await updateSessionDiscipline(session.id, id);
  },

  syncElapsed: (sec) => set({ elapsedSec: sec }),
}));
