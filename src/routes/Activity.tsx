import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity as ActivityIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActivityFeed } from "@/components/activity/ActivityFeed";
import { getRecentActivity } from "@/lib/db/repositories/activity";
import type { ActivityItem } from "@/lib/db/types";

const filters: { value: string; label: string; type?: ActivityItem["type"] }[] = [
  { value: "all", label: "Tudo" },
  { value: "study", label: "Estudo", type: "study" },
  { value: "questions", label: "Questões", type: "questions" },
  { value: "achievement", label: "Conquistas", type: "achievement" },
  { value: "mission", label: "Missões", type: "mission" },
];

export function Activity() {
  const [filter, setFilter] = useState("all");
  const activeFilter = filters.find((f) => f.value === filter);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["activity", filter],
    queryFn: () => getRecentActivity(50, activeFilter?.type),
  });

  return (
    <div className="space-y-6 p-8">
      <div>
        <p className="text-sm uppercase tracking-widest text-muted-foreground">Inteligência</p>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ActivityIcon className="h-8 w-8 text-primary" />
          Feed de Atividade
        </h1>
      </div>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          {filters.map((f) => (
            <TabsTrigger key={f.value} value={f.value}>{f.label}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-sm">Carregando...</p>
          ) : (
            <ActivityFeed items={items} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
