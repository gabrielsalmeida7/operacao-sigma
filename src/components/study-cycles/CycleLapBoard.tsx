import type { StudyCycle, StudyCycleBlockWithDiscipline, StudyCycleCompletion } from "@/lib/db/types";
import { lapColor, WEEK_LAP_COLORS } from "@/lib/study-cycles/constants";
import { cn } from "@/lib/utils";

interface CycleLapBoardProps {
  cycle: StudyCycle;
  blocks: StudyCycleBlockWithDiscipline[];
  completions: StudyCycleCompletion[];
}

export function CycleLapBoard({ cycle, blocks, completions }: CycleLapBoardProps) {
  const maxLap = Math.max(cycle.currentLap, ...completions.map((c) => c.lap), 1);
  const visibleLaps = Array.from({ length: maxLap }, (_, i) => i + 1);
  const painted = new Set(completions.map((c) => `${c.lap}:${c.blockNumber}`));
  const colorByKey = new Map(completions.map((c) => [`${c.lap}:${c.blockNumber}`, c.weekColor]));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {WEEK_LAP_COLORS.map((color, index) => (
          <span
            key={color.key}
            className={cn("rounded-full px-2.5 py-1 text-[10px] font-semibold", color.cell, color.text)}
          >
            Volta {index + 1}: {color.label}
          </span>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-background/60">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-[10px] uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2">Disciplina</th>
              <th className="px-3 py-2">Foco temático</th>
              <th className="px-3 py-2">Orientação</th>
              {visibleLaps.map((lap) => (
                <th key={lap} className="px-2 py-2 text-center">
                  V{lap}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {blocks.map((block) => {
              const isCurrent = block.blockNumber === cycle.currentBlockNumber;
              return (
                <tr
                  key={block.id}
                  className={cn(
                    "border-b border-border/60 last:border-0",
                    isCurrent && "bg-primary/10",
                  )}
                >
                  <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                    {String(block.blockNumber).padStart(2, "0")}
                  </td>
                  <td className="px-3 py-2 font-medium text-foreground">
                    {block.disciplineName ?? "—"}
                    {isCurrent && (
                      <span className="ml-2 rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                        agora
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {block.thematicFocus ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {block.studyHint ?? "—"}
                  </td>
                  {visibleLaps.map((lap) => {
                    const key = `${lap}:${block.blockNumber}`;
                    const done = painted.has(key);
                    const color = colorByKey.get(key) ?? lapColor(lap).hex;
                    const owed =
                      lap === cycle.currentLap &&
                      !done &&
                      block.blockNumber < cycle.currentBlockNumber;
                    return (
                      <td key={lap} className="px-2 py-2 text-center">
                        <span
                          className={cn(
                            "inline-block h-6 w-6 rounded",
                            owed && "ring-2 ring-rose-400 ring-offset-1 ring-offset-background",
                          )}
                          style={{
                            backgroundColor: done ? color : "transparent",
                            border: done ? "none" : "1px dashed hsl(var(--border))",
                          }}
                          title={
                            done
                              ? `Volta ${lap} concluída`
                              : owed
                                ? "Sessão devida"
                                : `Volta ${lap}`
                          }
                        />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        Célula pintada = sessão cumprida naquela volta. Borda vermelha = sessão devida na volta atual.
        Sábado fica de fora desta fila (ciclo misto / discursivas).
      </p>
    </div>
  );
}
