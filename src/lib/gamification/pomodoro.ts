export type PomodoroPhase = "focus" | "short_break" | "long_break";

export const POMODORO_PHASE_SECONDS: Record<PomodoroPhase, number> = {
  focus: 25 * 60,
  short_break: 5 * 60,
  long_break: 15 * 60,
};


export const POMODORO_LONG_BREAK_EVERY = 4;

export const POMODORO_PHASE_LABELS: Record<PomodoroPhase, string> = {
  focus: "Foco",
  short_break: "Pausa curta",
  long_break: "Pausa longa",
};

export function nextBreakPhase(completedFocusCount: number): PomodoroPhase {
  return completedFocusCount > 0 && completedFocusCount % POMODORO_LONG_BREAK_EVERY === 0
    ? "long_break"
    : "short_break";
}
