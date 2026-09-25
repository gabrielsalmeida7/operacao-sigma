import { parseISO, differenceInCalendarDays, subDays, format, startOfWeek, subWeeks, addDays } from "date-fns";

export function computeHabitStreaks(completedDates: string[], today: string): {
  current: number;
  best: number;
} {
  if (completedDates.length === 0) return { current: 0, best: 0 };

  const unique = [...new Set(completedDates)].sort();
  let best = 0;
  let run = 1;

  for (let i = 1; i < unique.length; i++) {
    const diff = differenceInCalendarDays(parseISO(unique[i]), parseISO(unique[i - 1]));
    if (diff === 1) {
      run++;
    } else {
      best = Math.max(best, run);
      run = 1;
    }
  }
  best = Math.max(best, run);

  const dateSet = new Set(unique);
  let current = 0;
  let cursor = today;

  if (!dateSet.has(today)) {
    const yesterday = format(subDays(parseISO(today), 1), "yyyy-MM-dd");
    if (!dateSet.has(yesterday)) return { current: 0, best };
    cursor = yesterday;
  }

  while (dateSet.has(cursor)) {
    current++;
    cursor = format(subDays(parseISO(cursor), 1), "yyyy-MM-dd");
  }

  return { current, best };
}

export function buildHeatMapDays(
  completedDates: Set<string>,
  weeks = 12,
  today = format(new Date(), "yyyy-MM-dd"),
): { date: string; completed: boolean }[] {
  const end = parseISO(today);
  const start = startOfWeek(subWeeks(end, weeks - 1), { weekStartsOn: 1 });
  const days: { date: string; completed: boolean }[] = [];
  let cursor = start;

  while (cursor <= end) {
    const date = format(cursor, "yyyy-MM-dd");
    days.push({ date, completed: completedDates.has(date) });
    cursor = addDays(cursor, 1);
  }

  return days;
}
