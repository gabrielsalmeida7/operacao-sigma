import { Target, BarChart3, Users, Star, ClipboardList } from "lucide-react";
import {
  BOARD_PRIORITY_COLORS,
  BOARD_REVIEW_COLORS,
  PRIORITY_LABELS,
  STUDY_PRIORITIES,
} from "@/lib/study-cycles/constants";
import { cn } from "@/lib/utils";

export function CycleBoardLegend() {
  return (
    <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
      {STUDY_PRIORITIES.map((priority) => {
        const colors = BOARD_PRIORITY_COLORS[priority];
        const Icon =
          priority === "VERY_HIGH"
            ? Target
            : priority === "HIGH"
              ? BarChart3
              : priority === "MEDIUM"
                ? Users
                : Star;

        return (
          <div
            key={priority}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm",
              colors.pill,
              colors.pillText,
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {PRIORITY_LABELS[priority]}
          </div>
        );
      })}
      <div
        className={cn(
          "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm",
          BOARD_REVIEW_COLORS.pill,
          BOARD_REVIEW_COLORS.pillText,
        )}
      >
        <ClipboardList className="h-3.5 w-3.5" />
        Questões/Revisão
      </div>
    </div>
  );
}

export function getBoardBlockColors(
  blockType: "DISCIPLINE" | "REVIEW" | "MIXED",
  priority: keyof typeof BOARD_PRIORITY_COLORS | null,
) {
  if (blockType === "REVIEW" || blockType === "MIXED") return BOARD_REVIEW_COLORS;
  if (priority && BOARD_PRIORITY_COLORS[priority]) return BOARD_PRIORITY_COLORS[priority];
  return BOARD_REVIEW_COLORS;
}

// Re-export dark-theme helpers for other components
export { CyclePriorityLegend, getBlockColors } from "./CyclePriorityLegend";
