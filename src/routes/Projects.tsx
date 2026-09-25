import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Flag,
  Plus,
  Trash2,
  Pencil,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
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
import {
  createProject,
  createQuestForProject,
  deleteProject,
  getProjectCounts,
  getProjectQuests,
  getProjects,
  updateProject,
  type ProjectFilter,
} from "@/lib/db/repositories/projects";
import { getActiveLifeAreas } from "@/lib/db/repositories/lifeAreas";
import { getDisciplines } from "@/lib/db/repositories/disciplines";
import { completeProject, completeQuest } from "@/lib/gamification/engine";
import { PROJECT_DEFAULT_XP, QUEST_DEFAULT_XP } from "@/lib/gamification/constants";
import type { ProjectWithDetails, QuestPriority } from "@/lib/db/types";
import { useCelebrationStore } from "@/stores/celebrationStore";
import { formatDateBR } from "@/lib/dates";
import { cn } from "@/lib/utils";

const PRIORITY_LABELS: Record<QuestPriority, string> = {
  HIGH: "Alta",
  MEDIUM: "Média",
  LOW: "Baixa",
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

export function Projects() {
  const queryClient = useQueryClient();
  const pushEvents = useCelebrationStore((s) => s.pushEvents);
  const [filter, setFilter] = useState<ProjectFilter>("active");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [lifeAreaId, setLifeAreaId] = useState("");
  const [disciplineId, setDisciplineId] = useState("");
  const [priority, setPriority] = useState<QuestPriority>("MEDIUM");
  const [xpReward, setXpReward] = useState(String(PROJECT_DEFAULT_XP));
  const [dueDate, setDueDate] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [newQuestTitle, setNewQuestTitle] = useState("");

  useEffect(() => {
    if (!editingId) {
      setXpReward(String(PROJECT_DEFAULT_XP));
    }
  }, [priority, editingId]);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects", filter],
    queryFn: () => getProjects(filter),
  });

  const { data: counts } = useQuery({
    queryKey: ["project-counts"],
    queryFn: getProjectCounts,
  });

  const { data: lifeAreas = [] } = useQuery({
    queryKey: ["life-areas-active"],
    queryFn: getActiveLifeAreas,
  });

  const { data: disciplines = [] } = useQuery({
    queryKey: ["disciplines"],
    queryFn: getDisciplines,
  });

  const { data: expandedQuests = [] } = useQuery({
    queryKey: ["project-quests", expandedId],
    queryFn: () => (expandedId ? getProjectQuests(expandedId) : Promise.resolve([])),
    enabled: expandedId !== null,
  });

  const filteredDisciplines = lifeAreaId
    ? disciplines.filter((d) => d.lifeAreaId === parseInt(lifeAreaId, 10))
    : disciplines;

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setLifeAreaId("");
    setDisciplineId("");
    setPriority("MEDIUM");
    setXpReward(String(PROJECT_DEFAULT_XP));
    setDueDate("");
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;
    const xp = parseInt(xpReward, 10) || PROJECT_DEFAULT_XP;
    const areaId = lifeAreaId ? parseInt(lifeAreaId, 10) : null;
    const discId = disciplineId ? parseInt(disciplineId, 10) : null;

    if (editingId) {
      await updateProject(editingId, {
        title,
        description,
        lifeAreaId: areaId,
        disciplineId: discId,
        priority,
        xpReward: xp,
        dueDate: dueDate || null,
      });
    } else {
      await createProject({
        title,
        description,
        lifeAreaId: areaId,
        disciplineId: discId,
        priority,
        xpReward: xp,
        dueDate: dueDate || null,
      });
    }

    resetForm();
    queryClient.invalidateQueries({ queryKey: ["projects"] });
    queryClient.invalidateQueries({ queryKey: ["project-counts"] });
  };

  const startEdit = (project: ProjectWithDetails) => {
    setEditingId(project.id);
    setTitle(project.title);
    setDescription(project.description ?? "");
    setLifeAreaId(project.lifeAreaId?.toString() ?? "");
    setDisciplineId(project.disciplineId?.toString() ?? "");
    setPriority(project.priority);
    setXpReward(String(project.xpReward));
    setDueDate(project.dueDate ?? "");
    setShowForm(true);
    setExpandedId(project.id);
  };

  const handleDelete = async (id: number) => {
    await deleteProject(id);
    if (expandedId === id) setExpandedId(null);
    queryClient.invalidateQueries({ queryKey: ["projects"] });
    queryClient.invalidateQueries({ queryKey: ["project-counts"] });
    queryClient.invalidateQueries({ queryKey: ["quests"] });
  };

  const handleCompleteProject = async (id: number) => {
    const result = await completeProject(id);
    pushEvents(result.events);
    queryClient.invalidateQueries();
  };

  const handleCompleteQuest = async (questId: number) => {
    const result = await completeQuest(questId);
    pushEvents(result.events);
    queryClient.invalidateQueries();
  };

  const handleAddQuest = async (projectId: number) => {
    if (!newQuestTitle.trim()) return;
    await createQuestForProject(projectId, newQuestTitle.trim());
    setNewQuestTitle("");
    queryClient.invalidateQueries();
  };

  const tabItems: { value: ProjectFilter; label: string }[] = [
    { value: "active", label: "Ativos" },
    { value: "in_progress", label: "Em progresso" },
    { value: "overdue", label: "Atrasados" },
    { value: "done", label: "Concluídos" },
  ];

  return (
    <div className="space-y-6 p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-widest text-muted-foreground">Mission-Center</p>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Flag className="h-8 w-8 text-primary" />
            Projetos
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Metas maiores com subtarefas (quests) e progresso agregado.
          </p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Projeto
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{editingId ? "Editar projeto" : "Novo projeto"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label>Título</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Portfolio em React, Módulo de Algoritmos..."
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Descrição (opcional)</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Objetivo do projeto..."
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
                <Label>Prioridade</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as QuestPriority)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HIGH">Alta</SelectItem>
                    <SelectItem value="MEDIUM">Média</SelectItem>
                    <SelectItem value="LOW">Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>XP bônus ao concluir</Label>
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
                {editingId ? "Salvar" : "Criar projeto"}
              </Button>
              <Button variant="outline" onClick={resetForm}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={filter} onValueChange={(v) => setFilter(v as ProjectFilter)}>
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
              <p className="text-muted-foreground">Carregando projetos...</p>
            ) : projects.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center text-muted-foreground">
                  Nenhum projeto nesta aba.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {projects.map((project) => {
                  const isExpanded = expandedId === project.id;
                  const isDone = project.status === "DONE";
                  const { questStats } = project;

                  return (
                    <Card
                      key={project.id}
                      className={cn(
                        isDone && "opacity-75",
                        project.isOverdue && !isDone && "border-destructive/40",
                      )}
                      style={
                        project.lifeAreaColor
                          ? { borderTopColor: project.lifeAreaColor, borderTopWidth: 3 }
                          : undefined
                      }
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <CardTitle
                              className={cn(
                                "text-base",
                                isDone && "line-through text-muted-foreground",
                              )}
                            >
                              {project.title}
                            </CardTitle>
                            {project.description && (
                              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                                {project.description}
                              </p>
                            )}
                          </div>
                          <div className="flex shrink-0 gap-1">
                            {!isDone && (
                              <Button variant="ghost" size="icon" onClick={() => startEdit(project)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(project.id)}>
                              <Trash2 className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Progresso</span>
                            <span className="font-medium">
                              {questStats.completed}/{questStats.total} quests
                              {questStats.total > 0 && ` (${questStats.progressPercent}%)`}
                            </span>
                          </div>
                          <Progress value={questStats.progressPercent} />
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          <Badge variant={priorityVariant(project.priority)}>
                            {PRIORITY_LABELS[project.priority]}
                          </Badge>
                          <Badge variant="outline">+{project.xpReward} XP bônus</Badge>
                          {project.lifeAreaName && (
                            <Badge variant="outline">{project.lifeAreaName}</Badge>
                          )}
                          {project.dueDate && (
                            <Badge
                              variant={project.isOverdue && !isDone ? "destructive" : "secondary"}
                            >
                              {project.isOverdue && !isDone
                                ? "Atrasado"
                                : project.daysRemaining !== null
                                  ? `${project.daysRemaining} dias`
                                  : formatDateBR(project.dueDate)}
                            </Badge>
                          )}
                        </div>

                        {!isDone && (
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setExpandedId(isExpanded ? null : project.id)}
                            >
                              {isExpanded ? (
                                <ChevronUp className="mr-1 h-3.5 w-3.5" />
                              ) : (
                                <ChevronDown className="mr-1 h-3.5 w-3.5" />
                              )}
                              Quests ({questStats.total})
                            </Button>
                            <Button size="sm" onClick={() => handleCompleteProject(project.id)}>
                              <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                              Concluir projeto
                            </Button>
                          </div>
                        )}

                        {isDone && project.completedAt && (
                          <p className="text-xs text-primary">
                            Concluído em {formatDateBR(project.completedAt)}
                          </p>
                        )}

                        {isExpanded && !isDone && (
                          <div className="space-y-3 border-t pt-3">
                            {expandedQuests.length === 0 ? (
                              <p className="text-xs text-muted-foreground">
                                Nenhuma quest vinculada ainda.
                              </p>
                            ) : (
                              expandedQuests.map((q) => (
                                <div
                                  key={q.id}
                                  className="flex items-center justify-between gap-2 rounded-md bg-muted/30 px-2 py-1.5"
                                >
                                  <span
                                    className={cn(
                                      "text-sm truncate",
                                      q.status === "DONE" && "line-through text-muted-foreground",
                                    )}
                                  >
                                    {q.title}
                                  </span>
                                  {q.status !== "DONE" ? (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="shrink-0 h-7 text-xs"
                                      onClick={() => handleCompleteQuest(q.id)}
                                    >
                                      +{q.xpReward} XP
                                    </Button>
                                  ) : (
                                    <Badge variant="outline" className="text-[10px]">Feita</Badge>
                                  )}
                                </div>
                              ))
                            )}
                            <div className="flex gap-2">
                              <Input
                                placeholder="Nova quest neste projeto..."
                                value={newQuestTitle}
                                onChange={(e) => setNewQuestTitle(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleAddQuest(project.id);
                                }}
                                className="h-8 text-sm"
                              />
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleAddQuest(project.id)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                              Quests herdam área, disciplina e prazo do projeto (+{QUEST_DEFAULT_XP[project.priority]} XP padrão).
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
