export const XP_RATES = {
  MINUTE_STUDIED: 1,
  QUESTION_RESOLVED: 3,
  QUESTION_CORRECT: 5,
  SIMULADO: 50,
  DAILY_GOAL: 25,
} as const;

export const QUEST_DEFAULT_XP = {
  HIGH: 50,
  MEDIUM: 30,
  LOW: 15,
} as const;

export const PROJECT_DEFAULT_XP = 100;

export const HABIT_DEFAULT_XP = 20;

export const POMODORO_BONUS_XP = 10;

export const REWARD_DEFAULT_XP_COST = 100;

export type XpSource = keyof typeof XP_RATES | "MISSION" | "ACHIEVEMENT";

export function xpForStudyMinutes(minutes: number): number {
  return minutes * XP_RATES.MINUTE_STUDIED;
}

export function xpForQuestions(resolved: number, correct: number): number {
  return resolved * XP_RATES.QUESTION_RESOLVED + correct * XP_RATES.QUESTION_CORRECT;
}
