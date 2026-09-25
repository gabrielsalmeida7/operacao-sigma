import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Layers } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LifeAreaRadarPoint } from "@/lib/dashboard/overview";

interface LifeAreaRadarChartProps {
  data: LifeAreaRadarPoint[];
}

function RadarTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: LifeAreaRadarPoint }[];
}) {
  if (!active || !payload?.[0]) return null;
  const item = payload[0].payload;

  return (
    <div className="rounded-lg border border-border/60 bg-card px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold">{item.fullName}</p>
      <p className="text-muted-foreground mt-1">Equilíbrio: {(item.score * 100).toFixed(0)}%</p>
      <p className="text-muted-foreground">{item.studyMinutes} min de estudo</p>
      <p className="text-muted-foreground">{item.habitsDone} hábitos · {item.questsDone} quests</p>
    </div>
  );
}

export function LifeAreaRadarChart({ data }: LifeAreaRadarChartProps) {
  if (data.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Layers className="h-4 w-4 text-primary" />
            Equilíbrio por área
          </CardTitle>
        </CardHeader>
        <CardContent className="flex h-64 items-center justify-center text-sm text-muted-foreground">
          Cadastre áreas da vida para ver o radar.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Layers className="h-4 w-4 text-primary" />
          Equilíbrio por área
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Atividade desta semana (estudo, hábitos e quests) — escala 0 a 1
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <RadarChart data={data} cx="50%" cy="50%" outerRadius="72%">
            <PolarGrid stroke="hsl(var(--border))" strokeOpacity={0.6} />
            <PolarAngleAxis
              dataKey="area"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 1]}
              tickCount={6}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
            />
            <Tooltip content={<RadarTooltip />} />
            <Radar
              name="Equilíbrio"
              dataKey="score"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.35}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {data.map((item) => (
            <div key={item.fullName} className="flex items-center gap-2 text-xs">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="truncate text-muted-foreground">{item.fullName}</span>
              <span className="ml-auto font-mono text-foreground">{(item.score * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
