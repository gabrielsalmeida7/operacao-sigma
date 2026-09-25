import { BookOpen, ClipboardList, Trophy, Target, Flame, Zap, Swords, Flag, Repeat, Timer, Gift } from "lucide-react";
import type { ActivityItem } from "@/lib/db/types";
import { cn } from "@/lib/utils";
import { formatDateBR } from "@/lib/dates";

const typeConfig: Record<ActivityItem["type"], { icon: typeof Zap; color: string }> = {
  study: { icon: BookOpen, color: "text-blue-400" },
  questions: { icon: ClipboardList, color: "text-primary" },
  simulado: { icon: Target, color: "text-amber-400" },
  xp: { icon: Zap, color: "text-yellow-400" },
  achievement: { icon: Trophy, color: "text-amber-300" },
  mission: { icon: Target, color: "text-primary" },
  quest: { icon: Swords, color: "text-emerald-400" },
  project: { icon: Flag, color: "text-violet-400" },
  habit: { icon: Repeat, color: "text-green-400" },
  daily_goal: { icon: Flame, color: "text-orange-400" },
  pomodoro: { icon: Timer, color: "text-rose-400" },
  reward: { icon: Gift, color: "text-pink-400" },
};

interface ActivityFeedProps {
  items: ActivityItem[];
  compact?: boolean;
}

export function ActivityFeed({ items, compact = false }: ActivityFeedProps) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma atividade registrada ainda.</p>;
  }

  return (
    <div className="space-y-0">
      {items.map((item, i) => {
        const cfg = typeConfig[item.type];
        const Icon = cfg.icon;
        return (
          <div
            key={item.id}
            className={cn(
              "relative flex gap-3 border-l border-border/60 pl-4",
              !compact && "pb-4",
              compact && "pb-2",
            )}
          >
            {i < items.length - 1 && (
              <span className="absolute left-[-1px] top-6 bottom-0 w-px bg-border/40" />
            )}
            <div className={cn("mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary", compact && "h-6 w-6")}>
              <Icon className={cn("h-3.5 w-3.5", cfg.color)} />
            </div>
            <div className="min-w-0 flex-1">
              <p className={cn("font-medium", compact ? "text-xs" : "text-sm")}>{item.title}</p>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                {!compact && <span>{formatDateBR(item.createdAt)}</span>}
                {item.subtitle && <span>{item.subtitle}</span>}
                {item.xp !== undefined && item.xp !== 0 && (
                  <span className={item.xp > 0 ? "text-primary" : "text-destructive"}>
                    {item.xp > 0 ? "+" : ""}
                    {item.xp} XP
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
