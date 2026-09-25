import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CalendarDays, GripVertical } from "lucide-react";
import type { StudyCycle, StudyCycleBlockWithDiscipline, StudyPriority } from "@/lib/db/types";
import { BLOCK_TYPE_LABELS, WEEKDAY_LABELS } from "@/lib/study-cycles/constants";
import { getBoardBlockColors } from "./CycleBoardLegend";
import { cn } from "@/lib/utils";

interface CycleDayGridProps {
  cycle: StudyCycle;
  blocks: StudyCycleBlockWithDiscipline[];
  onReorder?: (orderedIds: number[]) => void;
}

function SortableBlock({
  block,
  isCurrent,
}: {
  block: StudyCycleBlockWithDiscipline;
  isCurrent: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  });

  const colors = getBoardBlockColors(
    block.blockType,
    block.disciplinePriority as StudyPriority | null,
  );

  const label =
    block.blockType === "REVIEW"
      ? BLOCK_TYPE_LABELS.REVIEW
      : block.disciplineName ?? "—";

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-shadow",
        colors.row,
        isCurrent && "ring-2 ring-[#1a237e] ring-offset-2 ring-offset-white shadow-md",
        isDragging && "opacity-70 shadow-lg",
      )}
    >
      <button
        type="button"
        className="cursor-grab opacity-0 transition-opacity group-hover:opacity-40 hover:!opacity-100"
        aria-label="Reordenar bloco"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 text-slate-400" />
      </button>
      <span
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold text-white shadow-sm",
          colors.badge,
        )}
      >
        {block.blockNumber}
      </span>
      <span className={cn("truncate text-sm font-semibold", colors.title)}>{label}</span>
    </div>
  );
}

export function CycleDayGrid({ cycle, blocks, onReorder }: CycleDayGridProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const days = Array.from({ length: cycle.dayCount }, (_, i) => i + 1);

  const handleDragEnd = (event: DragEndEvent) => {
    if (!onReorder) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = blocks.findIndex((b) => b.id === active.id);
    const newIndex = blocks.findIndex((b) => b.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = [...blocks];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    onReorder(reordered.map((b) => b.id));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={blocks.map((b) => b.id)} strategy={rectSortingStrategy}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {days.map((day) => {
            const dayBlocks = blocks.filter((b) => b.dayNumber === day);
            const weekday = cycle.studyWeekdays[String(day)];
            const weekdayLabel = weekday ? WEEKDAY_LABELS[weekday] : null;

            return (
              <div
                key={day}
                className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-md"
              >
                <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-2">
                  <CalendarDays className="h-4 w-4 text-[#1a237e]" />
                  <span className="font-bold text-[#1a237e]">Dia {day}</span>
                  {weekdayLabel && (
                    <span className="rounded-md bg-[#1a237e]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#1a237e]">
                      {weekdayLabel}
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  {dayBlocks.map((block) => (
                    <SortableBlock
                      key={block.id}
                      block={block}
                      isCurrent={block.blockNumber === cycle.currentBlockNumber}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
}
