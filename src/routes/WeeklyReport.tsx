import { useQuery } from "@tanstack/react-query";
import { FileBarChart, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { generateWeeklyReport } from "@/lib/reports/weekly";
import { formatMinutes } from "@/lib/utils";
import { cn } from "@/lib/utils";

function DeltaBadge({ value }: { value: number }) {
  const positive = value >= 0;
  return (
    <span className={cn("flex items-center gap-1 text-xs font-mono", positive ? "text-emerald-400" : "text-red-400")}>
      {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {positive ? "+" : ""}{value}% vs sem. anterior
    </span>
  );
}

export function WeeklyReport() {
  const { data: report, isLoading } = useQuery({
    queryKey: ["weekly-report"],
    queryFn: generateWeeklyReport,
  });

  if (isLoading || !report) {
    return <div className="p-8 text-muted-foreground">Gerando relatório...</div>;
  }

  return (
    <div className="space-y-6 p-8">
      <div>
        <p className="text-sm uppercase tracking-widest text-muted-foreground">Análise</p>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FileBarChart className="h-8 w-8 text-primary" />
          Relatório Semanal
        </h1>
        <p className="text-muted-foreground mt-1">{report.weekLabel}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Horas estudadas</CardTitle></CardHeader>
          <CardContent>
            <p className="font-mono text-2xl font-bold">{formatMinutes(report.studyMinutes)}</p>
            <DeltaBadge value={report.deltas.studyMinutes} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Questões</CardTitle></CardHeader>
          <CardContent>
            <p className="font-mono text-2xl font-bold">{report.questionsResolved}</p>
            <DeltaBadge value={report.deltas.questionsResolved} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Taxa de acerto</CardTitle></CardHeader>
          <CardContent>
            <p className="font-mono text-2xl font-bold">
              {report.accuracyPercent !== null ? `${report.accuracyPercent}%` : "—"}
            </p>
            <p className="text-xs text-muted-foreground">
              Ant: {report.prevWeek.accuracyPercent !== null ? `${report.prevWeek.accuracyPercent}%` : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">XP ganho</CardTitle></CardHeader>
          <CardContent>
            <p className="font-mono text-2xl font-bold">{report.xpEarned}</p>
            <DeltaBadge value={report.deltas.xpEarned} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Minutos por dia</CardTitle></CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report.dailyBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Bar dataKey="minutes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Minutos" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Resumo operacional</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-border/50 py-2">
              <span>Metas diárias cumpridas</span>
              <span className="font-mono">{report.goalsMet} dias</span>
            </div>
            <div className="flex justify-between border-b border-border/50 py-2">
              <span>Streak atual</span>
              <span className="font-mono">{report.streak} dias</span>
            </div>
            {report.bestDiscipline && (
              <div className="flex justify-between border-b border-border/50 py-2">
                <span>Disciplina mais forte</span>
                <span className="font-mono text-emerald-400">{report.bestDiscipline.name} ({report.bestDiscipline.percent}%)</span>
              </div>
            )}
            {report.worstDiscipline && (
              <div className="flex justify-between py-2">
                <span>Disciplina prioritária</span>
                <span className="font-mono text-amber-400">{report.worstDiscipline.name} ({report.worstDiscipline.percent}%)</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
