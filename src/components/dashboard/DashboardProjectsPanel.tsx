import { Link } from "react-router-dom";
import { Flag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { ProjectWithDetails } from "@/lib/db/types";

interface DashboardProjectsPanelProps {
  projects: ProjectWithDetails[];
}

export function DashboardProjectsPanel({ projects }: DashboardProjectsPanelProps) {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Flag className="h-4 w-4 text-violet-400" />
          Projetos ativos
        </CardTitle>
        <Link to="/projects" className="text-xs text-primary hover:underline">Ver todos</Link>
      </CardHeader>
      <CardContent className="space-y-4">
        {projects.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum projeto em andamento.</p>
        ) : (
          projects.map((project) => (
            <div key={project.id} className="space-y-2 rounded-md border border-border/50 p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium leading-tight">{project.title}</p>
                {project.isOverdue && <Badge variant="destructive" className="shrink-0 text-xs">Atrasado</Badge>}
              </div>
              {project.questStats.total > 0 ? (
                <>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      {project.questStats.completed}/{project.questStats.total} quests
                    </span>
                    <span>{project.questStats.progressPercent}%</span>
                  </div>
                  <Progress value={project.questStats.progressPercent} className="h-1.5" />
                </>
              ) : (
                <p className="text-xs text-muted-foreground">Sem quests vinculadas</p>
              )}
              {project.daysRemaining !== null && !project.isOverdue && (
                <p className="text-xs text-muted-foreground">{project.daysRemaining} dias restantes</p>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
