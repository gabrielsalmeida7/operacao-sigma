import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Swords, Plus, Trash2, Pencil, CheckCircle2, Circle, PlayCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createQuest,
  deleteQuest,
  getQuestCounts,
  getQuests,
  setQuestStatus,
  updateQuest,
  type QuestFilter,
} from "@/lib/db/repositories/quests";
import { getActiveLifeAreas } from "@/lib/db/repositories/lifeAreas";
import { getActiveProjects, syncProjectStatus } from "@/lib/db/repositories/projects";
import { getDisciplines } from "@/lib/db/repositories/disciplines";
import { completeQuest } from "@/lib/gamification/engine";
import { QUEST_DEFAULT_XP } from "@/lib/gamification/constants";
import type { QuestPriority, QuestStatus, QuestWithDetails } from "@/lib/db/types";
import { useCelebrationStore } from "@/stores/celebrationStore";
import { formatDateBR } from "@/lib/dates";
import { cn } from "@/lib/utils";

const PRIORITY_LABELS: Record<QuestPriority, string> = {
  HIGH: "Alta",
  MEDIUM: "Média",
  LOW: "Baixa",
};

const STATUS_LABELS: Record<QuestStatus, string> = {
  NOT_STARTED: "Não iniciada",
  IN_PROGRESS: "Em progresso",
  DONE: "Concluída",
};

function priorityVariant(priority: QuestPriority): "destructive" | "default" | "secondary" {
  switch (priority) {
    case "HIGH":
      return "destructive";
    case "MEDIUM":
      return "default";
    case "LOW":
      return "secondary";
    default: {
      const _never: never = priority;
      return _never;
    }
  }
}

