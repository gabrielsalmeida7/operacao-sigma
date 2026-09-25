import { useQuery } from "@tanstack/react-query";
import { Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { getMissionsWithProgress } from "@/lib/gamification/missions";

export function Missions() {
  const { data: missions = [], isLoading } = useQuery({
    queryKey: ["missions"],
    queryFn: getMissionsWithProgress,
  });

  if (isLoading) return <div className="p-8">Carregando missões...</div>;

  const daily = missions.filter((m) => m.template.type === "DAILY");
  const weekly = missions.filter((m) => m.template.type === "WEEKLY");

  const MissionCard = ({ item }: { item: (typeof missions)[0] }) => {
    const percent = Math.min(100, (item.progress.current / item.template.target) * 100);
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">{item.template.title}</CardTitle>
          <Badge variant={item.progress.completed ? "default" : "secondary"}>
            +{item.template.xpReward} XP
          </Badge>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{item.progress.current} / {item.template.target}</span>
            <span>{Math.round(percent)}%</span>
          </div>
          <Progress value={percent} />
          {item.progress.completed && (
            <p className="text-xs text-primary">Missão concluída!</p>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6 p-8">
      <div>
        <p className="text-sm uppercase tracking-widest text-muted-foreground">Objetivos</p>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Target className="h-8 w-8 text-primary" />
          Missões
        </h1>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Diárias</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {daily.map((m) => <MissionCard key={m.template.id} item={m} />)}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Semanais</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {weekly.map((m) => <MissionCard key={m.template.id} item={m} />)}
        </div>
      </section>
    </div>
  );
}
