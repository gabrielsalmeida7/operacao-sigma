import { useQuery } from "@tanstack/react-query";
import { Trophy, Lock, Unlock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAchievementsWithStatus } from "@/lib/gamification/achievements";

const categoryLabels: Record<string, string> = {
  consistency: "Consistência",
  questions: "Questões",
  hours: "Horas",
};

export function Achievements() {
  const { data: achievements = [], isLoading } = useQuery({
    queryKey: ["achievements"],
    queryFn: getAchievementsWithStatus,
  });

  if (isLoading) return <div className="p-8">Carregando conquistas...</div>;

  const categories = [...new Set(achievements.map((a) => a.category))];
  const unlocked = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="space-y-6 p-8">
      <div>
        <p className="text-sm uppercase tracking-widest text-muted-foreground">Hall da Fama</p>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Trophy className="h-8 w-8 text-primary" />
          Conquistas
        </h1>
        <p className="text-muted-foreground mt-1">{unlocked} de {achievements.length} desbloqueadas</p>
      </div>

      <Tabs defaultValue={categories[0]}>
        <TabsList>
          {categories.map((cat) => (
            <TabsTrigger key={cat} value={cat}>{categoryLabels[cat] ?? cat}</TabsTrigger>
          ))}
        </TabsList>
        {categories.map((cat) => (
          <TabsContent key={cat} value={cat} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
            {achievements.filter((a) => a.category === cat).map((a) => (
              <Card key={a.id} className={a.unlocked ? "border-primary/30" : "opacity-60"}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    {a.unlocked ? <Unlock className="h-4 w-4 text-primary" /> : <Lock className="h-4 w-4" />}
                    {a.title}
                  </CardTitle>
                  {a.xpReward > 0 && <Badge variant="secondary">+{a.xpReward} XP</Badge>}
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {a.unlocked ? `Desbloqueada em ${new Date(a.unlockedAt!).toLocaleDateString("pt-BR")}` : `Meta: ${a.threshold}`}
                  </p>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
