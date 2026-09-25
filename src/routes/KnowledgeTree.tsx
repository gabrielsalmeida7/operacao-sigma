import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { GitBranch, Plus, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createDiscipline, deleteDiscipline, getDisciplinesWithProgress } from "@/lib/db/repositories/disciplines";
import { getActiveLifeAreas } from "@/lib/db/repositories/lifeAreas";
import { SkillTreeLoader } from "@/components/knowledge/SkillTreeView";

export function KnowledgeTree() {
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState("");
  const [lifeAreaId, setLifeAreaId] = useState<string>("");

  const { data: disciplines = [] } = useQuery({
    queryKey: ["disciplines-progress"],
    queryFn: getDisciplinesWithProgress,
  });

  const { data: lifeAreas = [] } = useQuery({
    queryKey: ["life-areas-active"],
    queryFn: getActiveLifeAreas,
  });

  const handleAdd = async () => {
    if (!newName.trim()) return;
    const areaId = lifeAreaId ? parseInt(lifeAreaId, 10) : undefined;
    await createDiscipline(newName.trim(), areaId);
    setNewName("");
    queryClient.invalidateQueries({ queryKey: ["disciplines-progress"] });
    queryClient.invalidateQueries({ queryKey: ["disciplines"] });
    queryClient.invalidateQueries({ queryKey: ["profile-tree"] });
    queryClient.invalidateQueries({ queryKey: ["life-areas"] });
  };

  const handleDelete = async (id: number) => {
    await deleteDiscipline(id);
    queryClient.invalidateQueries({ queryKey: ["disciplines-progress"] });
    queryClient.invalidateQueries({ queryKey: ["disciplines"] });
    queryClient.invalidateQueries({ queryKey: ["profile-tree"] });
  };

  return (
    <div className="space-y-6 p-8">
      <div>
        <p className="text-sm uppercase tracking-widest text-muted-foreground">Mapa de Conhecimento</p>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <GitBranch className="h-8 w-8 text-primary" />
          Árvore de Conhecimento
        </h1>
      </div>

      <Card className="border-primary/20">
        <CardContent className="pt-6">
          <SkillTreeLoader />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1 space-y-2">
              <Label>Nova disciplina</Label>
              <Input
                placeholder="Ex.: React, Direito Penal..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
            </div>
            <div className="space-y-2 sm:w-48">
              <Label>Área</Label>
              <Select value={lifeAreaId || "default"} onValueChange={(v) => setLifeAreaId(v === "default" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Concurso (padrão)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Concurso (padrão)</SelectItem>
                  {lifeAreas.map((a) => (
                    <SelectItem key={a.id} value={a.id.toString()}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleAdd}><Plus className="h-4 w-4" /></Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {disciplines.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {disciplines.map((d) => (
            <Button key={d.id} variant="outline" size="sm" onClick={() => handleDelete(d.id)}>
              <Trash2 className="mr-1 h-3 w-3" />
              {d.name}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
