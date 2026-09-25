import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  differenceInCalendarDays,
  format,
} from "date-fns";
import { ptBR } from "date-fns/locale";

export type TimePeriod = "week" | "month" | "year";

export interface TimePeriodProgress {
  period: TimePeriod;
  label: string;
  rangeLabel: string;
  percent: number;
  remainingDays: number;
}

function periodProgress(now: Date, start: Date, end: Date): number {
  const totalMs = end.getTime() - start.getTime();
  if (totalMs <= 0) return 100;
  const elapsedMs = now.getTime() - start.getTime();
  return Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100));
}

function remainingDays(now: Date, end: Date): number {
  return Math.max(0, differenceInCalendarDays(end, now));
}

function capitalize(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function getWeekProgress(now = new Date()): TimePeriodProgress {
  const start = startOfWeek(now, { weekStartsOn: 1 });
  const end = endOfWeek(now, { weekStartsOn: 1 });
  const rangeLabel = `${format(start, "d MMM", { locale: ptBR })} – ${format(end, "d MMM", { locale: ptBR })}`;

  return {
    period: "week",
    label: "Semana",
    rangeLabel,
    percent: periodProgress(now, start, end),
    remainingDays: remainingDays(now, end),
  };
}

export function getMonthProgress(now = new Date()): TimePeriodProgress {
  const start = startOfMonth(now);
  const end = endOfMonth(now);

  return {
    period: "month",
    label: "Mês",
    rangeLabel: capitalize(format(now, "MMMM yyyy", { locale: ptBR })),
    percent: periodProgress(now, start, end),
    remainingDays: remainingDays(now, end),
  };
}

export function getYearProgress(now = new Date()): TimePeriodProgress {
  const start = startOfYear(now);
  const end = endOfYear(now);

  return {
    period: "year",
    label: "Ano",
    rangeLabel: format(now, "yyyy"),
    percent: periodProgress(now, start, end),
    remainingDays: remainingDays(now, end),
  };
}

export function getAllTimeProgress(now = new Date()): TimePeriodProgress[] {
  return [getWeekProgress(now), getMonthProgress(now), getYearProgress(now)];
}

export function formatRemainingDays(days: number): string {
  if (days === 0) return "Último dia";
  if (days === 1) return "1 dia restante";
  return `${days} dias restantes`;
}
