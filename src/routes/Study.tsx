import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Play,
  Pause,
  Square,
  BookOpen,
  ClipboardList,
  Timer,
  RotateCcw,
  SkipForward,
  RefreshCw,
  Undo2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStudyStore } from "@/stores/studyStore";
import { usePomodoroStore } from "@/stores/pomodoroStore";
import { useTqrStore } from "@/stores/tqrStore";
import { getDisciplines, updateDisciplineCycleSettings } from "@/lib/db/repositories/disciplines";
import { getActiveLifeAreas } from "@/lib/db/repositories/lifeAreas";
import { recordQuestions } from "@/lib/gamification/engine";
import { POMODORO_BONUS_XP } from "@/lib/gamification/constants";
import {
  POMODORO_PHASE_LABELS,
  POMODORO_PHASE_SECONDS,
  type PomodoroPhase,
} from "@/lib/gamification/pomodoro";
import { formatDuration, cn } from "@/lib/utils";
import { useCelebrationStore } from "@/stores/celebrationStore";
import { getCycleSummary, completeCycleSession, finishTqrSession, undoLastCycleSession } from "@/lib/db/repositories/studyCycles";
import { getTopicsByDiscipline } from "@/lib/db/repositories/disciplineTopics";
import { SEGMENT_LABELS, STUDY_PHASE_LABELS, TQR_ACCURACY_GATE } from "@/lib/study-cycles/constants";
import { TQR_PHASE_LABELS } from "@/lib/study-cycles/tqrSession";
import { resolveCurrentTopic } from "@/lib/study-cycles/nextItemResolver";
import { CycleBookmarkPanel } from "@/components/study-cycles/CycleBookmarkPanel";
import type { TqrPhase } from "@/lib/db/types";

type TimerMode = "tqr" | "free" | "pomodoro";

