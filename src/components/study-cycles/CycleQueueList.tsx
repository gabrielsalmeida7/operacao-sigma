import { useEffect, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
  type DraggableAttributes,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { StudyCycle, StudyCycleBlockWithDiscipline, StudyPriority } from "@/lib/db/types";
import { getBoardBlockColors } from "./CycleBoardLegend";
import { cn } from "@/lib/utils";

interface CycleQueueListProps {
  cycle: StudyCycle;
  blocks: StudyCycleBlockWithDiscipline[];
  onReorder?: (orderedIds: number[]) => void;
}

function QueueRow({
  block,
  isCurrent,
  dragHandle,
  isOverlay,
}: {
  block: StudyCycleBlockWithDiscipline;
  isCurrent: boolean;
  dragHandle?: {
    attributes: DraggableAttributes;
    listeners?: object;
  };
  isOverlay?: boolean;
}) {
  const colors = getBoardBlockColors(
    block.blockType,
    block.disciplinePriority as StudyPriority | null,
  );

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5",
        colors.row,
        isCurrent && "ring-2 ring-primary ring-offset-2 ring-offset-background",
        isOverlay && "cursor-grabbing border border-primary/40",
      )}
    >
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
        aria-label="Arrastar sessão"
        {...(dragHandle?.attributes ?? {})}
        {...(dragHandle?.listeners ?? {})}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="w-8 font-mono text-xs text-muted-foreground">
        {String(block.blockNumber).padStart(2, "0")}
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-sm font-semibold", colors.title)}>
          {block.disciplineName ?? "—"}
        </p>
        {block.thematicFocus && (
          <p className="truncate text-xs text-muted-foreground">{block.thematicFocus}</p>
        )}
      </div>
    </div>
  );
}

function SortableRow({
  block,
  isCurrent,
}: {
  block: StudyCycleBlockWithDiscipline;
  isCurrent: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: String(block.id),
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(isDragging && "opacity-40")}
    >
      <QueueRow
        block={block}
        isCurrent={isCurrent}
        dragHandle={{ attributes, listeners }}
      />
    </div>
  );
}

export function CycleQueueList({ cycle, blocks, onReorder }: CycleQueueListProps) {
  const [items, setItems] = useState(blocks);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    setItems(blocks);
  }, [blocks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || String(active.id) === String(over.id)) return;

    const oldIndex = items.findIndex((b) => String(b.id) === String(active.id));
    const newIndex = items.findIndex((b) => String(b.id) === String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered);
    onReorder?.(reordered.map((b) => b.id));
  };

  const activeBlock = items.find((b) => String(b.id) === activeId) ?? null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <SortableContext items={items.map((b) => String(b.id))} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {items.map((block) => (
            <SortableRow
              key={block.id}
              block={block}
              isCurrent={block.blockNumber === cycle.currentBlockNumber}
            />
          ))}
        </div>
      </SortableContext>
      <DragOverlay>
        {activeBlock ? (
          <QueueRow block={activeBlock} isCurrent={false} isOverlay />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
