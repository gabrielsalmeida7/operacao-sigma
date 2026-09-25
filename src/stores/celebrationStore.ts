import { create } from "zustand";
import type { CelebrationEvent } from "@/lib/gamification/events";

interface CelebrationState {
  queue: CelebrationEvent[];
  pushEvents: (events: CelebrationEvent[]) => void;
  shiftEvent: () => CelebrationEvent | undefined;
}

export const useCelebrationStore = create<CelebrationState>((set, get) => ({
  queue: [],
  pushEvents: (events) => {
    if (events.length === 0) return;
    set((s) => ({ queue: [...s.queue, ...events] }));
  },
  shiftEvent: () => {
    const { queue } = get();
    if (queue.length === 0) return undefined;
    const [first, ...rest] = queue;
    set({ queue: rest });
    return first;
  },
}));
