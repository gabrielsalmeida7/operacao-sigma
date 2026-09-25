import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type {
  CycleState,
  DisciplineCycleRow,
  StudyPhase,
  StudyPriority,
} from "@/lib/db/types";
import {
  CYCLE_ROLE_LABELS,
  CYCLE_STATE_LABELS,
  PRIORITY_LABELS,
  STUDY_PHASE_LABELS,
  STUDY_PRIORITIES,
} from "@/lib/study-cycles/constants";

interface CycleSubjectsTableProps {
  rows: DisciplineCycleRow[];
  onUpdate: (
    id: number,
    data: Partial<{
      studyPriority: StudyPriority;
      studyPhase: StudyPhase;
      blockMinutes: number;
      pdfsTotal: number;
      pdfsCurrent: number;
      isInCycle: boolean;
      targetAccuracyPercent: number | null;
      cycleState: CycleState;
      weightPercent: number;
    }>,
  ) => void;
  onMarkTheoryComplete?: (id: number) => void;
}

function stateVariant(state: CycleState): "default" | "secondary" | "outline" {
  switch (state) {
    case "ACTIVE":
      return "default";
    case "MAINTENANCE":
      return "secondary";
    case "LOCKED":
      return "outline";
    default: {
      const _never: never = state;
      return _never;
    }
  }
}

export function CycleSubjectsTable({
  rows,
  onUpdate,
  onMarkTheoryComplete,
}: CycleSubjectsTableProps) {
  const ordered = [...rows].sort((a, b) => a.cycleSortOrder - b.cycleSortOrder || a.name.localeCompare(b.name));

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[1100px] text-sm">
        <thead>
          <tr className="border-b bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-3 py-2">Matéria</th>
            <th className="px-3 py-2">Papel</th>
            <th className="px-3 py-2">Estado</th>
            <th className="px-3 py-2">Peso %</th>
            <th className="px-3 py-2">Fase</th>
            <th className="px-3 py-2">PDFs</th>
            <th className="px-3 py-2 min-w-[100px]">Progresso</th>
            <th className="px-3 py-2">% acerto</th>
            <th className="px-3 py-2">Ciclo</th>
            <th className="px-3 py-2">Ação</th>
          </tr>
        </thead>
        <tbody>
          {ordered.map((row) => (
            <tr key={row.id} className="border-b last:border-0 hover:bg-muted/20">
              <td className="px-3 py-2 font-medium">{row.name}</td>
              <td className="px-3 py-2 text-xs text-muted-foreground">
                {CYCLE_ROLE_LABELS[row.cycleRole]}
              </td>
              <td className="px-3 py-2">
                <Badge variant={stateVariant(row.cycleState)}>
                  {CYCLE_STATE_LABELS[row.cycleState]}
                </Badge>
              </td>
              <td className="px-3 py-2">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  className="h-8 w-16"
                  value={row.weightPercent}
                  onChange={(e) =>
                    onUpdate(row.id, { weightPercent: parseInt(e.target.value, 10) || 0 })
                  }
                />
              </td>
              <td className="px-3 py-2">
                <Select
                  value={row.studyPhase}
                  onValueChange={(v) => onUpdate(row.id, { studyPhase: v as StudyPhase })}
                >
                  <SelectTrigger className="h-8 w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(["PDF", "QUESTIONS"] as StudyPhase[]).map((phase) => (
                      <SelectItem key={phase} value={phase}>
                        {STUDY_PHASE_LABELS[phase]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </td>
              <td className="px-3 py-2">
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min={0}
                    className="h-8 w-14"
                    value={row.pdfsCurrent}
                    onChange={(e) =>
                      onUpdate(row.id, { pdfsCurrent: parseInt(e.target.value, 10) || 0 })
                    }
                  />
                  <span className="text-muted-foreground">/</span>
                  <Input
                    type="number"
                    min={0}
                    className="h-8 w-14"
                    value={row.pdfsTotal}
                    onChange={(e) =>
                      onUpdate(row.id, { pdfsTotal: parseInt(e.target.value, 10) || 0 })
                    }
                  />
                </div>
              </td>
              <td className="px-3 py-2">
                <Progress value={row.pdfProgressPercent ?? 0} className="h-2" />
              </td>
              <td className="px-3 py-2 font-mono">
                {row.accuracyPercent != null ? `${row.accuracyPercent}%` : "—"}
              </td>
              <td className="px-3 py-2">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={row.isInCycle}
                    onCheckedChange={(checked) => onUpdate(row.id, { isInCycle: checked })}
                  />
                  <Select
                    value={row.studyPriority}
                    onValueChange={(v) => onUpdate(row.id, { studyPriority: v as StudyPriority })}
                  >
                    <SelectTrigger className="h-8 w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STUDY_PRIORITIES.map((p) => (
                        <SelectItem key={p} value={p}>
                          {PRIORITY_LABELS[p]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </td>
              <td className="px-3 py-2">
                {onMarkTheoryComplete && row.cycleState === "ACTIVE" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onMarkTheoryComplete(row.id)}
                  >
                    Teoria concluída
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
