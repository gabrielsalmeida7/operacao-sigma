import { Link } from "react-router-dom";
import { RefreshCw, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { CycleStatus } from "@/lib/db/types";

interface DashboardCycleWidgetProps {
  status: CycleStatus;
  currentBlockNumber: number;
  hasCycle: boolean;
}

export function DashboardCycleWidget({
  status,
  currentBlockNumber,
  hasCycle,
}: DashboardCycleWidgetProps) {
  if (!hasCycle) {
    return (
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-primary/20 bg-primary/10 px-4 py-2 text-xs font-medium text-primary">
          Ciclo Rotativo
        </div>
        <div className="space-y-3 p-4">
          <p className="text-sm text-muted-foreground">
            Configure sua fila rotativa de matérias ATRF.
          </p>
          <Button asChild size="sm">
            <Link to="/cycles">Configurar ciclo</Link>
          </Button>
        </div>
      </div>
    );
  }

  const progressPercent = Math.round((currentBlockNumber / status.totalBlocks) * 100);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-primary/20 bg-primary/10 px-4 py-2">
        <span className="flex items-center gap-2 text-xs font-medium text-primary">
          <RefreshCw className="h-3.5 w-3.5" />
          Ciclo Rotativo
        </span>
        <Badge variant="secondary">
          {currentBlockNumber}/{status.totalBlocks}
        </Badge>
      </div>
      <div className="space-y-3 p-4">
        <div>
          <p className="text-sm font-bold text-foreground">{status.nextSubject}</p>
          <p className="text-xs text-muted-foreground">{status.nextItem}</p>
          {status.thematicFocus && (
            <p className="mt-1 text-[11px] text-muted-foreground">{status.thematicFocus}</p>
          )}
          {status.mandatoryReview && (
            <p className="mt-1 text-[11px] font-semibold text-rose-400">Revisão obrigatória</p>
          )}
        </div>
        <Progress value={progressPercent} className="h-2" />
        <div className="flex gap-2">
          <Button asChild size="sm" className="flex-1">
            <Link to="/study">
              Estudar
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to="/cycles">Ver ciclo</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
