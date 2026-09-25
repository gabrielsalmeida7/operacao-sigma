import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Discipline } from "@/lib/db/types";
import { previewWeightedQueue } from "@/lib/study-cycles/cycleGenerator";
import { DEFAULT_WEEKLY_SESSIONS } from "@/lib/study-cycles/constants";

interface CycleWizardProps {
  disciplines: Discipline[];
  weeklySessions: number;
  onChangeWeeklySessions: (value: number) => void;
  onChangeWeight: (id: number, weightPercent: number) => void;
  onGenerate: (weeklySessions: number) => void;
}

export function CycleWizard({
  disciplines,
  weeklySessions,
  onChangeWeeklySessions,
  onChangeWeight,
  onGenerate,
}: CycleWizardProps) {
  const [hours, setHours] = useState(String(weeklySessions || DEFAULT_WEEKLY_SESSIONS));
  const sessions = Math.max(1, parseInt(hours, 10) || DEFAULT_WEEKLY_SESSIONS);

  const active = useMemo(
    () =>
      disciplines.filter(
        (d) => d.isInCycle && (d.cycleState === "ACTIVE" || d.cycleState === "MAINTENANCE"),
      ),
    [disciplines],
  );

  const preview = useMemo(
    () => previewWeightedQueue(disciplines, sessions),
    [disciplines, sessions],
  );

  const weightSum = active.reduce((s, d) => s + d.weightPercent, 0);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">1. Tempo disponível (seg–sex)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label>Sessões semanais (1 sessão = 50 min)</Label>
          <Input
            type="number"
            min={1}
            max={40}
            className="max-w-[160px]"
            value={hours}
            onChange={(e) => {
              setHours(e.target.value);
              const next = parseInt(e.target.value, 10);
              if (next > 0) onChangeWeeklySessions(next);
            }}
          />
          <p className="text-xs text-muted-foreground">
            Exemplo do documento: 12 sessões (12h líquidas). Sábado não entra nesta conta.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">2. Pesos das matérias ativas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {active.map((d) => (
            <div key={d.id} className="flex items-center gap-3">
              <span className="w-56 truncate text-sm">{d.name}</span>
              <Input
                type="number"
                min={0}
                max={100}
                className="h-8 w-20"
                value={d.weightPercent}
                onChange={(e) => onChangeWeight(d.id, parseInt(e.target.value, 10) || 0)}
              />
              <span className="text-xs text-muted-foreground">
                {d.cycleState === "MAINTENANCE" ? "1 sessão de manutenção" : `${d.weightPercent}%`}
              </span>
            </div>
          ))}
          <p className={weightSum === 100 ? "text-xs text-muted-foreground" : "text-xs text-amber-400"}>
            Soma dos pesos: {weightSum}% {weightSum === 100 ? "" : "(ajuste para 100% se possível)"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">3. Preview da fila rotativa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ol className="grid gap-1 sm:grid-cols-2">
            {preview.map((block) => {
              const disc = disciplines.find((d) => d.id === block.disciplineId);
              return (
                <li key={block.blockNumber} className="flex gap-2 text-sm">
                  <span className="w-8 font-mono text-muted-foreground">
                    {String(block.blockNumber).padStart(2, "0")}
                  </span>
                  <span>{disc?.name ?? "—"}</span>
                </li>
              );
            })}
          </ol>
          <Button onClick={() => onGenerate(sessions)}>Gerar ciclo com esta fila</Button>
        </CardContent>
      </Card>
    </div>
  );
}
