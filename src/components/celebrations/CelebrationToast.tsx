import { useEffect } from "react";
import { Trophy, Target, Flame, GitBranch, Zap, Timer, Gift } from "lucide-react";
import type { CelebrationEvent } from "@/lib/gamification/events";
import { cn } from "@/lib/utils";

interface CelebrationToastProps {
  event: CelebrationEvent;
  onDone: () => void;
}

function toastContent(event: CelebrationEvent) {
  switch (event.type) {
    case "achievement":
      return { icon: Trophy, title: "Conquista!", desc: `${event.title} (+${event.xp} XP)` };
    case "mission":
      return { icon: Target, title: "Missão completa!", desc: `${event.title} (+${event.xp} XP)` };
    case "quest":
      return { icon: Target, title: "Quest completa!", desc: `${event.title} (+${event.xp} XP)` };
    case "project":
      return { icon: Target, title: "Projeto concluído!", desc: `${event.title} (+${event.xp} XP)` };
    case "habit":
      return { icon: Target, title: "Hábito feito!", desc: `${event.title} (+${event.xp} XP)` };
    case "daily_goal":
      return { icon: Flame, title: "Meta diária!", desc: "Você cumpriu sua meta de hoje (+25 XP)" };
    case "discipline_level_up":
      return { icon: GitBranch, title: "Disciplina subiu!", desc: `${event.name} → Lv.${event.level}` };
    case "level_up":
      return { icon: Zap, title: "Level up!", desc: `Nível ${event.level}` };
    case "pomodoro":
      return {
        icon: Timer,
        title: "Pomodoro completo!",
        desc: `${event.minutes} min de foco (+${event.xp} XP bônus)`,
      };
    case "reward":
      return {
        icon: Gift,
        title: "Recompensa resgatada!",
        desc: `${event.title} (${event.xp} XP)`,
      };
    default: {
      const _never: never = event;
      return _never;
    }
  }
}

export function CelebrationToast({ event, onDone }: CelebrationToastProps) {
  const { icon: Icon, title, desc } = toastContent(event);

  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-[100] flex items-center gap-3 rounded-lg border border-primary/30",
        "bg-card px-4 py-3 shadow-lg animate-in slide-in-from-bottom-4 fade-in duration-300",
      )}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <p className="font-semibold text-sm">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}
