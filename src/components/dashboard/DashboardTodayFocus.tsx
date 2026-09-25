import { Link } from "react-router-dom";
import { Swords, Repeat, AlertTriangle, CalendarClock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { HabitWithStats, QuestWithDetails } from "@/lib/db/types";
import { cn } from "@/lib/utils";

interface DashboardTodayFocusProps {
  priorityQuests: QuestWithDetails[];
  questCounts: {
    overdue: number;
    today: number;
    in_progress: number;
  };
  habits: {
    total: number;
    completedToday: number;
    pending: HabitWithStats[];
  };
}

export function DashboardTodayFocus({
  priorityQuests,
  questCounts,
  habits,
}: DashboardTodayFocusProps) {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">Foco de hoje</CardTitle>
        <Link to="/quests" className="text-xs text-primary hover:underline">Ver quests</Link>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {questCounts.overdue > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              {questCounts.overdue} atrasada{questCounts.overdue > 1 ? "s" : ""}
            </Badge>
          )}
          {questCounts.today > 0 && (
            <Badge variant="secondary" className="gap-1">
              <CalendarClock className="h-3 w-3" />
              {questCounts.today} para hoje
            </Badge>
          )}
          {questCounts.in_progress > 0 && (
            <Badge variant="outline">{questCounts.in_progress} em progresso</Badge>
          )}
        </div>

        {priorityQuests.length > 0 ? (
          <ul className="space-y-2">
            {priorityQuests.map((quest) => (
              <li
                key={quest.id}
                className="flex items-start gap-2 rounded-md border border-border/50 px-3 py-2 text-sm"
              >
                <Swords className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{quest.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {quest.isOverdue
                      ? "Atrasada"
                      : quest.isDueToday
                        ? "Vence hoje"
                        : quest.status === "IN_PROGRESS"
                          ? "Em progresso"
                          : "Pendente"}
                    {quest.xpReward > 0 && ` · +${quest.xpReward} XP`}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhuma quest urgente. Boa organização!</p>
        )}

        <div className="border-t border-border/50 pt-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-medium">
              <Repeat className="h-4 w-4 text-green-400" />
              Hábitos
            </span>
            <Link to="/habits" className="text-xs text-primary hover:underline">Ver todos</Link>
          </div>
          {habits.total === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum hábito cadastrado.</p>
          ) : (
            <>
              <p className="mb-2 text-xs text-muted-foreground">
                {habits.completedToday}/{habits.total} feitos hoje
              </p>
              <ul className="space-y-1.5">
                {habits.pending.map((habit) => (
                  <li
                    key={habit.id}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm",
                      "bg-secondary/40 text-muted-foreground",
                    )}
                  >
                    <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
                    <span className="truncate">{habit.title}</span>
                  </li>
                ))}
                {habits.pending.length === 0 && (
                  <p className="text-sm text-emerald-400">Todos os hábitos de hoje concluídos!</p>
                )}
              </ul>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
