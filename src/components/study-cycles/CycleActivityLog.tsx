import { Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Discipline, StudyActivityLogWithNames, StudyPhase } from "@/lib/db/types";
import { STUDY_PHASE_LABELS } from "@/lib/study-cycles/constants";
import { cn } from "@/lib/utils";

interface CycleActivityLogProps {
  logs: StudyActivityLogWithNames[];
  disciplines: Discipline[];
  onToggleFinished: (id: number) => void;
  onDelete: (id: number) => void;
  onCreate: (data: {
    disciplineId: number;
    phase: StudyPhase;
    reference: string;
    quantity: number;
    correctCount: number;
  }) => void;
}

export function CycleActivityLogTable({
  logs,
  disciplines,
  onToggleFinished,
  onDelete,
  onCreate,
}: CycleActivityLogProps) {
  const handleQuickAdd = () => {
    const first = disciplines[0];
    if (!first) return;
    onCreate({
      disciplineId: first.id,
      phase: first.studyPhase,
      reference: `Aula ${String(first.pdfsCurrent + 1).padStart(2, "0")}`,
      quantity: 0,
      correctCount: 0,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={handleQuickAdd}>
          Registrar sessão de hoje
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[800px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <th className="px-3 py-2">Matéria</th>
              <th className="px-3 py-2">Fase</th>
              <th className="px-3 py-2">Referência</th>
              <th className="px-3 py-2">Data</th>
              <th className="px-3 py-2">Página/QTD</th>
              <th className="px-3 py-2">Acertos</th>
              <th className="px-3 py-2">Fim?</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">
                  Nenhuma atividade registrada
                </td>
              </tr>
            )}
            {logs.map((log) => (
              <tr key={log.id} className="border-b last:border-0 hover:bg-muted/20">
                <td className="px-3 py-2">{log.disciplineName}</td>
                <td className="px-3 py-2">{STUDY_PHASE_LABELS[log.phase]}</td>
                <td className="px-3 py-2 max-w-[240px] truncate">{log.reference}</td>
                <td className="px-3 py-2 font-mono text-xs">{log.date}</td>
                <td className="px-3 py-2 font-mono">{log.quantity}</td>
                <td className="px-3 py-2 font-mono">{log.correctCount}</td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    onClick={() => onToggleFinished(log.id)}
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded border",
                      log.isFinished
                        ? "border-emerald-500 bg-emerald-500/20 text-emerald-400"
                        : "border-muted-foreground/30",
                    )}
                  >
                    {log.isFinished && <Check className="h-3 w-3" />}
                  </button>
                </td>
                <td className="px-3 py-2">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onDelete(log.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function CycleStatusCards({
  nextSubject,
  nextItem,
  whereStopped,
}: {
  nextSubject: string;
  nextItem: string;
  whereStopped: string;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {[
        { label: "Próxima matéria", value: nextSubject, bold: true },
        { label: "Próximo item", value: nextItem, bold: false },
        { label: "Onde parou", value: whereStopped, bold: false },
      ].map(({ label, value, bold }) => (
        <div
          key={label}
          className="rounded-xl border border-border bg-card px-4 py-3"
        >
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p
            className={
              bold
                ? "mt-1 font-bold text-primary"
                : "mt-1 text-sm text-foreground/80"
            }
          >
            {value}
          </p>
        </div>
      ))}
    </div>
  );
}
