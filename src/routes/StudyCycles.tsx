import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, RotateCcw, SkipForward, BookOpen, Undo2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CycleBoardShell } from "@/components/study-cycles/CycleBoardShell";
import { CycleBoardLegend } from "@/components/study-cycles/CycleBoardLegend";
import { CycleQueueList } from "@/components/study-cycles/CycleQueueList";
import { CycleLapBoard } from "@/components/study-cycles/CycleLapBoard";
import { CycleWizard } from "@/components/study-cycles/CycleWizard";
import { CycleBoardFooter, CycleStatusCards } from "@/components/study-cycles/CycleBoardFooter";
import {
  getCycleSummary,
  ensureActiveCycle,
  regenerateCycleBlocks,
  completeCycleSession,
  setCycleBlockNumber,
  reorderCycleBlocks,
  updateCycleSettings,
  markTheoryComplete,
  undoLastCycleSession,
} from "@/lib/db/repositories/studyCycles";
import {
  getDisciplineCycleRows,
  updateDisciplineCycleSettings,
  getDisciplines,
} from "@/lib/db/repositories/disciplines";
import {
  getAllTopicsGrouped,
  createTopic,
  deleteTopic,
  setSegmentProgress,
} from "@/lib/db/repositories/disciplineTopics";
import {
  getActivityLogs,
  createActivityLog,
  toggleActivityFinished,
  deleteActivityLog,
} from "@/lib/db/repositories/studyActivityLog";
import { CycleSubjectsTable } from "@/components/study-cycles/CycleSubjectsTable";
import { CycleBookmarkPanel } from "@/components/study-cycles/CycleBookmarkPanel";
import { CycleTopicsPanel } from "@/components/study-cycles/CycleTopicsPanel";
import { CycleActivityLogTable } from "@/components/study-cycles/CycleActivityLog";
import { formatMinutes } from "@/lib/utils";

