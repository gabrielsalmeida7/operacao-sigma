import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Plus, Trash2, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  getEditalsWithDetails,
  createEdital,
  updateEdital,
  deleteEdital,
  setEditalDisciplines,
} from "@/lib/db/repositories/editals";
import { getDisciplines } from "@/lib/db/repositories/disciplines";
import { formatDateBR } from "@/lib/dates";

export function Editals() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [organ, setOrgan] = useState("");
  const [examDate, setExamDate] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedDiscs, setSelectedDiscs] = useState<number[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data: editals = [], isLoading } = useQuery({
    queryKey: ["editals"],
    queryFn: getEditalsWithDetails,
  });

  const { data: disciplines = [] } = useQuery({
    queryKey: ["disciplines"],
    queryFn: getDisciplines,
  });

  const resetForm = () => {
    setName(""); setOrgan(""); setExamDate(""); setNotes("");
    setSelectedDiscs([]); setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !examDate) return;
    if (editingId) {
      await updateEdital(editingId, { name, organ, examDate, notes });
      await setEditalDisciplines(editingId, selectedDiscs);
    } else {
      await createEdital({ name, organ, examDate, notes, disciplineIds: selectedDiscs });
    }
    resetForm();
    queryClient.invalidateQueries({ queryKey: ["editals"] });
  };

  const startEdit = (e: (typeof editals)[0]) => {
    setEditingId(e.id);
    setName(e.name);
    setOrgan(e.organ ?? "");
    setExamDate(e.examDate);
    setNotes(e.notes ?? "");
    setSelectedDiscs(e.disciplines.map((d) => d.disciplineId));
  };

  const toggleDisc = (id: number) => {
    setSelectedDiscs((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  return (
    <div className="space-y-6 p-8">
      <div>
        <p className="text-sm uppercase tracking-widest text-muted-foreground">Alvos</p>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FileText className="h-8 w-8 text-primary" />
          Editais Alvo
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{editingId ? "Editar edital" : "Novo edital"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Nome do concurso</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="PCDF 2026" />
            </div>
            <div className="space-y-2">
              <Label>Órgão</Label>
              <Input value={organ} onChange={(e) => setOrgan(e.target.value)} placeholder="Polícia Civil" />
            </div>
            <div className="space-y-2">
              <Label>Data da prova</Label>
              <Input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Notas</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observações..." />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Disciplinas do edital</Label>
            <div className="flex flex-wrap gap-2">
              {disciplines.map((d) => (
                <Button
                  key={d.id}
                  size="sm"
                  variant={selectedDiscs.includes(d.id) ? "default" : "outline"}
                  onClick={() => toggleDisc(d.id)}
                >
                  {d.name}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSubmit}>
              <Plus className="mr-2 h-4 w-4" />
              {editingId ? "Salvar" : "Adicionar"}
            </Button>
            {editingId && <Button variant="outline" onClick={resetForm}>Cancelar</Button>}
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {editals.map((e) => (
            <Card key={e.id} className={e.isActive ? "border-primary/30" : "opacity-70"}>
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="text-base">{e.name}</CardTitle>
                  {e.organ && <p className="text-sm text-muted-foreground">{e.organ}</p>}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => startEdit(e)}>
                    <Calendar className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={async () => {
                    await deleteEdital(e.id);
                    queryClient.invalidateQueries({ queryKey: ["editals"] });
                  }}>
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant={e.daysRemaining <= 30 ? "destructive" : "secondary"}>
                    {e.daysRemaining} dias
                  </Badge>
                  <span className="text-sm text-muted-foreground">{formatDateBR(e.examDate)}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {e.disciplines.map((d) => (
                    <Badge key={d.id} variant="outline" className="text-xs">{d.discipline.name}</Badge>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={e.isActive}
                    onCheckedChange={async (v) => {
                      await updateEdital(e.id, { isActive: v });
                      queryClient.invalidateQueries({ queryKey: ["editals"] });
                    }}
                  />
                  <Label className="text-xs">Ativo</Label>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
