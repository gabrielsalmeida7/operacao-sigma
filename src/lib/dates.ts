import {
  format,
  startOfWeek,
  endOfYear,
  parseISO,
  differenceInCalendarDays,
} from "date-fns";
import { ptBR } from "date-fns/locale";

export function todayKey(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function weekKey(date = new Date()): string {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  return format(start, "yyyy-MM-dd");
}

export function formatDateBR(dateStr: string): string {
  try {
    const normalized = dateStr.length === 10 ? dateStr : dateStr.slice(0, 10);
    return format(parseISO(normalized), "dd MMM yyyy", { locale: ptBR });
  } catch {
    return dateStr;
  }
}

export function formatMonthYear(year: number, month: number): string {
  const d = new Date(year, month - 1, 1);
  return format(d, "MMMM yyyy", { locale: ptBR });
}

export function defaultFutureTargetDate(): string {
  return format(endOfYear(new Date()), "yyyy-MM-dd");
}

export function daysUntil(dateStr: string): number {
  return Math.max(0, differenceInCalendarDays(parseISO(dateStr), new Date()));
}
