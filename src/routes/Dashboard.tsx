import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Zap,
  Flame,
  Clock,
  Target,
  FileText,
  Activity,
  ClipboardList,
  Repeat,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { XPBar } from "@/components/dashboard/XPBar";
import { LifeAreaRadarChart } from "@/components/dashboard/LifeAreaRadarChart";
import { DashboardQuickLinks } from "@/components/dashboard/DashboardQuickLinks";
import { DashboardTodayFocus } from "@/components/dashboard/DashboardTodayFocus";
import { DashboardMissionsPanel } from "@/components/dashboard/DashboardMissionsPanel";
import { DashboardProjectsPanel } from "@/components/dashboard/DashboardProjectsPanel";
import { DashboardWeeklyStrip } from "@/components/dashboard/DashboardWeeklyStrip";
import { TimeProgressBars } from "@/components/dashboard/TimeProgressBars";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getProfile, getLevelProgress, refreshStreakOnLoad } from "@/lib/gamification/engine";
import { getTodayStats } from "@/lib/gamification/snapshots";
import { getTodayCheckIn, completeCheckIn } from "@/lib/db/repositories/checkin";
import { getNearestEdital } from "@/lib/db/repositories/editals";
import { getWeeklyDisciplineHighlights } from "@/lib/db/repositories/disciplines";
import { getRecentActivity } from "@/lib/db/repositories/activity";
import { getDashboardOverview } from "@/lib/dashboard/overview";
import { ActivityFeed } from "@/components/activity/ActivityFeed";
import { DashboardCycleWidget } from "@/components/study-cycles/DashboardCycleWidget";
import { useStudyStore } from "@/stores/studyStore";
import { getCycleSummary } from "@/lib/db/repositories/studyCycles";
import { formatMinutes } from "@/lib/utils";
import { formatDateBR } from "@/lib/dates";

