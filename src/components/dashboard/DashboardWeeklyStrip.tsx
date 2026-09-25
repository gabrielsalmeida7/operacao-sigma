import { Link } from "react-router-dom";
import { TrendingUp, Clock, ClipboardList, Zap, Flame } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { DashboardWeeklyStats } from "@/lib/dashboard/overview";
import { getWeekRangeLabel } from "@/lib/dashboard/overview";
import { formatMinutes } from "@/lib/utils";

interface DashboardWeeklyStripProps {
  weekly: DashboardWeeklyStats;
}

export function DashboardWeeklyStrip({ weekly }: DashboardWeeklyStripProps) {
  const items = [
    {
      icon: Clock,
      label: "Estudo",
      value: formatMinutes(weekly.studyMinutes),
      color: "text-sky-400",
    },
    {
      icon: ClipboardList,
      label: "Questões",
      value: weekly.questionsResolved.toLocaleString("pt-BR"),
      color: "text-primary",
    },
    {
      icon: Zap,
      label: "XP ganho",
      value: weekly.xpEarned.toLocaleString("pt-BR"),
      color: "text-amber-400",
    },
    {
      icon: Flame,
      label: "Metas batidas",
      value: `${weekly.goalsMet}/7`,
      color: "text-orange-400",
    },
  ];

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Resumo da semana</span>
            <span className="text-xs text-muted-foreground">({getWeekRangeLabel()})</span>
          </div>
          <Link to="/weekly" className="text-xs text-primary hover:underline">
            Relatório completo
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="flex items-center gap-3 rounded-lg border border-border/50 bg-secondary/20 px-4 py-3">
              <Icon className={`h-5 w-5 shrink-0 ${color}`} />
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="font-mono text-lg font-semibold">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
