import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Layers, Plus, Pencil, Trash2, Zap, BookOpen, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  createLifeArea,
  deleteLifeArea,
  getDisciplinesByLifeArea,
  getLifeAreasWithStats,
  updateLifeArea,
} from "@/lib/db/repositories/lifeAreas";
import { updateDisciplineLifeArea } from "@/lib/db/repositories/disciplines";
import { getDisciplines } from "@/lib/db/repositories/disciplines";
import {
  getLifeAreaIcon,
  LIFE_AREA_COLORS,
  LIFE_AREA_ICONS,
} from "@/lib/life-area-icons";
import { formatMinutes } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function LifeAreas() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#6366f1");
  const [icon, setIcon] = useState("layers");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: areas = [], isLoading } = useQuery({
    queryKey: ["life-areas"],
    queryFn: getLifeAreasWithStats,
  });

  const { data: allDisciplines = [] } = useQuery({
    queryKey: ["disciplines"],
    queryFn: getDisciplines,
  });

  const { data: expandedDisciplines = [] } = useQuery({
    queryKey: ["life-area-disciplines", expandedId],
    queryFn: () => (expandedId ? getDisciplinesByLifeArea(expandedId) : Promise.resolve([])),
    enabled: expandedId !== null,
  });

  const resetForm = () => {
    setName("");
    setDescription("");
    setColor("#6366f1");
    setIcon("layers");
    setEditingId(null);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setError(null);
    try {
      if (editingId) {
        await updateLifeArea(editingId, { name, description, color, icon });
      } else {
        await createLifeArea({ name, description, color, icon });
      }
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["life-areas"] });
    } catch {
      setError("Não foi possível salvar. Verifique se o nome já existe.");
    }
  };

  const startEdit = (area: (typeof areas)[0]) => {
    setEditingId(area.id);
    setName(area.name);
    setDescription(area.description ?? "");
    setColor(area.color);
    setIcon(area.icon);
    setExpandedId(area.id);
    setError(null);
  };

  const handleDelete = async (id: number) => {
    setError(null);
    const result = await deleteLifeArea(id);
    if (!result.ok) {
      setError(result.reason ?? "Não foi possível excluir.");
      return;
    }
    if (expandedId === id) setExpandedId(null);
    queryClient.invalidateQueries({ queryKey: ["life-areas"] });
  };

  const handleMoveDiscipline = async (disciplineId: number, lifeAreaId: number) => {
    await updateDisciplineLifeArea(disciplineId, lifeAreaId);
    queryClient.invalidateQueries({ queryKey: ["life-areas"] });
    queryClient.invalidateQueries({ queryKey: ["disciplines"] });
    queryClient.invalidateQueries({ queryKey: ["life-area-disciplines", expandedId] });
  };

  const unassignedDisciplines = allDisciplines.filter((d) => !d.lifeAreaId);

  return (
    <div className="space-y-6 p-8">
      <div>
        <p className="text-sm uppercase tracking-widest text-muted-foreground">Organização</p>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Layers className="h-8 w-8 text-primary" />
          Áreas da Vida
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Agrupe disciplinas e atividades por contexto — concurso, programação, saúde e mais.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{editingId ? "Editar área" : "Nova área"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Programação"
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Estudos de desenvolvimento..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Ícone</Label>
            <div className="flex flex-wrap gap-2">
              {LIFE_AREA_ICONS.map(({ id, label, Icon }) => (
                <Button
                  key={id}
                  type="button"
                  size="sm"
                  variant={icon === id ? "default" : "outline"}
                  onClick={() => setIcon(id)}
                  title={label}
                >
                  <Icon className="h-4 w-4" />
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="flex flex-wrap gap-2">
              {LIFE_AREA_COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  title={c.label}
                  className={cn(
                    "h-8 w-8 rounded-full border-2 transition-transform hover:scale-110",
                    color === c.id ? "border-foreground scale-110" : "border-transparent",
                  )}
                  style={{ backgroundColor: c.id }}
                  onClick={() => setColor(c.id)}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSubmit}>
              <Plus className="mr-2 h-4 w-4" />
              {editingId ? "Salvar" : "Adicionar"}
            </Button>
            {editingId && (
              <Button variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando áreas...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {areas.map((area) => {
            const Icon = getLifeAreaIcon(area.icon);
            const isExpanded = expandedId === area.id;

            return (
              <Card
                key={area.id}
                className={cn(
                  "overflow-hidden transition-colors",
                  !area.isActive && "opacity-70",
                  isExpanded && "ring-2 ring-primary/40",
                )}
                style={{ borderTopColor: area.color, borderTopWidth: 3 }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-lg"
                        style={{ backgroundColor: `${area.color}22` }}
                      >
                        <Icon className="h-5 w-5" style={{ color: area.color }} />
                      </div>
                      <div>
                        <CardTitle className="text-base">{area.name}</CardTitle>
                        {area.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {area.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button variant="ghost" size="icon" onClick={() => startEdit(area)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(area.id)}>
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-md bg-muted/50 p-2">
                      <BookOpen className="mx-auto h-4 w-4 text-muted-foreground" />
                      <p className="mt-1 text-lg font-semibold">{area.disciplineCount}</p>
                      <p className="text-[10px] uppercase text-muted-foreground">Disciplinas</p>
                    </div>
                    <div className="rounded-md bg-muted/50 p-2">
                      <Zap className="mx-auto h-4 w-4 text-muted-foreground" />
                      <p className="mt-1 text-lg font-semibold">{area.totalXp}</p>
                      <p className="text-[10px] uppercase text-muted-foreground">XP total</p>
                    </div>
                    <div className="rounded-md bg-muted/50 p-2">
                      <Clock className="mx-auto h-4 w-4 text-muted-foreground" />
                      <p className="mt-1 text-lg font-semibold">{formatMinutes(area.weeklyStudyMinutes)}</p>
                      <p className="text-[10px] uppercase text-muted-foreground">Esta semana</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={area.isActive}
                        onCheckedChange={async (v) => {
                          await updateLifeArea(area.id, { isActive: v });
                          queryClient.invalidateQueries({ queryKey: ["life-areas"] });
                        }}
                      />
                      <Label className="text-xs">Ativa</Label>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedId(isExpanded ? null : area.id)}
                    >
                      {isExpanded ? "Ocultar" : "Disciplinas"}
                    </Button>
                  </div>

                  {isExpanded && (
                    <div className="space-y-2 border-t pt-3">
                      {expandedDisciplines.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Nenhuma disciplina nesta área.</p>
                      ) : (
                        expandedDisciplines.map((d) => (
                          <div
                            key={d.id}
                            className="flex items-center justify-between rounded-md bg-muted/30 px-2 py-1.5 text-sm"
                          >
                            <span>{d.name}</span>
                            <Badge variant="outline" className="text-xs">
                              Nv. {d.level}
                            </Badge>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {unassignedDisciplines.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Disciplinas sem área</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {unassignedDisciplines.map((d) => (
              <div key={d.id} className="flex flex-wrap items-center gap-2">
                <span className="text-sm">{d.name}</span>
                <div className="flex flex-wrap gap-1">
                  {areas.filter((a) => a.isActive).map((a) => (
                    <Button
                      key={a.id}
                      size="sm"
                      variant="outline"
                      onClick={() => handleMoveDiscipline(d.id, a.id)}
                    >
                      → {a.name}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
