import type { UserProfile } from "@/lib/db/types";

export type CelebrationEvent =
  | { type: "level_up"; level: number }
  | { type: "discipline_level_up"; name: string; level: number }
  | { type: "achievement"; title: string; xp: number }
  | { type: "mission"; title: string; xp: number }
  | { type: "quest"; title: string; xp: number }
  | { type: "project"; title: string; xp: number }
  | { type: "habit"; title: string; xp: number }
  | { type: "pomodoro"; minutes: number; xp: number }
  | { type: "daily_goal" }
  | { type: "reward"; title: string; xp: number };

export interface ActionResult {
  profile: UserProfile;
  events: CelebrationEvent[];
}

export function emptyResult(profile: UserProfile): ActionResult {
  return { profile, events: [] };
}

export function mergeResults(base: ActionResult, extra: CelebrationEvent[]): ActionResult {
  return { profile: base.profile, events: [...base.events, ...extra] };
}
