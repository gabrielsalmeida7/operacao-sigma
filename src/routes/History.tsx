import { useQuery } from "@tanstack/react-query";
import { BarChart3, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { getMonthlySnapshots } from "@/lib/gamification/snapshots";
import { formatMonthYear } from "@/lib/dates";

export function History() {
  const { data: snapshots = [], isLoading } = useQuery({
    queryKey: ["history"],
    queryFn: getMonthlySnapshots,
  });

  if (isLoading) return <div className="p-8">Carregando histórico...</div>;

  const chartData = snapshots.map((s) => ({
    name: formatMonthYear(s.year, s.month).slice(0, 3),
    horas: Math.round((s.studyMinutes / 60) * 10) / 10,
    questoes: s.questionsResolved,
    xp: s.xpEarned,
    label: formatMonthYear(s.year, s.month),
  }));

  return (
    <div className="space-y-6 p-8">
      <div>
        <p className="text-sm uppercase tracking-widest text-muted-foreground">Inteligência</p>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BarChart3 className="h-8 w-8 text-primary" />
          Histórico & Ranking Pessoal
        </h1>
        <p className="text-muted-foreground mt-1">Você vs versões passadas de você</p>
      </div>

      {snapshots.length > 1 && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-primary" />
              Evolução Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {snapshots.slice(-6).map((s, i, arr) => {
                if (i === 0) return null;
                const prev = arr[i - 1];
                const hours = Math.round((s.studyMinutes / 60) * 10) / 10;
                const prevHours = Math.round((prev.studyMinutes / 60) * 10) / 10;
                const diff = hours - prevHours;
                return (
                  <div key={`${s.year}-${s.month}`} className="flex justify-between text-sm border-b border-border/50 py-2">
                    <span>{formatMonthYear(s.year, s.month)}</span>
                    <span className="font-mono">{hours}h</span>
                    <span className={diff >= 0 ? "text-primary" : "text-destructive"}>
                      {diff >= 0 ? "+" : ""}{diff}h vs anterior
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Horas por Mês</CardTitle></CardHeader>
          <CardContent className="h-64">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                    labelFormatter={(_, payload) => payload[0]?.payload?.label ?? ""}
                  />
                  <Bar dataKey="horas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm">Sem dados ainda. Comece a estudar!</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Questões por Mês</CardTitle></CardHeader>
          <CardContent className="h-64">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                  />
                  <Line type="monotone" dataKey="questoes" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm">Sem dados ainda.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
