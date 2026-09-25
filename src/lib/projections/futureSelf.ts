import { getDb } from "@/lib/db/client";
import { daysUntil } from "@/lib/dates";
import { getProfile } from "@/lib/gamification/engine";
import { getSettings } from "@/lib/db/repositories/settings";
import { getEditals, getEditalDisciplines } from "@/lib/db/repositories/editals";
import { subDays, format } from "date-fns";

export interface FutureProjection {
  userName: string;
  targetDate: string;
  targetLabel: string;
  daysRemaining: number;
  avgMinutesPerDay: number;
  avgQuestionsPerDay: number;
  projectedHours: number;
  projectedQuestions: number;
  currentTotalHours: number;
  currentTotalQuestions: number;
  motivationalText: string;
  editalId: number | null;
}

export async function calculateFutureProjection(
  windowDays = 30,
  editalId?: number | null,
): Promise<FutureProjection> {
  const db = await getDb();
  const profile = await getProfile();
  const settings = await getSettings();

  const since = format(subDays(new Date(), windowDays), "yyyy-MM-dd");
  const stats = await db.select<{
    totalMin: number;
    totalQ: number;
    days: number;
  }[]>(
    `SELECT
      COALESCE(SUM(studyMinutes), 0) as totalMin,
      COALESCE(SUM(questionsResolved), 0) as totalQ,
      COUNT(*) as days
    FROM DailyStats WHERE date >= ?`,
    [since],
  );

  const s = stats[0] ?? { totalMin: 0, totalQ: 0, days: 0 };
  const activeDays = Math.max(s.days, 1);
  const avgMinutes = s.totalMin / activeDays;
  const avgQuestions = s.totalQ / activeDays;

  let targetDate = settings.futureTargetDate || `${new Date().getFullYear()}-12-31`;
  let targetLabel = "Data alvo";
  let resolvedEditalId: number | null = null;

  const selectedId = editalId ?? settings.selectedEditalId;
  if (selectedId) {
    const editals = await getEditals();
    const edital = editals.find((e) => e.id === selectedId && e.isActive);
    if (edital) {
      targetDate = edital.examDate;
      targetLabel = edital.name;
      resolvedEditalId = edital.id;
    }
  }

  const daysRem = daysUntil(targetDate);
  const projectedMinutes = avgMinutes * daysRem;
  const projectedHours = Math.round((projectedMinutes / 60) * 10) / 10;
  const projectedQuestions = Math.round(avgQuestions * daysRem);

  const hoursPerDay = Math.round((avgMinutes / 60) * 10) / 10;
  let motivationalText =
    hoursPerDay >= 0.5
      ? `Se você mantiver ${hoursPerDay}h por dia até ${targetDate.split("-").reverse().join("/")}, acumulará ~${projectedHours}h e ~${projectedQuestions.toLocaleString("pt-BR")} questões.`
      : `Aumente seu ritmo diário para ver projeções mais impactantes. Cada minuto conta.`;

  if (resolvedEditalId) {
    const discs = await getEditalDisciplines(resolvedEditalId);
    if (discs.length > 0) {
      motivationalText += ` Foco no edital: ${discs.map((d) => d.discipline.name).join(", ")}.`;
    }
  }

  return {
    userName: profile.name,
    targetDate,
    targetLabel,
    daysRemaining: daysRem,
    avgMinutesPerDay: Math.round(avgMinutes),
    avgQuestionsPerDay: Math.round(avgQuestions * 10) / 10,
    projectedHours,
    projectedQuestions,
    currentTotalHours: Math.round((profile.totalStudyMin / 60) * 10) / 10,
    currentTotalQuestions: profile.totalQuestions,
    motivationalText,
    editalId: resolvedEditalId,
  };
}
