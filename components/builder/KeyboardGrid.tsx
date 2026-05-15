"use client";

import { useBuilder } from "@/lib/store";
import { GRID, CELLS_PER_MENU } from "@/lib/schema";
import { KeyCell } from "./KeyCell";

// Presentation-only grid for the flows fork: no TrashZone (no drag-to-remove
// in the comparison view).
export function KeyboardGrid() {
  const select = useBuilder((s) => s.select);
  return (
    <div className="flex flex-col">
      <div
        className="grid gap-2"
        style={{
          gridTemplateColumns: `repeat(${GRID.cols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${GRID.rows}, minmax(0, 1fr))`,
        }}
        onClick={() => select(null)}
      >
        {Array.from({ length: CELLS_PER_MENU }, (_, i) => (
          <KeyCell key={i} index={i} />
        ))}
      </div>
    </div>
  );
}
