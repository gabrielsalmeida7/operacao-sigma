import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  formatRemainingDays,
  getAllTimeProgress,
  type TimePeriod,
  type TimePeriodProgress,
} from "@/lib/dates/timeProgress";
import { cn } from "@/lib/utils";

const PERIOD_STYLES: Record<TimePeriod, { bar: string; text: string }> = {
  week: { bar: "[&>div]:bg-sky-500", text: "text-sky-400" },
  month: { bar: "[&>div]:bg-violet-500", text: "text-violet-400" },
  year: { bar: "[&>div]:bg-amber-500", text: "text-amber-400" },
};

function TimeBar({ item }: { item: TimePeriodProgress }) {
  const styles = PERIOD_STYLES[item.period];
  const percentRounded = Math.round(item.percent);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <span className={cn("text-sm font-medium", styles.text)}>{item.label}</span>
          <span className="ml-2 text-xs text-muted-foreground">{item.rangeLabel}</span>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <span className="font-mono font-medium text-foreground">{percentRounded}%</span>
          <span className="mx-1">·</span>
          <span>{formatRemainingDays(item.remainingDays)}</span>
        </div>
      </div>
      <Progress value={item.percent} className={cn("h-2", styles.bar)} />
    </div>
  );
}

export function TimeProgressBars() {
  const [items, setItems] = useState(() => getAllTimeProgress());

  useEffect(() => {
    const tick = () => setItems(getAllTimeProgress());
    tick();
    const interval = setInterval(tick, 60_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarDays className="h-4 w-4 text-primary" />
          Tempo decorrido
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {items.map((item) => (
          <TimeBar key={item.period} item={item} />
        ))}
      </CardContent>
    </Card>
  );
}
