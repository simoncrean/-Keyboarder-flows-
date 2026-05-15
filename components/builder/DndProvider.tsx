"use client";

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { ReactNode, useState } from "react";
import { useBuilder } from "@/lib/store";

// Drag item identifiers:
//   palette:<productId>   - dragging a product from the left palette
//   cell:<index>          - dragging a placed key within the current menu
// Drop targets:
//   cell:<index>          - a grid cell
//   trash                 - the remove zone

type DraggingPalette = { kind: "palette"; productId: string };
type DraggingCell = { kind: "cell"; index: number };
type Dragging = DraggingPalette | DraggingCell | null;

function parseDraggable(id: string | number): Dragging {
  const s = String(id);
  if (s.startsWith("palette:")) return { kind: "palette", productId: s.slice(8) };
  if (s.startsWith("cell:")) return { kind: "cell", index: Number(s.slice(5)) };
  return null;
}

function parseDroppable(id: string | number): { kind: "cell"; index: number } | { kind: "trash" } | null {
  const s = String(id);
  if (s.startsWith("cell:")) return { kind: "cell", index: Number(s.slice(5)) };
  if (s === "trash") return { kind: "trash" };
  return null;
}

export function DndProvider({
  children,
  renderOverlay,
}: {
  children: ReactNode;
  renderOverlay: (d: Dragging) => ReactNode;
}) {
  const [active, setActive] = useState<Dragging>(null);
  const placeProduct = useBuilder((s) => s.placeProduct);
  const moveCell = useBuilder((s) => s.moveCell);
  const removeCell = useBuilder((s) => s.removeCell);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={(e) => setActive(parseDraggable(e.active.id))}
      onDragCancel={() => setActive(null)}
      onDragEnd={(e: DragEndEvent) => {
        const from = parseDraggable(e.active.id);
        const to = e.over ? parseDroppable(e.over.id) : null;
        setActive(null);
        if (!from || !to) return;
        if (to.kind === "trash") {
          if (from.kind === "cell") removeCell(from.index);
          return;
        }
        if (from.kind === "palette") {
          placeProduct(to.index, from.productId);
        } else {
          moveCell(from.index, to.index);
        }
      }}
    >
      {children}
      <DragOverlay dropAnimation={null}>{renderOverlay(active)}</DragOverlay>
    </DndContext>
  );
}

export type { Dragging };
