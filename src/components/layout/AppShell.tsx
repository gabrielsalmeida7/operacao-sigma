import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Timer,
  Target,
  Trophy,
  GitBranch,
  BarChart3,
  Sparkles,
  Settings,
  Shield,
  FileBarChart,
  FileText,
  Activity,
  Layers,
  Swords,
  Flag,
  Repeat,
  RefreshCw,
  BookOpen,
  Gift,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/study", icon: Timer, label: "Estudo" },
  { to: "/cycles", icon: RefreshCw, label: "Ciclos" },
  { to: "/cycle-guide", icon: BookOpen, label: "Guia do Ciclo" },
  { to: "/missions", icon: Target, label: "Missões" },
  { to: "/quests", icon: Swords, label: "Quests" },
  { to: "/projects", icon: Flag, label: "Projetos" },
  { to: "/habits", icon: Repeat, label: "Hábitos" },
  { to: "/rewards", icon: Gift, label: "Loja" },
  { to: "/achievements", icon: Trophy, label: "Conquistas" },
  { to: "/knowledge", icon: GitBranch, label: "Conhecimento" },
  { to: "/life-areas", icon: Layers, label: "Áreas" },
  { to: "/weekly", icon: FileBarChart, label: "Relatório" },
  { to: "/editals", icon: FileText, label: "Editais" },
  { to: "/activity", icon: Activity, label: "Atividade" },
  { to: "/history", icon: BarChart3, label: "Histórico" },
  { to: "/future", icon: Sparkles, label: "Meu Futuro" },
  { to: "/settings", icon: Settings, label: "Configurações" },
];

export function AppShell() {
  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="flex w-60 flex-col border-r bg-sigma-panel overflow-y-auto">
        <div className="flex items-center gap-2 border-b px-4 py-5">
          <Shield className="h-6 w-6 text-primary" />
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Operação</p>
            <p className="font-semibold">Sigma</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto bg-background bg-sigma-grid bg-sigma-grid">
        <Outlet />
      </main>
    </div>
  );
}
