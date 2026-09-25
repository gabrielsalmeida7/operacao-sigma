import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Repeat, Plus, Trash2, Pencil, Flame, Check, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HabitHeatMap } from "@/components/habits/HabitHeatMap";
import {
  createHabit,
  deleteHabit,
  getHabits,
  updateHabit,
} from "@/lib/db/repositories/habits";
import { getActiveLifeAreas } from "@/lib/db/repositories/lifeAreas";
import { toggleHabitToday } from "@/lib/gamification/engine";
import { HABIT_DEFAULT_XP } from "@/lib/gamification/constants";
import type { HabitWithStats } from "@/lib/db/types";
import { useCelebrationStore } from "@/stores/celebrationStore";
import { cn } from "@/lib/utils";

export function Habits() {
  const queryClient = useQueryClient();
  const pushEvents = useCelebrationStore((s) => s.pushEvents);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [lifeAreaId, setLifeAreaId] = useState("");
  const [xpReward, setXpReward] = useState(String(HABIT_DEFAULT_XP));
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data: habits = [], isLoading } = useQuery({
    queryKey: ["habits"],
    queryFn: () => getHabits(false),
  });

  const { data: lifeAreas = [] } = useQuery({
    queryKey: ["life-areas-active"],
    queryFn: getActiveLifeAreas,
  });

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setLifeAreaId("");
    setXpReward(String(HABIT_DEFAULT_XP));
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;
    const xp = parseInt(xpReward, 10) || HABIT_DEFAULT_XP;
    const areaId = lifeAreaId ? parseInt(lifeAreaId, 10) : null;

    if (editingId) {
      await updateHabit(editingId, { title, description, lifeAreaId: areaId, xpReward: xp });
    } else {
      await createHabit({ title, description, lifeAreaId: areaId, xpReward: xp });
    }

    resetForm();
    queryClient.invalidateQueries({ queryKey: ["habits"] });
  };

  const startEdit = (habit: HabitWithStats) => {
    setEditingId(habit.id);
    setTitle(habit.title);
    setDescription(habit.description ?? "");
    setLifeAreaId(habit.lifeAreaId?.toString() ?? "");
    setXpReward(String(habit.xpReward));
    setShowForm(true);
  };

  const handleToggle = async (habitId: number) => {
    const result = await toggleHabitToday(habitId);
    if (result.completed) {
      pushEvents(result.events);
    }
    queryClient.invalidateQueries({ queryKey: ["habits"] });
    queryClient.invalidateQueries();
  };

  const handleDelete = async (id: number) => {
    await deleteHabit(id);
    queryClient.invalidateQueries({ queryKey: ["habits"] });
  };

  const completedTodayCount = habits.filter((h) => h.completedToday).length;

  return (
    <div className="space-y-6 p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-widest text-muted-foreground">Habit Tracker</p>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Repeat className="h-8 w-8 text-primary" />
            Hábitos
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Rotinas diárias com streak, heat map e XP ao marcar como feito hoje.
          </p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Hábito
        </Button>
      </div>

      {habits.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex flex-wrap items-center gap-6 pt-6">
            <div>
              <p className="text-2xl font-bold">{completedTodayCount}/{habits.length}</p>
              <p className="text-xs text-muted-foreground">hábitos feitos hoje</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Flame className="h-4 w-4 text-orange-400" />
              Marque hoje para manter seus streaks
            </div>
          </CardContent>
        </Card>
      )}

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{editingId ? "Editar hábito" : "Novo hábito"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label>Título</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="1h de código, Leitura 30 min, Academia..."
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Descrição (opcional)</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalhes do hábito..."
                />
              </div>
              <div className="space-y-2">
                <Label>Área</Label>
                <Select
                  value={lifeAreaId || "none"}
                  onValueChange={(v) => setLifeAreaId(v === "none" ? "" : v)}
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
                <Label>XP ao completar hoje</Label>
                <Input
                  type="number"
                  min={1}
                  value={xpReward}
                  onChange={(e) => setXpReward(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSubmit}>{editingId ? "Salvar" : "Criar hábito"}</Button>
              <Button variant="outline" onClick={resetForm}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <p className="text-muted-foreground">Carregando hábitos...</p>
      ) : habits.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhum hábito cadastrado. Crie rotinas como estudo de programação, exercícios ou leitura.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {habits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              onToggle={handleToggle}
              onEdit={startEdit}
              onDelete={handleDelete}
              onActiveChange={async (active) => {
                await updateHabit(habit.id, { isActive: active });
                queryClient.invalidateQueries({ queryKey: ["habits"] });
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface HabitCardProps {
  habit: HabitWithStats;
  onToggle: (id: number) => void;
  onEdit: (habit: HabitWithStats) => void;
  onDelete: (id: number) => void;
  onActiveChange: (active: boolean) => void;
}

function HabitCard({ habit, onToggle, onEdit, onDelete, onActiveChange }: HabitCardProps) {
  const accent = habit.lifeAreaColor ?? "#22c55e";

  return (
    <Card
      className={cn(habit.completedToday && "border-primary/40 bg-primary/5")}
      style={{ borderTopColor: accent, borderTopWidth: 3 }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base">{habit.title}</CardTitle>
            {habit.description && (
              <p className="mt-1 text-xs text-muted-foreground">{habit.description}</p>
            )}
          </div>
          <div className="flex shrink-0 gap-1">
            <Button variant="ghost" size="icon" onClick={() => onEdit(habit)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(habit.id)}>
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="gap-1">
            <Flame className="h-3 w-3 text-orange-400" />
            {habit.currentStreak} dias
          </Badge>
          <Badge variant="secondary">Recorde: {habit.bestStreak}</Badge>
          <Badge variant="outline" className="gap-1">
            <Zap className="h-3 w-3" />
            +{habit.xpReward} XP
          </Badge>
          {habit.lifeAreaName && (
            <Badge variant="outline">{habit.lifeAreaName}</Badge>
          )}
          <Badge variant="secondary">{habit.completionsThisWeek}x esta semana</Badge>
        </div>

        <HabitHeatMap days={habit.heatMap} accentColor={accent} />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            variant={habit.completedToday ? "secondary" : "default"}
            onClick={() => onToggle(habit.id)}
          >
            <Check className="mr-2 h-4 w-4" />
            {habit.completedToday ? "Feito hoje — desfazer" : "Marcar como feito hoje"}
          </Button>
          <div className="flex items-center gap-2">
            <Switch checked={habit.isActive} onCheckedChange={onActiveChange} />
            <Label className="text-xs">Ativo</Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
