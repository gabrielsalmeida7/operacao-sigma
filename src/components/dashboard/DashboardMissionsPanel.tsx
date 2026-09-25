import { Link } from "react-router-dom";
import { Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { MissionProgress, MissionTemplate } from "@/lib/db/types";

interface MissionItem {
  template: MissionTemplate;
  progress: MissionProgress;
}

interface DashboardMissionsPanelProps {
  missions: MissionItem[];
}

export function DashboardMissionsPanel({ missions }: DashboardMissionsPanelProps) {
  const daily = missions.filter((m) => m.template.type === "DAILY");
  const weekly = missions.filter((m) => m.template.type === "WEEKLY");

  const MissionRow = ({ item }: { item: MissionItem }) => {
    const percent = Math.min(100, (item.progress.current / item.template.target) * 100);
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="truncate">{item.template.title}</span>
          <span className="shrink-0 font-mono text-xs text-muted-foreground">
            {item.progress.current}/{item.template.target}
          </span>
        </div>
        <Progress value={percent} className="h-1.5" />
      </div>
    );
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="h-4 w-4 text-primary" />
          Missões
        </CardTitle>
        <Link to="/missions" className="text-xs text-primary hover:underline">Ver todas</Link>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Diárias</p>
          {daily.map((m) => (
            <div key={m.template.id} className="space-y-1">
              <MissionRow item={m} />
              {m.progress.completed && (
                <Badge variant="secondary" className="text-xs">Concluída · +{m.template.xpReward} XP</Badge>
              )}
            </div>
          ))}
        </div>
        <div className="space-y-3 border-t border-border/50 pt-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Semanais</p>
          {weekly.map((m) => (
            <div key={m.template.id} className="space-y-1">
              <MissionRow item={m} />
              {m.progress.completed && (
                <Badge variant="secondary" className="text-xs">Concluída · +{m.template.xpReward} XP</Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
