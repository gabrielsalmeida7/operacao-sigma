import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { HabitHeatMapDay } from "@/lib/db/types";
import { cn } from "@/lib/utils";

interface HabitHeatMapProps {
  days: HabitHeatMapDay[];
  accentColor?: string;
}

const WEEKDAY_LABELS = ["S", "T", "Q", "Q", "S", "S", "D"];

export function HabitHeatMap({ days, accentColor = "#6366f1" }: HabitHeatMapProps) {
  const columns: HabitHeatMapDay[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    columns.push(days.slice(i, i + 7));
  }

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-1">
        <div className="flex flex-col gap-[3px] pt-0.5 text-[9px] leading-none text-muted-foreground">
          {WEEKDAY_LABELS.map((label, i) => (
            <span key={i} className="flex h-3 items-center">{label}</span>
          ))}
        </div>
        <div className="flex gap-[3px] overflow-x-auto pb-1">
          {columns.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((day) => (
                <div
                  key={day.date}
                  title={`${format(parseISO(day.date), "dd MMM yyyy", { locale: ptBR })}${day.completed ? " — feito" : ""}`}
                  className={cn(
                    "h-3 w-3 rounded-sm border border-border/40 transition-colors",
                    !day.completed && "bg-muted/30",
                  )}
                  style={
                    day.completed
                      ? { backgroundColor: accentColor, borderColor: `${accentColor}88` }
                      : undefined
                  }
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground">
        {columns.length} semanas · mais escuro = concluído
      </p>
    </div>
  );
}