export function Quests() {
  const queryClient = useQueryClient();
  const pushEvents = useCelebrationStore((s) => s.pushEvents);
  const [filter, setFilter] = useState<QuestFilter>("all");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [lifeAreaId, setLifeAreaId] = useState("");
  const [disciplineId, setDisciplineId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [priority, setPriority] = useState<QuestPriority>("MEDIUM");
  const [xpReward, setXpReward] = useState(String(QUEST_DEFAULT_XP.MEDIUM));
  const [dueDate, setDueDate] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!editingId) {
      setXpReward(String(QUEST_DEFAULT_XP[priority]));
    }
  }, [priority, editingId]);

  const { data: quests = [], isLoading } = useQuery({
    queryKey: ["quests", filter],
    queryFn: () => getQuests(filter),
  });

  const { data: counts } = useQuery({
    queryKey: ["quest-counts"],
    queryFn: getQuestCounts,
  });

  const { data: lifeAreas = [] } = useQuery({
    queryKey: ["life-areas-active"],
    queryFn: getActiveLifeAreas,
  });

  const { data: disciplines = [] } = useQuery({
    queryKey: ["disciplines"],
    queryFn: getDisciplines,
  });

  const { data: activeProjects = [] } = useQuery({
    queryKey: ["projects-active"],
    queryFn: getActiveProjects,
  });

  const filteredDisciplines = lifeAreaId
    ? disciplines.filter((d) => d.lifeAreaId === parseInt(lifeAreaId, 10))
    : disciplines;

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setLifeAreaId("");
    setDisciplineId("");
    setProjectId("");
    setPriority("MEDIUM");
    setXpReward(String(QUEST_DEFAULT_XP.MEDIUM));
    setDueDate("");
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;
    const xp = parseInt(xpReward, 10) || QUEST_DEFAULT_XP[priority];
    const areaId = lifeAreaId ? parseInt(lifeAreaId, 10) : null;
    const discId = disciplineId ? parseInt(disciplineId, 10) : null;
    const projId = projectId ? parseInt(projectId, 10) : null;

    if (editingId) {
      await updateQuest(editingId, {
        title,
        description,
        lifeAreaId: areaId,
        disciplineId: discId,
        projectId: projId,
        priority,
        xpReward: xp,
        dueDate: dueDate || null,
      });
    } else {
      await createQuest({
        title,
        description,
        lifeAreaId: areaId,
        disciplineId: discId,
        projectId: projId,
        priority,
        xpReward: xp,
        dueDate: dueDate || null,
      });
    }

    if (projId) await syncProjectStatus(projId);

    resetForm();
    queryClient.invalidateQueries({ queryKey: ["quests"] });
    queryClient.invalidateQueries({ queryKey: ["quest-counts"] });
    queryClient.invalidateQueries({ queryKey: ["projects"] });
  };

  const startEdit = (quest: QuestWithDetails) => {
    setEditingId(quest.id);
    setTitle(quest.title);
    setDescription(quest.description ?? "");
    setLifeAreaId(quest.lifeAreaId?.toString() ?? "");
    setDisciplineId(quest.disciplineId?.toString() ?? "");
    setProjectId(quest.projectId?.toString() ?? "");
    setPriority(quest.priority);
    setXpReward(String(quest.xpReward));
    setDueDate(quest.dueDate ?? "");
    setShowForm(true);
  };

  const handleComplete = async (id: number) => {
    const result = await completeQuest(id);
    pushEvents(result.events);
    queryClient.invalidateQueries();
  };

  const handleDelete = async (id: number) => {
    await deleteQuest(id);
    queryClient.invalidateQueries({ queryKey: ["quests"] });
    queryClient.invalidateQueries({ queryKey: ["quest-counts"] });
  };

  const handleStatusChange = async (id: number, status: QuestStatus) => {
    await setQuestStatus(id, status);
    queryClient.invalidateQueries({ queryKey: ["quests"] });
    queryClient.invalidateQueries({ queryKey: ["quest-counts"] });
  };

  const tabItems: { value: QuestFilter; label: string }[] = [
    { value: "all", label: "Abertas" },
    { value: "today", label: "Hoje" },
    { value: "overdue", label: "Atrasadas" },
    { value: "in_progress", label: "Em progresso" },
    { value: "done", label: "Concluídas" },
  ];

  return (
    <div className="space-y-6 p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-widest text-muted-foreground">Quest-Center</p>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Swords className="h-8 w-8 text-primary" />
            Quests
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Tarefas que você define — complete para ganhar XP.
          </p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Quest
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{editingId ? "Editar quest" : "Nova quest"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label>Título</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Resolver 5 exercícios LeetCode"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Descrição (opcional)</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalhes da tarefa..."
                />
              </div>
              <div className="space-y-2">
                <Label>Área</Label>
                <Select
                  value={lifeAreaId || "none"}
                  onValueChange={(v) => {
                    setLifeAreaId(v === "none" ? "" : v);
                    setDisciplineId("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Qualquer área" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Qualquer área</SelectItem>
                    {lifeAreas.map((a) => (
                      <SelectItem key={a.id} value={a.id.toString()}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Disciplina (opcional)</Label>
                <Select
                  value={disciplineId || "none"}
                  onValueChange={(v) => setDisciplineId(v === "none" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Nenhuma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    {filteredDisciplines.map((d) => (
                      <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Projeto (opcional)</Label>
                <Select
                  value={projectId || "none"}
                  onValueChange={(v) => setProjectId(v === "none" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Nenhum" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {activeProjects.map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>{p.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as QuestPriority)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HIGH">Alta (+{QUEST_DEFAULT_XP.HIGH} XP)</SelectItem>
                    <SelectItem value="MEDIUM">Média (+{QUEST_DEFAULT_XP.MEDIUM} XP)</SelectItem>
                    <SelectItem value="LOW">Baixa (+{QUEST_DEFAULT_XP.LOW} XP)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>XP ao completar</Label>
                <Input
                  type="number"
                  min={1}
                  value={xpReward}
                  onChange={(e) => setXpReward(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Prazo (opcional)</Label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSubmit}>
                {editingId ? "Salvar" : "Criar quest"}
              </Button>
              <Button variant="outline" onClick={resetForm}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={filter} onValueChange={(v) => setFilter(v as QuestFilter)}>
        <TabsList className="flex h-auto flex-wrap gap-1">
          {tabItems.map(({ value, label }) => (
            <TabsTrigger key={value} value={value} className="gap-2">
              {label}
              {counts && (
                <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                  {counts[value]}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabItems.map(({ value }) => (
          <TabsContent key={value} value={value} className="mt-4">
            {isLoading ? (
              <p className="text-muted-foreground">Carregando quests...</p>
            ) : quests.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center text-muted-foreground">
                  Nenhuma quest nesta aba.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {quests.map((quest) => (
                  <QuestCard
                    key={quest.id}
                    quest={quest}
                    onComplete={handleComplete}
                    onDelete={handleDelete}
                    onEdit={startEdit}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

interface QuestCardProps {
  quest: QuestWithDetails;
  onComplete: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit: (quest: QuestWithDetails) => void;
  onStatusChange: (id: number, status: QuestStatus) => void;
}

function QuestCard({ quest, onComplete, onDelete, onEdit, onStatusChange }: QuestCardProps) {
  const isDone = quest.status === "DONE";

  return (
    <Card
      className={cn(
        "flex flex-col",
        isDone && "opacity-75",
        quest.isOverdue && !isDone && "border-destructive/40",
      )}
      style={quest.lifeAreaColor ? { borderTopColor: quest.lifeAreaColor, borderTopWidth: 3 } : undefined}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className={cn("text-base leading-snug", isDone && "line-through text-muted-foreground")}>
            {quest.title}
          </CardTitle>
          <div className="flex shrink-0 gap-1">
            {!isDone && (
              <Button variant="ghost" size="icon" onClick={() => onEdit(quest)}>
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={() => onDelete(quest.id)}>
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
        {quest.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{quest.description}</p>
        )}
      </CardHeader>
      <CardContent className="mt-auto space-y-3">
        <div className="flex flex-wrap gap-1.5">
          <Badge variant={priorityVariant(quest.priority)}>
            {PRIORITY_LABELS[quest.priority]}
          </Badge>
          <Badge variant="outline">+{quest.xpReward} XP</Badge>
          <Badge variant="secondary">{STATUS_LABELS[quest.status]}</Badge>
          {quest.lifeAreaName && (
            <Badge variant="outline" className="text-xs">{quest.lifeAreaName}</Badge>
          )}
          {quest.disciplineName && (
            <Badge variant="outline" className="text-xs">{quest.disciplineName}</Badge>
          )}
          {quest.projectTitle && (
            <Badge variant="outline" className="text-xs border-primary/30 text-primary">
              {quest.projectTitle}
            </Badge>
          )}
        </div>

        {quest.dueDate && (
          <p className={cn("text-xs", quest.isOverdue && !isDone ? "text-destructive font-medium" : "text-muted-foreground")}>
            {quest.isOverdue && !isDone ? "Atrasada — " : "Prazo: "}
            {formatDateBR(quest.dueDate)}
          </p>
        )}

        {isDone && quest.completedAt && (
          <p className="text-xs text-primary">
            Concluída em {formatDateBR(quest.completedAt)}
          </p>
        )}

        {!isDone && (
          <div className="flex flex-wrap gap-2">
            {quest.status === "NOT_STARTED" && (
              <Button size="sm" variant="outline" onClick={() => onStatusChange(quest.id, "IN_PROGRESS")}>
                <PlayCircle className="mr-1 h-3.5 w-3.5" />
                Iniciar
              </Button>
            )}
            <Button size="sm" onClick={() => onComplete(quest.id)}>
              <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
              Completar
            </Button>
          </div>
        )}

        {isDone && (
          <div className="flex items-center gap-2 text-sm text-primary">
            <Circle className="h-4 w-4 fill-primary" />
            Quest concluída
          </div>
        )}
      </CardContent>
    </Card>
  );
}
