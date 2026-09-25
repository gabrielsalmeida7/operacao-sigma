import { todayKey } from "@/lib/dates";
import { getProfile, updateProfile } from "./profile";
import { parseISO, differenceInCalendarDays } from "date-fns";

export async function updateStreak(goalMetToday: boolean): Promise<void> {
  const profile = await getProfile();
  const today = todayKey();

  if (goalMetToday) {
    if (profile.lastStreakDate === today) return;

    let newStreak = 1;
    if (profile.lastStreakDate) {
      const days = differenceInCalendarDays(parseISO(today), parseISO(profile.lastStreakDate));
      if (days === 1) {
        newStreak = profile.currentStreak + 1;
      }
    }

    const bestStreak = Math.max(profile.bestStreak, newStreak);
    await updateProfile({
      currentStreak: newStreak,
      bestStreak,
      lastStreakDate: today,
    });
    return;
  }

  if (!profile.lastStreakDate) return;

  const daysSince = differenceInCalendarDays(parseISO(today), parseISO(profile.lastStreakDate));
  if (daysSince > 1) {
    await updateProfile({ currentStreak: 0 });
  }
}

export async function getStreakInfo() {
  const profile = await getProfile();
  return {
    current: profile.currentStreak,
    best: profile.bestStreak,
    lastDate: profile.lastStreakDate,
  };
}