function DisciplineSelect({
  value,
  onChange,
  disciplinesByArea,
  unassigned,
  disabled,
}: {
  value: number | null;
  onChange: (id: number | null) => void;
  disciplinesByArea: { area: { id: number; name: string }; items: { id: number; name: string }[] }[];
  unassigned: { id: number; name: string }[];
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label>Disciplina (opcional)</Label>
      <Select
        value={value?.toString() ?? "none"}
        onValueChange={(v) => onChange(v === "none" ? null : parseInt(v, 10))}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder="Selecione..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Nenhuma</SelectItem>
          {disciplinesByArea.map(({ area, items }) =>
            items.length > 0
              ? items.map((d) => (
                  <SelectItem key={d.id} value={d.id.toString()}>
                    {area.name} — {d.name}
                  </SelectItem>
                ))
              : null,
          )}
          {unassigned.map((d) => (
            <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function Study() {
  const queryClient = useQueryClient();
  const pushEvents = useCelebrationStore((s) => s.pushEvents);
  const [timerMode, setTimerMode] = useState<TimerMode>("tqr");
  const prevFocusCount = useRef(0);
  const [gateMessage, setGateMessage] = useState<string | null>(null);

  const {
    session,
    isRunning: freeRunning,
    elapsedSec,
    disciplineId: freeDisciplineId,
    init,
    start,
    pause,
    resume,
    stop,
    setDiscipline: setFreeDiscipline,
  } = useStudyStore();

  const {
    phase,
    remainingSec,
    isRunning: pomoRunning,
    disciplineId: pomoDisciplineId,
    completedFocusCount,
    phaseTotalSec,
    setPhase,
    setDiscipline: setPomoDiscipline,
    start: pomoStart,
    pause: pomoPause,
    resume: pomoResume,
    reset: pomoReset,
    skip: pomoSkip,
  } = usePomodoroStore();

  const {
    phase: tqrPhase,
    remainingSec: tqrRemaining,
    phaseTotalSec: tqrTotal,
    isRunning: tqrRunning,
    isDone: tqrDone,
    configure: configureTqr,
    start: tqrStart,
    pause: tqrPause,
    resume: tqrResume,
    reset: tqrReset,
    skip: tqrSkip,
  } = useTqrStore();

  const [resolved, setResolved] = useState("10");
  const [correct, setCorrect] = useState("7");
  const [topicId, setTopicId] = useState<string>("none");
  const [segment, setSegment] = useState<string>("1");
  const cycleApplied = useRef(false);

  useEffect(() => {
    init();
  }, [init]);

  const { data: cycleSummary } = useQuery({
    queryKey: ["cycle-summary"],
    queryFn: getCycleSummary,
  });

  const currentDisciplineId =
    cycleSummary?.status.currentBlock?.disciplineId ?? null;

  useEffect(() => {
    if (cycleApplied.current || !currentDisciplineId || session) return;
    setFreeDiscipline(currentDisciplineId);
    setPomoDiscipline(currentDisciplineId);
    cycleApplied.current = true;
  }, [currentDisciplineId, session, setFreeDiscipline, setPomoDiscipline]);

  const { data: cycleTopics = [] } = useQuery({
    queryKey: ["cycle-topics", currentDisciplineId],
    queryFn: () =>
      currentDisciplineId ? getTopicsByDiscipline(currentDisciplineId) : Promise.resolve([]),
    enabled: !!currentDisciplineId,
  });

  useEffect(() => {
    if (completedFocusCount > prevFocusCount.current) {
      queryClient.invalidateQueries();
    }
    prevFocusCount.current = completedFocusCount;
  }, [completedFocusCount, queryClient]);

  const { data: disciplines = [] } = useQuery({
    queryKey: ["disciplines"],
    queryFn: getDisciplines,
  });

  const { data: lifeAreas = [] } = useQuery({
    queryKey: ["life-areas-active"],
    queryFn: getActiveLifeAreas,
  });

  const disciplinesByArea = lifeAreas.map((area) => ({
    area,
    items: disciplines.filter((d) => d.lifeAreaId === area.id),
  }));
  const unassigned = disciplines.filter((d) => !d.lifeAreaId);

  const anyRunning = freeRunning || pomoRunning || tqrRunning;
  const activeDisciplineId =
    timerMode === "free" ? freeDisciplineId : timerMode === "pomodoro" ? pomoDisciplineId : currentDisciplineId;

  const handleQuestions = async () => {
    const r = parseInt(resolved, 10) || 0;
    const c = parseInt(correct, 10) || 0;
    if (r <= 0) return;
    const result = await recordQuestions(r, Math.min(c, r), activeDisciplineId, false, {
      topicId: topicId === "none" ? null : parseInt(topicId, 10),
      segment: segment ? parseInt(segment, 10) : null,
      phase: "QUESTIONS",
    });
    pushEvents(result.events);
    queryClient.invalidateQueries();
  };

  const handleAdvanceBlock = async () => {
    if (!cycleSummary?.cycle) return;
    await completeCycleSession(cycleSummary.cycle.id);
    cycleApplied.current = false;
    queryClient.invalidateQueries({ queryKey: ["cycle-summary"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const handleUndoSession = async () => {
    if (!cycleSummary?.cycle) return;
    const undone = await undoLastCycleSession(cycleSummary.cycle.id);
    if (!undone) return;
    cycleApplied.current = false;
    queryClient.invalidateQueries({ queryKey: ["cycle-summary"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const currentTopic = resolveCurrentTopic(cycleTopics);

  useEffect(() => {
    if (!cycleSummary?.status) return;
    configureTqr({
      disciplineId: currentDisciplineId,
      mandatoryReview: cycleSummary.status.mandatoryReview,
      hasPreviousTopic: Boolean(cycleSummary.status.previousTopicName),
    });
  }, [
    configureTqr,
    currentDisciplineId,
    cycleSummary?.status.mandatoryReview,
    cycleSummary?.status.previousTopicName,
    cycleSummary?.cycle?.currentBlockNumber,
  ]);

  const handleFinishTqr = async () => {
    if (!cycleSummary?.cycle) return;
    const r = parseInt(resolved, 10) || 0;
    const c = parseInt(correct, 10) || 0;
    const result = await finishTqrSession({
      cycleId: cycleSummary.cycle.id,
      disciplineId: currentDisciplineId,
      topicId: currentTopic?.id ?? (topicId === "none" ? null : parseInt(topicId, 10)),
      resolved: r,
      correct: Math.min(c, r),
    });
    if (r > 0) {
      const logged = await recordQuestions(r, Math.min(c, r), currentDisciplineId, false, {
        topicId: currentTopic?.id ?? (topicId === "none" ? null : parseInt(topicId, 10)),
        phase: "QUESTIONS",
      });
      pushEvents(logged.events);
    }
    setGateMessage(
      result.passed
        ? `Acerto ${result.percent}% — tópico concluído. ${result.unlockedSlug ? `Nova matéria liberada: ${result.unlockedSlug}` : ""}`
        : `Acerto ${result.percent}% (mínimo ${TQR_ACCURACY_GATE}%). Próxima sessão desta matéria: 30 min de reestudo dos erros.`,
    );
    tqrReset();
    cycleApplied.current = false;
    queryClient.invalidateQueries();
  };

  const handleSimulado = async () => {
    const result = await recordQuestions(1, 0, activeDisciplineId, true);
    pushEvents(result.events);
    queryClient.invalidateQueries();
  };

  const pomoProgress =
    phaseTotalSec > 0 ? ((phaseTotalSec - remainingSec) / phaseTotalSec) * 100 : 0;
  const tqrProgress = tqrTotal > 0 ? ((tqrTotal - tqrRemaining) / tqrTotal) * 100 : 0;

  const tqrPhaseBadge = (p: TqrPhase) => {
    switch (p) {
      case "current_review":
        return "secondary" as const;
      case "error_review":
        return "destructive" as const;
      case "theory":
        return "default" as const;
      case "questions":
        return "outline" as const;
      default: {
        const _never: never = p;
        return _never;
      }
    }
  };

  const phaseBadgeVariant = (p: PomodoroPhase) => {
    switch (p) {
      case "focus":
        return "default" as const;
      case "short_break":
        return "secondary" as const;
      case "long_break":
        return "outline" as const;
      default: {
        const _never: never = p;
        return _never;
      }
    }
  };

  return (
    <div className="space-y-6 p-8">
      <div>
        <p className="text-sm uppercase tracking-widest text-muted-foreground">Sessão de Estudo</p>
        <h1 className="text-3xl font-bold">Timer de Operação</h1>
      </div>

      {cycleSummary?.cycle && cycleSummary.status && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <RefreshCw className="h-4 w-4 text-primary" />
              Bloco do ciclo {cycleSummary.cycle.currentBlockNumber}/
              {cycleSummary.status.totalBlocks}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="font-medium">{cycleSummary.status.nextSubject}</p>
              <p className="text-sm text-muted-foreground">{cycleSummary.status.nextItem}</p>
              {cycleSummary.status.thematicFocus && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Foco: {cycleSummary.status.thematicFocus}
                </p>
              )}
              {cycleSummary.status.mandatoryReview && (
                <Badge variant="destructive" className="mt-2">
                  Revisão obrigatória — 30 min nos erros
                </Badge>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Retomar de: {cycleSummary.status.whereStopped}
              </p>
            </div>
            {currentDisciplineId && (
              <CycleBookmarkPanel
                compact
                disciplines={disciplines}
                selectedDisciplineId={currentDisciplineId}
                onSave={async (id, data) => {
                  await updateDisciplineCycleSettings(id, data);
                  queryClient.invalidateQueries({ queryKey: ["cycle-summary"] });
                  queryClient.invalidateQueries({ queryKey: ["disciplines"] });
                  queryClient.invalidateQueries({ queryKey: ["discipline-cycle-rows"] });
                }}
              />
            )}
            {gateMessage && <p className="text-sm text-primary">{gateMessage}</p>}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={handleAdvanceBlock}>
                <SkipForward className="mr-1 h-3.5 w-3.5" />
                Concluir sessão e avançar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleUndoSession}
                disabled={(cycleSummary.completions?.length ?? 0) === 0}
              >
                <Undo2 className="mr-1 h-3.5 w-3.5" />
                Desfazer
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link to="/cycles">Ver ciclo</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs
        value={timerMode}
        onValueChange={(v) => {
          if (anyRunning) return;
          setTimerMode(v as TimerMode);
        }}
      >
        <TabsList>
          <TabsTrigger value="tqr" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            TQR
          </TabsTrigger>
          <TabsTrigger value="free" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Cronômetro livre
          </TabsTrigger>
          <TabsTrigger value="pomodoro" className="gap-2">
            <Timer className="h-4 w-4" />
            Pomodoro
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tqr" className="mt-4">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 text-primary" />
                  Sessão TQR
                </span>
                <Badge variant={tqrPhaseBadge(tqrPhase)}>{TQR_PHASE_LABELS[tqrPhase]}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {cycleSummary?.status.previousTopicName && tqrPhase === "current_review" && (
                <p className="text-sm text-muted-foreground">
                  Revisão corrente: reler marcações de {cycleSummary.status.previousTopicName} (5–10 min).
                </p>
              )}
              {cycleSummary?.status.studyHint && (
                <p className="text-sm text-muted-foreground">{cycleSummary.status.studyHint}</p>
              )}

              <div className="text-center">
                <p className="font-mono text-6xl font-bold tracking-wider text-primary">
                  {formatDuration(tqrRemaining)}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {tqrDone
                    ? "Sessão pronta para registrar questões"
                    : tqrRunning
                      ? "Em andamento"
                      : "Pausado"}
                </p>
                <Progress value={tqrProgress} className="mt-4 h-2" />
              </div>

              <div className="flex flex-wrap justify-center gap-2">
                {!tqrRunning && !tqrDone ? (
                  <>
                    <Button size="lg" onClick={tqrStart} disabled={!cycleSummary?.cycle}>
                      <Play className="mr-2 h-4 w-4" /> Iniciar
                    </Button>
                    <Button size="lg" variant="outline" onClick={tqrReset}>
                      <RotateCcw className="mr-2 h-4 w-4" /> Reset
                    </Button>
                    <Button
                      size="lg"
                      variant="secondary"
                      onClick={async () => {
                        await tqrSkip();
                        queryClient.invalidateQueries();
                      }}
                    >
                      <SkipForward className="mr-2 h-4 w-4" /> Pular fase
                    </Button>
                    {tqrRemaining > 0 && tqrRemaining < tqrTotal && (
                      <Button size="lg" variant="ghost" onClick={tqrResume}>
                        <Play className="mr-2 h-4 w-4" /> Retomar
                      </Button>
                    )}
                  </>
                ) : tqrRunning ? (
                  <Button size="lg" variant="secondary" onClick={tqrPause}>
                    <Pause className="mr-2 h-4 w-4" /> Pausar
                  </Button>
                ) : null}
              </div>

              {(tqrDone || tqrPhase === "questions") && (
                <div className="space-y-3 rounded-lg border border-primary/20 p-4">
                  <p className="text-sm font-medium">
                    Questões de fixação {currentTopic ? `— ${currentTopic.name}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Meta: 20–30 questões. Avança o tópico com {TQR_ACCURACY_GATE}% ou mais.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Resolvidas</Label>
                      <Input
                        type="number"
                        min={0}
                        value={resolved}
                        onChange={(e) => setResolved(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Corretas</Label>
                      <Input
                        type="number"
                        min={0}
                        value={correct}
                        onChange={(e) => setCorrect(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button className="w-full" onClick={handleFinishTqr}>
                    Registrar e concluir sessão
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="free" className="mt-4">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Cronômetro
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <p className="font-mono text-6xl font-bold tracking-wider text-primary">
                  {formatDuration(elapsedSec)}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {session ? (freeRunning ? "Em andamento" : "Pausado") : "Pronto para iniciar"}
                </p>
              </div>

              <DisciplineSelect
                value={freeDisciplineId}
                onChange={setFreeDiscipline}
                disciplinesByArea={disciplinesByArea}
                unassigned={unassigned}
                disabled={!!session}
              />

              <div className="flex justify-center gap-3">
                {!session ? (
                  <Button size="lg" onClick={() => start(freeDisciplineId)}>
                    <Play className="mr-2 h-4 w-4" /> Iniciar
                  </Button>
                ) : (
                  <>
                    {freeRunning ? (
                      <Button size="lg" variant="secondary" onClick={pause}>
                        <Pause className="mr-2 h-4 w-4" /> Pausar
                      </Button>
                    ) : (
                      <Button size="lg" onClick={resume}>
                        <Play className="mr-2 h-4 w-4" /> Retomar
                      </Button>
                    )}
                    <Button
                      size="lg"
                      variant="destructive"
                      onClick={async () => {
                        await stop();
                        queryClient.invalidateQueries();
                      }}
                    >
                      <Square className="mr-2 h-4 w-4" /> Finalizar
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pomodoro" className="mt-4">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <Timer className="h-5 w-5 text-primary" />
                  Pomodoro
                </span>
                <Badge variant={phaseBadgeVariant(phase)}>
                  {POMODORO_PHASE_LABELS[phase]}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap gap-2">
                {(Object.keys(POMODORO_PHASE_SECONDS) as PomodoroPhase[]).map((p) => (
                  <Button
                    key={p}
                    size="sm"
                    variant={phase === p ? "default" : "outline"}
                    disabled={pomoRunning}
                    onClick={() => setPhase(p)}
                  >
                    {POMODORO_PHASE_LABELS[p]} ({Math.floor(POMODORO_PHASE_SECONDS[p] / 60)} min)
                  </Button>
                ))}
              </div>

              <div className="text-center">
                <p
                  className={cn(
                    "font-mono text-6xl font-bold tracking-wider",
                    phase === "focus" ? "text-primary" : "text-emerald-400",
                  )}
                >
                  {formatDuration(remainingSec)}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {pomoRunning ? "Em andamento" : remainingSec === 0 ? "Ciclo finalizado" : "Pausado"}
                </p>
                <Progress value={pomoProgress} className="mt-4 h-2" />
              </div>

              <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline">{completedFocusCount} pomodoros hoje</Badge>
                {phase === "focus" && (
                  <Badge variant="outline">+{POMODORO_BONUS_XP} XP bônus ao completar foco</Badge>
                )}
              </div>

              <DisciplineSelect
                value={pomoDisciplineId}
                onChange={setPomoDiscipline}
                disciplinesByArea={disciplinesByArea}
                unassigned={unassigned}
                disabled={pomoRunning}
              />

              <div className="flex flex-wrap justify-center gap-2">
                {!pomoRunning ? (
                  <>
                    <Button size="lg" onClick={pomoStart}>
                      <Play className="mr-2 h-4 w-4" />
                      {remainingSec === 0 && phase !== "focus" ? "Próximo foco" : "Iniciar"}
                    </Button>
                    <Button size="lg" variant="outline" onClick={pomoReset}>
                      <RotateCcw className="mr-2 h-4 w-4" /> Reset
                    </Button>
                    <Button
                      size="lg"
                      variant="secondary"
                      onClick={async () => {
                        await pomoSkip();
                        queryClient.invalidateQueries();
                      }}
                    >
                      <SkipForward className="mr-2 h-4 w-4" /> Pular
                    </Button>
                    {remainingSec > 0 && remainingSec < phaseTotalSec && (
                      <Button size="lg" variant="ghost" onClick={pomoResume}>
                        <Play className="mr-2 h-4 w-4" /> Retomar
                      </Button>
                    )}
                  </>
                ) : (
                  <Button size="lg" variant="secondary" onClick={pomoPause}>
                    <Pause className="mr-2 h-4 w-4" /> Pausar
                  </Button>
                )}
              </div>

              <p className="text-center text-xs text-muted-foreground">
                A cada 4 focos, pausa longa automática. Foco completo = minutos de estudo + XP bônus.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Registrar Questões
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {cycleSummary?.status.currentBlock?.disciplineId && (
            <p className="text-xs text-muted-foreground">
              Fase sugerida:{" "}
              {disciplines.find((d) => d.id === cycleSummary.status.currentBlock?.disciplineId)
                ?.studyPhase
                ? STUDY_PHASE_LABELS[
                    disciplines.find(
                      (d) => d.id === cycleSummary.status.currentBlock?.disciplineId,
                    )!.studyPhase
                  ]
                : "—"}
            </p>
          )}
          {cycleTopics.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tópico (opcional)</Label>
                <Select value={topicId} onValueChange={setTopicId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {cycleTopics.map((t) => (
                      <SelectItem key={t.id} value={t.id.toString()}>
                        {t.lessonCode.padStart(2, "0")} — {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Segmento</Label>
                <Select value={segment} onValueChange={setSegment}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SEGMENT_LABELS.map((label, i) => (
                      <SelectItem key={label} value={String(i + 1)}>
                        Segmento {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Resolvidas</Label>
              <Input type="number" min={0} value={resolved} onChange={(e) => setResolved(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Corretas</Label>
              <Input type="number" min={0} value={correct} onChange={(e) => setCorrect(e.target.value)} />
            </div>
          </div>
          <Button className="w-full" onClick={handleQuestions}>
            Registrar (+3/resolvida, +5/correta)
          </Button>
          <Button className="w-full" variant="outline" onClick={handleSimulado}>
            Simulado Concluído (+50 XP)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