export function Dashboard() {
  const queryClient = useQueryClient();
  const { elapsedSec, isRunning } = useStudyStore();
  const [checkInDone, setCheckInDone] = useState<boolean | null>(null);

  useEffect(() => {
    refreshStreakOnLoad();
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const [profile, today, checkIn, nearestEdital, highlights, activity, overview, cycleSummary] =
        await Promise.all([
        getProfile(),
        getTodayStats(),
        getTodayCheckIn(),
        getNearestEdital(),
        getWeeklyDisciplineHighlights(),
        getRecentActivity(5),
        getDashboardOverview(),
        getCycleSummary(),
      ]);
      const progress = getLevelProgress(profile.totalXp);
      return { profile, today, checkIn, progress, nearestEdital, highlights, activity, overview, cycleSummary };
    },
    refetchInterval: isRunning ? 5000 : 60_000,
  });

  if (isLoading || !data) {
    return <div className="p-8 text-muted-foreground">Carregando painel...</div>;
  }

  const { profile, today, checkIn, progress, nearestEdital, highlights, activity, overview, cycleSummary } = data;
  const liveMinutes = today.studyMinutes + (isRunning ? Math.floor(elapsedSec / 60) : 0);
  const remaining = Math.max(0, profile.dailyGoalMin - liveMinutes);
  const goalPercent = Math.min(100, (liveMinutes / profile.dailyGoalMin) * 100);

  const handleCheckInComplete = async (done: boolean) => {
    await completeCheckIn(done);
    setCheckInDone(done);
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  return (
    <div className="space-y-6 p-8">
      <div className="space-y-4">
        <div>
          <p className="text-sm uppercase tracking-widest text-muted-foreground">Painel de Operações</p>
          <h1 className="text-3xl font-bold">Bem-vindo, {profile.name}</h1>
        </div>
        <DashboardQuickLinks />
      </div>

      {nearestEdital && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-center justify-between pt-6">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">{nearestEdital.name}</p>
                <p className="text-sm text-muted-foreground">
                  Prova em {formatDateBR(nearestEdital.examDate)}
                </p>
              </div>
            </div>
            <Badge variant={nearestEdital.daysRemaining <= 30 ? "destructive" : "default"}>
              {nearestEdital.daysRemaining} dias
            </Badge>
          </CardContent>
        </Card>
      )}

      {checkIn && checkInDone === null && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base">Missão do dia</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">{checkIn.missionText}</p>
            <p className="text-sm text-muted-foreground">Missão concluída?</p>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => handleCheckInComplete(true)}>Sim</Button>
              <Button size="sm" variant="outline" onClick={() => handleCheckInComplete(false)}>Não</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard title="Nível" value={profile.level} icon={Zap} />
        <StatCard title="XP Total" value={profile.totalXp.toLocaleString("pt-BR")} icon={Zap} />
        <StatCard title="Sequência" value={`${profile.currentStreak}d`} subtitle={`Recorde: ${profile.bestStreak}`} icon={Flame} />
        <StatCard title="Estudo hoje" value={`${liveMinutes} min`} subtitle={remaining > 0 ? `Faltam ${remaining} min` : "Meta OK!"} icon={Clock} />
        <StatCard title="Questões hoje" value={today.questionsResolved} icon={ClipboardList} />
        <StatCard
          title="Hábitos hoje"
          value={`${overview.habits.completedToday}/${overview.habits.total}`}
          icon={Repeat}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <LifeAreaRadarChart data={overview.lifeAreaRadar} />
        </div>
        <div className="space-y-4">
          <DashboardCycleWidget
            status={cycleSummary.status}
            currentBlockNumber={cycleSummary.cycle?.currentBlockNumber ?? 1}
            hasCycle={!!cycleSummary.cycle}
          />
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-4 w-4 text-primary" />
                Meta diária
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>
                  {formatMinutes(liveMinutes)} / {formatMinutes(profile.dailyGoalMin)}
                </span>
                <span className="text-muted-foreground">{Math.round(goalPercent)}%</span>
              </div>
              <Progress value={goalPercent} className="h-3" />
              {isRunning && (
                <Badge variant="secondary" className="text-xs">Timer ativo</Badge>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Progresso de XP</CardTitle>
            </CardHeader>
            <CardContent>
              <XPBar {...progress} />
            </CardContent>
          </Card>
        </div>
      </div>

      <TimeProgressBars />

      <DashboardWeeklyStrip weekly={overview.weekly} />

      <div className="grid gap-6 lg:grid-cols-3">
        <DashboardTodayFocus
          priorityQuests={overview.priorityQuests}
          questCounts={overview.questCounts}
          habits={overview.habits}
        />
        <DashboardMissionsPanel missions={overview.missions} />
        <DashboardProjectsPanel projects={overview.activeProjects} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {(highlights.strongest || highlights.weakest) && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Disciplinas esta semana</CardTitle>
              <Link to="/knowledge" className="text-xs text-primary hover:underline">Árvore</Link>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {highlights.strongest && (
                <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
                  <p className="text-emerald-400 font-medium">Mais forte</p>
                  <p>
                    {highlights.strongest.name}{" "}
                    <span className="font-mono text-muted-foreground">
                      ({highlights.strongest.accuracy.percent}%)
                    </span>
                  </p>
                </div>
              )}
              {highlights.weakest && highlights.weakest.name !== highlights.strongest?.name && (
                <div className="rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-2">
                  <p className="text-amber-400 font-medium">Prioridade de revisão</p>
                  <p>
                    {highlights.weakest.name}{" "}
                    <span className="font-mono text-muted-foreground">
                      ({highlights.weakest.accuracy.percent}%)
                    </span>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Atividade recente
            </CardTitle>
            <Link to="/activity" className="text-xs text-primary hover:underline">Ver tudo</Link>
          </CardHeader>
          <CardContent>
            <ActivityFeed items={activity} compact />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
