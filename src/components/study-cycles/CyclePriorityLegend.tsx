import { Target, BarChart3, Users, Star, ClipboardList } from "lucide-react";
import {
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  REVIEW_COLORS,
  STUDY_PRIORITIES,
} from "@/lib/study-cycles/constants";
import { cn } from "@/lib/utils";

export function CyclePriorityLegend() {
  return (
    <div className="flex flex-wrap gap-2">
      {STUDY_PRIORITIES.map((priority) => {
        const colors = PRIORITY_COLORS[priority];
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
              "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
              colors.bg,
              colors.text,
              colors.border,
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {PRIORITY_LABELS[priority]}
          </div>
        );
      })}
      <div
        className={cn(
          "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
          REVIEW_COLORS.bg,
          REVIEW_COLORS.text,
          REVIEW_COLORS.border,
        )}
      >
        <ClipboardList className="h-3.5 w-3.5" />
        Questões/Revisão
      </div>
    </div>
  );
}

export function getBlockColors(
  blockType: "DISCIPLINE" | "REVIEW" | "MIXED",
  priority: keyof typeof PRIORITY_COLORS | null,
) {
  if (blockType === "REVIEW" || blockType === "MIXED") return REVIEW_COLORS;
  if (priority && PRIORITY_COLORS[priority]) return PRIORITY_COLORS[priority];
  return REVIEW_COLORS;
}
