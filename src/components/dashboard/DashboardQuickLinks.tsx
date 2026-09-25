import { Link } from "react-router-dom";
import {
  Timer,
  Swords,
  Repeat,
  Gift,
  Flag,
  Target,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { to: "/study", icon: Timer, label: "Estudar" },
  { to: "/quests", icon: Swords, label: "Quests" },
  { to: "/habits", icon: Repeat, label: "Hábitos" },
  { to: "/projects", icon: Flag, label: "Projetos" },
  { to: "/missions", icon: Target, label: "Missões" },
  { to: "/rewards", icon: Gift, label: "Loja" },
  { to: "/knowledge", icon: BookOpen, label: "Conhecimento" },
];

export function DashboardQuickLinks() {
  return (
    <div className="flex flex-wrap gap-2">
      {links.map(({ to, icon: Icon, label }) => (
        <Link
          key={to}
          to={to}
          className={cn(
            "inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/80 px-3 py-1.5",
            "text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary",
          )}
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </Link>
      ))}
    </div>
  );
}
