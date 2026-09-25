import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles, Clock, BookOpen, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { calculateFutureProjection } from "@/lib/projections/futureSelf";
import { getActiveEditals } from "@/lib/db/repositories/editals";
import { updateSettings, getSettings } from "@/lib/db/repositories/settings";

export function FutureSelf() {
  const queryClient = useQueryClient();
  const [selectedEdital, setSelectedEdital] = useState<string>("default");

  const { data: editals = [] } = useQuery({
    queryKey: ["editals-active"],
    queryFn: getActiveEditals,
  });

  const { data: settings } = useQuery({
    queryKey: ["settings-future"],
    queryFn: getSettings,
  });

  useEffect(() => {
    if (settings?.selectedEditalId) {
      setSelectedEdital(settings.selectedEditalId.toString());
    }
  }, [settings?.selectedEditalId]);

  const editalId = selectedEdital === "default"
    ? null
    : parseInt(selectedEdital, 10);

  const { data, isLoading } = useQuery({
    queryKey: ["future-self", editalId],
    queryFn: () => calculateFutureProjection(30, editalId),
  });

  const handleEditalChange = async (value: string) => {
    setSelectedEdital(value);
    const id = value === "default" ? null : parseInt(value, 10);
    await updateSettings({ selectedEditalId: id });
    queryClient.invalidateQueries({ queryKey: ["future-self"] });
  };

  if (isLoading || !data) return <div className="p-8">Calculando projeções...</div>;

  return (
    <div className="space-y-6 p-8">
      <div>
        <p className="text-sm uppercase tracking-widest text-muted-foreground">Projeção Estratégica</p>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          {data.userName} do Futuro
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">{data.motivationalText}</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2 max-w-sm">
            <Label>Projetar até</Label>
            <Select value={selectedEdital} onValueChange={handleEditalChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o alvo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Data das configurações</SelectItem>
                {editals.map((e) => (
                  <SelectItem key={e.id} value={e.id.toString()}>{e.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            {data.targetLabel} — {new Date(data.targetDate).toLocaleDateString("pt-BR")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">{data.daysRemaining} dias restantes</p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border bg-card/50 p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Clock className="h-4 w-4" /> Horas projetadas
              </div>
              <p className="font-mono text-4xl font-bold text-primary mt-2">
                {data.projectedHours.toLocaleString("pt-BR")}h
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Atual: {data.currentTotalHours}h · Média: {data.avgMinutesPerDay} min/dia
              </p>
            </div>
            <div className="rounded-lg border bg-card/50 p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <BookOpen className="h-4 w-4" /> Questões projetadas
              </div>
              <p className="font-mono text-4xl font-bold text-primary mt-2">
                {data.projectedQuestions.toLocaleString("pt-BR")}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Atual: {data.currentTotalQuestions} · Média: {data.avgQuestionsPerDay}/dia
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">O impacto acumulado</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            Seu cérebro para de enxergar o estudo de hoje e começa a enxergar o impacto acumulado.
          </p>
          <p>
            Com base no ritmo dos últimos 30 dias, você está projetado para acumular{" "}
            <span className="text-foreground font-medium">{data.projectedHours} horas</span> e resolver{" "}
            <span className="text-foreground font-medium">{data.projectedQuestions.toLocaleString("pt-BR")} questões</span>{" "}
            até a data alvo.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