export function StudyCycles() {
  const queryClient = useQueryClient();
  const [cycleName, setCycleName] = useState("Ciclo ATRF");

  const { data: summary, isLoading } = useQuery({
    queryKey: ["cycle-summary"],
    queryFn: getCycleSummary,
  });

  const { data: subjectRows = [] } = useQuery({
    queryKey: ["discipline-cycle-rows"],
    queryFn: getDisciplineCycleRows,
  });

  const { data: topicGroups = [] } = useQuery({
    queryKey: ["topic-groups"],
    queryFn: getAllTopicsGrouped,
  });

  const { data: activityLogs = [] } = useQuery({
    queryKey: ["activity-logs"],
    queryFn: () => getActivityLogs(50),
  });

  const { data: disciplines = [] } = useQuery({
    queryKey: ["disciplines"],
    queryFn: getDisciplines,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["cycle-summary"] });
    queryClient.invalidateQueries({ queryKey: ["discipline-cycle-rows"] });
    queryClient.invalidateQueries({ queryKey: ["topic-groups"] });
    queryClient.invalidateQueries({ queryKey: ["activity-logs"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["disciplines"] });
  };

  const handleEnsureCycle = async () => {
    await ensureActiveCycle(cycleName);
    invalidate();
  };

  const handleRegenerate = async () => {
    if (!summary?.cycle) return;
    if (!window.confirm("Regenerar a fila rotativa? Ajustes manuais de sessão serão preservados.")) {
      return;
    }
    await regenerateCycleBlocks(summary.cycle.id, true);
    invalidate();
  };

  const handleAdvance = async () => {
    if (!summary?.cycle) return;
    await completeCycleSession(summary.cycle.id);
    invalidate();
  };

  const handleUndo = async () => {
    if (!summary?.cycle) return;
    const undone = await undoLastCycleSession(summary.cycle.id);
    if (!undone) {
      window.alert("Não há sessão concluída para desfazer.");
      return;
    }
    invalidate();
  };

  const handleReorder = async (orderedIds: number[]) => {
    if (!summary?.cycle) return;
    await reorderCycleBlocks(summary.cycle.id, orderedIds);
    invalidate();
  };

  if (isLoading) {
    return <div className="p-8 text-muted-foreground">Carregando ciclo...</div>;
  }

  const cycle = summary?.cycle;
  const blocks = summary?.blocks ?? [];
  const completions = summary?.completions ?? [];
  const status = summary?.status;
  const totalBlocks = blocks.length || cycle?.weeklySessions || 12;
  const currentBlock = blocks.find((b) => b.blockNumber === cycle?.currentBlockNumber) ?? null;
  const currentDisciplineId = currentBlock?.disciplineId ?? null;

  return (
    <div className="space-y-6 p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-widest text-muted-foreground">Planejamento</p>
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            <RefreshCw className="h-8 w-8 text-primary" />
            Ciclo Rotativo
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Fila circular de sessões — não é calendário. Se faltar um dia, retome de onde parou.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/cycle-guide">
            <BookOpen className="mr-2 h-4 w-4" />
            Como seguir o ciclo
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs uppercase text-muted-foreground">Matérias no ciclo</p>
            <p className="text-2xl font-bold">{summary?.subjectCount ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs uppercase text-muted-foreground">Sessões na fila</p>
            <p className="text-2xl font-bold">{totalBlocks}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs uppercase text-muted-foreground">Tempo da volta</p>
            <p className="text-2xl font-bold">{formatMinutes(summary?.estimatedMinutes ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs uppercase text-muted-foreground">Sessão atual</p>
            <p className="text-2xl font-bold">
              {cycle ? `${cycle.currentBlockNumber}/${totalBlocks}` : "—"}
            </p>
            {cycle && (
              <p className="text-xs text-muted-foreground">Volta {cycle.currentLap}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {status && (
        <CycleStatusCards
          nextSubject={status.nextSubject}
          nextItem={status.nextItem}
          whereStopped={status.whereStopped}
        />
      )}

      {cycle && (
        <CycleBookmarkPanel
          disciplines={disciplines}
          selectedDisciplineId={currentDisciplineId}
          onSave={async (id, data) => {
            await updateDisciplineCycleSettings(id, data);
            invalidate();
          }}
        />
      )}

      <Tabs defaultValue="cycle">
        <TabsList>
          <TabsTrigger value="cycle">Ciclo</TabsTrigger>
          <TabsTrigger value="build">Montar</TabsTrigger>
          <TabsTrigger value="subjects">Matérias</TabsTrigger>
          <TabsTrigger value="topics">Tópicos</TabsTrigger>
          <TabsTrigger value="log">Log</TabsTrigger>
        </TabsList>

        <TabsContent value="cycle" className="mt-4 space-y-4">
          {!cycle ? (
            <Card>
              <CardContent className="space-y-4 pt-6">
                <div className="max-w-sm space-y-2">
                  <Label>Nome do ciclo</Label>
                  <Input value={cycleName} onChange={(e) => setCycleName(e.target.value)} />
                </div>
                <Button onClick={handleEnsureCycle}>Criar ciclo ATRF de 12h</Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleAdvance}>
                  <SkipForward className="mr-2 h-4 w-4" />
                  Concluir sessão
                </Button>
                <Button
                  variant="outline"
                  onClick={handleUndo}
                  disabled={completions.length === 0}
                >
                  <Undo2 className="mr-2 h-4 w-4" />
                  Desfazer última sessão
                </Button>
                <Button variant="outline" onClick={handleRegenerate}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Regenerar fila
                </Button>
                <Select
                  value={String(cycle.currentBlockNumber)}
                  onValueChange={async (v) => {
                    await setCycleBlockNumber(cycle.id, parseInt(v, 10));
                    invalidate();
                  }}
                >
                  <SelectTrigger className="w-56">
                    <SelectValue placeholder="Ir para sessão" />
                  </SelectTrigger>
                  <SelectContent>
                    {blocks.map((b) => (
                      <SelectItem key={b.id} value={String(b.blockNumber)}>
                        Sessão {b.blockNumber}
                        {b.disciplineName ? ` — ${b.disciplineName}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <CycleBoardShell
                title="Controle visual da fila"
                subtitle={`${totalBlocks} sessões · volta ${cycle.currentLap} · ${cycle.sessionMinutes} min cada`}
                footer={<CycleBoardFooter totalBlocks={totalBlocks} />}
              >
                <CycleLapBoard cycle={cycle} blocks={blocks} completions={completions} />
              </CycleBoardShell>

              <CycleBoardShell
                title="Ordem da fila (arraste para ajustar)"
                subtitle="Segure o ícone de arrastar à esquerda e solte na nova posição."
              >
                <CycleBoardLegend />
                <CycleQueueList cycle={cycle} blocks={blocks} onReorder={handleReorder} />
              </CycleBoardShell>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Sábado — ciclo misto</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Revisões complementares, discursivas e simulados. Não entra na fila de segunda a
                  sexta e não avança teoria.
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="build" className="mt-4">
          {!cycle ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Crie um ciclo antes de montar a fila.</p>
                <Button className="mt-3" onClick={handleEnsureCycle}>
                  Criar ciclo
                </Button>
              </CardContent>
            </Card>
          ) : (
            <CycleWizard
              disciplines={disciplines}
              weeklySessions={cycle.weeklySessions}
              onChangeWeeklySessions={async (value) => {
                await updateCycleSettings(cycle.id, { weeklySessions: value });
                invalidate();
              }}
              onChangeWeight={async (id, weightPercent) => {
                await updateDisciplineCycleSettings(id, { weightPercent });
                invalidate();
              }}
              onGenerate={async (weeklySessions) => {
                await updateCycleSettings(cycle.id, { weeklySessions });
                await regenerateCycleBlocks(cycle.id, false);
                invalidate();
              }}
            />
          )}
        </TabsContent>

        <TabsContent value="subjects" className="mt-4">
          <CycleSubjectsTable
            rows={subjectRows}
            onUpdate={async (id, data) => {
              await updateDisciplineCycleSettings(id, data);
              invalidate();
            }}
            onMarkTheoryComplete={
              cycle
                ? async (id) => {
                    await markTheoryComplete(cycle.id, id);
                    invalidate();
                  }
                : undefined
            }
          />
        </TabsContent>

        <TabsContent value="topics" className="mt-4">
          <CycleTopicsPanel
            groups={topicGroups}
            onCreateTopic={async (disciplineId, data) => {
              await createTopic(disciplineId, data);
              invalidate();
            }}
            onDeleteTopic={async (id) => {
              await deleteTopic(id);
              invalidate();
            }}
            onUpdateSegment={async (topicId, segment, resolved, correct) => {
              await setSegmentProgress(topicId, segment, resolved, correct);
              invalidate();
            }}
          />
        </TabsContent>

        <TabsContent value="log" className="mt-4">
          <CycleActivityLogTable
            logs={activityLogs}
            disciplines={disciplines}
            onToggleFinished={async (id) => {
              await toggleActivityFinished(id);
              invalidate();
            }}
            onDelete={async (id) => {
              await deleteActivityLog(id);
              invalidate();
            }}
            onCreate={async (data) => {
              await createActivityLog(data);
              invalidate();
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
