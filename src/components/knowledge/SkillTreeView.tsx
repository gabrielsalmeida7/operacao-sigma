import { getProfile } from "@/lib/gamification/profile";
import { useQuery } from "@tanstack/react-query";
import { getDisciplinesWithProgress, accuracyColor } from "@/lib/db/repositories/disciplines";
import { getLevelProgress } from "@/lib/gamification/engine";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Shield } from "lucide-react";

const colorMap = {
  strong: "border-emerald-500/50 bg-emerald-500/10",
  attention: "border-amber-500/50 bg-amber-500/10",
  weak: "border-red-500/50 bg-red-500/10",
  none: "border-border bg-card/80",
};

const dotMap = {
  strong: "bg-emerald-500",
  attention: "bg-amber-500",
  weak: "bg-red-500",
  none: "bg-muted-foreground",
};

interface SkillTreeViewProps {
  disciplines: Awaited<ReturnType<typeof getDisciplinesWithProgress>>;
  profileLevel: number;
  profileXp: number;
}

function DisciplineNode({
  d,
}: {
  d: Awaited<ReturnType<typeof getDisciplinesWithProgress>>[0];
}) {
  const color = accuracyColor(d.accuracy.percent);
  return (
    <div
      className={cn(
        "h-full rounded-lg border p-4 transition-all hover:scale-[1.01]",
        colorMap[color],
      )}
      title={d.accuracy.percent !== null ? `${d.accuracy.percent}% de acerto` : "Sem questões"}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium truncate">{d.name}</p>
        <span className="font-mono text-xs text-primary shrink-0">Lv.{d.level}</span>
      </div>
      <div className="mt-3 space-y-1.5">
        <Progress value={d.progress.percent} className="h-1.5" />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>{d.xp} XP</span>
          {d.accuracy.percent !== null ? (
            <span className="flex items-center gap-1">
              <span className={cn("h-1.5 w-1.5 rounded-full", dotMap[color])} />
              {d.accuracy.percent}%
            </span>
          ) : (
            <span>—</span>
          )}
        </div>
      </div>
    </div>
  );
}

function TreeConnector({ columns }: { columns: number }) {
  if (columns <= 1) {
    return <div className="h-8 w-px bg-border/80" aria-hidden />;
  }

  return (
    <div className="flex w-full max-w-4xl flex-col items-center" aria-hidden>
      <div className="h-8 w-px bg-border/80" />
      <div className="relative h-px w-full bg-border/80">
        {Array.from({ length: columns }).map((_, i) => (
          <div
            key={i}
            className="absolute top-0 h-6 w-px -translate-x-1/2 bg-border/80"
            style={{ left: `${((i + 0.5) / columns) * 100}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export function SkillTreeView({ disciplines, profileLevel, profileXp }: SkillTreeViewProps) {
  const columns =
    disciplines.length <= 1 ? 1 : disciplines.length <= 2 ? 2 : disciplines.length <= 4 ? 2 : 3;

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <div className="flex w-full max-w-xs flex-col items-center rounded-xl border border-primary/40 bg-primary/10 px-6 py-5">
        <Shield className="mb-2 h-9 w-9 text-primary" />
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Operador</p>
        <p className="font-mono text-2xl font-bold text-primary">Lv.{profileLevel}</p>
        <p className="text-sm text-muted-foreground">{profileXp.toLocaleString("pt-BR")} XP</p>
      </div>

      {disciplines.length > 0 && (
        <>
          <TreeConnector columns={columns} />

          <div
            className={cn(
              "grid w-full gap-4",
              columns === 1 && "max-w-sm grid-cols-1",
              columns === 2 && "max-w-2xl grid-cols-1 sm:grid-cols-2",
              columns === 3 && "max-w-4xl grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
            )}
          >
            {disciplines.map((d) => (
              <DisciplineNode key={d.id} d={d} />
            ))}
          </div>
        </>
      )}

      {disciplines.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Adicione disciplinas abaixo para montar sua árvore de conhecimento.
        </p>
      )}

      <div className="flex w-full flex-wrap justify-center gap-x-6 gap-y-2 border-t border-border/60 pt-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> ≥70% forte
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-500" /> 50–69% atenção
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-red-500" /> &lt;50% prioridade
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-muted-foreground" /> sem dados
        </span>
      </div>
    </div>
  );
}

export function SkillTreeLoader() {
  const { data: disciplines = [] } = useQuery({
    queryKey: ["disciplines-progress"],
    queryFn: getDisciplinesWithProgress,
  });
  const { data: profile } = useQuery({
    queryKey: ["profile-tree"],
    queryFn: getProfile,
  });

  if (!profile) return null;
  const progress = getLevelProgress(profile.totalXp);

  return (
    <SkillTreeView
      disciplines={disciplines}
      profileLevel={progress.level}
      profileXp={profile.totalXp}
    />
  );
}
