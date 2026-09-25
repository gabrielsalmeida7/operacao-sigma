import { CalendarDays, Target } from "lucide-react";
import type { StudyCycle, StudyCycleBlockWithDiscipline, StudyPriority } from "@/lib/db/types";
import { BLOCK_TYPE_LABELS } from "@/lib/study-cycles/constants";
import { getBoardBlockColors } from "./CycleBoardLegend";
import { cn } from "@/lib/utils";

interface TopicGroup {
  disciplineId: number;
  disciplineName: string;
  topics: { name: string }[];
}

interface CycleWeekGridProps {
  cycle: StudyCycle;
  blocks: StudyCycleBlockWithDiscipline[];
  topicGroups: TopicGroup[];
  daysToShow?: number;
}

function getTopicBullets(disciplineId: number | null, topicGroups: TopicGroup[]): string[] {
  if (!disciplineId) return [];
  const group = topicGroups.find((g) => g.disciplineId === disciplineId);
  if (!group || group.topics.length === 0) {
    return ["Conteúdo programático"];
  }
  return group.topics.slice(0, 3).map((t) => t.name);
}

export function CycleWeekGrid({
  cycle,
  blocks,
  topicGroups,
  daysToShow = 6,
}: CycleWeekGridProps) {
  const days = Array.from({ length: Math.min(daysToShow, cycle.dayCount) }, (_, i) => i + 1);
  const weekBlocks = blocks.filter((b) => b.dayNumber <= daysToShow);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800 border border-amber-200">
          Blocos {weekBlocks[0]?.blockNumber ?? 1} a {weekBlocks[weekBlocks.length - 1]?.blockNumber ?? 18}
        </span>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-800 border border-blue-200">
          {days.length} dias de estudo nesta semana
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {days.map((day) => {
          const dayBlocks = blocks.filter((b) => b.dayNumber === day);

          return (
            <div
              key={day}
              className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-md"
            >
              <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-2">
                <CalendarDays className="h-4 w-4 text-[#1a237e]" />
                <span className="font-bold text-[#1a237e]">Dia {day}</span>
              </div>

              <div className="space-y-4">
                {dayBlocks.map((block) => {
                  const colors = getBoardBlockColors(
                    block.blockType,
                    block.disciplinePriority as StudyPriority | null,
                  );
                  const label =
                    block.blockType === "REVIEW"
                      ? BLOCK_TYPE_LABELS.REVIEW
                      : block.disciplineName ?? "—";
                  const bullets =
                    block.blockType === "REVIEW"
                      ? ["Bateria de questões", "Correção comentada"]
                      : getTopicBullets(block.disciplineId, topicGroups);

                  return (
                    <div key={block.id} className="space-y-1.5">
                      <div className="flex items-start gap-2">
                        <span
                          className={cn(
                            "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded text-[10px] font-bold text-white",
                            colors.badge,
                          )}
                        >
                          {block.blockNumber}
                        </span>
                        <p className={cn("text-sm font-bold leading-tight", colors.title)}>
                          {label}
                        </p>
                      </div>
                      <ul className="ml-8 list-disc space-y-0.5 text-xs text-slate-600">
                        {bullets.map((b) => (
                          <li key={b}>{b}</li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/80 px-4 py-3">
        <Target className="mt-0.5 h-5 w-5 shrink-0 text-[#1a237e]" />
        <p className="text-sm text-slate-700">
          <span className="font-bold text-[#1a237e]">Objetivo da semana:</span>{" "}
          abrir o edital com visão ampla e avançar no núcleo técnico com consistência.
        </p>
      </div>
    </div>
  );
}
