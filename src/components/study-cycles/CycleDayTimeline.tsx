import {
  BookOpen,
  ChevronRight,
  ClipboardList,
  Clock,
  Code2,
  Coffee,
  HelpCircle,
  Target,
} from "lucide-react";
import type { Discipline, StudyCycleBlockWithDiscipline, StudyPriority } from "@/lib/db/types";
import { BLOCK_TYPE_LABELS } from "@/lib/study-cycles/constants";
import { getBoardBlockColors } from "./CycleBoardLegend";
import { cn } from "@/lib/utils";

interface CycleDayTimelineProps {
  dayNumber: number;
  blocks: StudyCycleBlockWithDiscipline[];
  disciplines: Discipline[];
}

function blockIcon(block: StudyCycleBlockWithDiscipline) {
  if (block.blockType === "REVIEW") return HelpCircle;
  const name = block.disciplineName?.toLowerCase() ?? "";
  if (name.includes("java") || name.includes("frontend") || name.includes("prog")) return Code2;
  if (name.includes("portugu") || name.includes("ingl")) return BookOpen;
  return ClipboardList;
}

export function CycleDayTimeline({ dayNumber, blocks, disciplines }: CycleDayTimelineProps) {
  const dayBlocks = blocks.filter((b) => b.dayNumber === dayNumber);
  const enriched = dayBlocks.map((block) => {
    const disc = disciplines.find((d) => d.id === block.disciplineId);
    const minutes = block.blockType === "REVIEW" ? 45 : (disc?.blockMinutes ?? 45);
    return { block, minutes };
  });

  const totalMinutes = enriched.reduce((s, e) => s + e.minutes, 0);
  const breakCount = Math.max(0, enriched.length - 1);

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600">
        {enriched.length} blocos · resolução de questões · revisão final
      </p>

      <div className="flex flex-col items-stretch gap-2 lg:flex-row lg:items-center lg:justify-center">
        {enriched.map(({ block, minutes }, index) => {
          const colors = getBoardBlockColors(
            block.blockType,
            block.disciplinePriority as StudyPriority | null,
          );
          const Icon = blockIcon(block);
          const label =
            block.blockType === "REVIEW"
              ? BLOCK_TYPE_LABELS.REVIEW
              : block.disciplineName ?? "—";

          return (
            <div key={block.id} className="flex items-center gap-2 lg:contents">
              <div
                className={cn(
                  "flex min-w-0 flex-1 flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-md lg:max-w-[200px]",
                  colors.row,
                )}
              >
                <div className="mb-3 flex justify-center">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full text-white shadow-sm",
                      colors.badge,
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <div className="mb-1 flex items-center gap-1.5">
                  <span
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold text-white",
                      colors.badge,
                    )}
                  >
                    {block.blockNumber}
                  </span>
                  <span className="text-[10px] font-medium text-slate-500">
                    Bloco {block.blockNumber} · {minutes} min
                  </span>
                </div>
                <p className={cn("text-sm font-bold leading-snug", colors.title)}>{label}</p>
              </div>

              {index < enriched.length - 1 && (
                <div className="hidden shrink-0 lg:flex lg:flex-col lg:items-center lg:px-1">
                  <ChevronRight className="h-5 w-5 text-slate-300" />
                  <div className="mt-1 flex flex-col items-center text-[10px] text-emerald-700">
                    <Coffee className="h-3.5 w-3.5" />
                    <span>Pausa {index + 1}</span>
                    <span className="font-semibold">10 min</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <Clock className="h-8 w-8 shrink-0 text-[#1a237e]" />
          <div>
            <p className="text-sm font-bold text-[#1a237e]">Resumo do dia</p>
            <div className="mt-1 flex flex-wrap items-center gap-1 text-xs text-slate-600">
              {enriched.map(({ block, minutes }, i) => {
                const colors = getBoardBlockColors(
                  block.blockType,
                  block.disciplinePriority as StudyPriority | null,
                );
                return (
                  <span key={block.id} className="flex items-center gap-1">
                    {i > 0 && <span className="text-slate-400">+</span>}
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 font-bold text-white",
                        colors.badge,
                      )}
                    >
                      {minutes}
                    </span>
                  </span>
                );
              })}
              <span className="ml-1 font-bold text-[#1a237e]">
                = {totalMinutes} min ({Math.round(totalMinutes / 60)}h)
              </span>
            </div>
            {breakCount > 0 && (
              <p className="mt-1 text-[10px] text-slate-500">
                + {breakCount} pausa(s) de 10 min entre blocos
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-violet-100 bg-violet-50/80 p-4">
          <Target className="h-8 w-8 shrink-0 text-[#1a237e]" />
          <div>
            <p className="text-sm font-bold text-[#1a237e]">Objetivo do dia</p>
            <p className="mt-1 text-sm text-slate-700">Aprender, fixar e consolidar</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function getCurrentCycleDay(
  currentBlockNumber: number,
  blocks: StudyCycleBlockWithDiscipline[],
): number {
  const current = blocks.find((b) => b.blockNumber === currentBlockNumber);
  return current?.dayNumber ?? 1;
}
