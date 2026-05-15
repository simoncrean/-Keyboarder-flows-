"use client";

import { useMemo } from "react";
import { useBuilder } from "@/lib/store";
import { CELLS_PER_MENU, GRID } from "@/lib/schema";
import { getMenuAt } from "@/lib/tree";
import { cn } from "@/lib/cn";
import { Check } from "lucide-react";

// Renders the layered configurator wizard. Single-select axes advance on
// click; multi-select axes (e.g., Coffee > Extras) let the user toggle any
// number of options and confirm with the Done button.
export function ConfiguratorView() {
  const view = useBuilder((s) => s.configurator);
  const layout = useBuilder((s) => s.layout);
  const pick = useBuilder((s) => s.pickConfiguratorOption);
  const confirm = useBuilder((s) => s.confirmConfiguratorAxis);

  const data = useMemo(() => {
    if (!view) return null;
    const menu = getMenuAt(layout.root, view.path);
    const cell = menu.cells[view.cellIdx];
    if (cell.kind !== "configurator") return null;
    const axis = cell.axes[view.axisIdx];
    return axis ? { cellLabel: cell.label, axis, total: cell.axes.length } : null;
  }, [view, layout]);

  if (!view || !data) return null;
  const isMulti = data.axis.multiSelect === true;
  const selected = new Set(view.pendingExtras);

  return (
    <div className="flex flex-col">
      <div
        className="grid gap-2"
        style={{
          gridTemplateColumns: `repeat(${GRID.cols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${GRID.rows}, minmax(0, 1fr))`,
        }}
      >
        {Array.from({ length: CELLS_PER_MENU }, (_, i) => {
          const opt = data.axis.options[i];
          if (!opt) {
            return (
              <div
                key={i}
                className="aspect-[5/3] rounded-md border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900"
              />
            );
          }
          const on = isMulti && selected.has(opt.label);
          return (
            <button
              key={i}
              onClick={() => pick(opt.label)}
              className={cn(
                "relative aspect-[5/3] rounded-md border text-left text-xs font-medium",
                "flex flex-col p-2 overflow-hidden select-none",
                "transition-shadow cursor-pointer active:scale-[0.98]",
                on
                  ? "bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-500 ring-2 ring-emerald-300"
                  : "bg-indigo-600 text-white border-indigo-700 hover:bg-indigo-500",
              )}
              title={opt.label}
            >
              {on && (
                <Check className="absolute top-1 right-1 size-3.5 opacity-90" />
              )}
              <span className="mt-auto leading-tight break-words line-clamp-3">
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
        <div>
          {data.axis.name} · axis {view.axisIdx + 1} of {data.total}
          {isMulti &&
            ` — pick any number${
              view.pendingExtras.length > 0
                ? `: ${view.pendingExtras.join(", ")}`
                : ""
            }`}
        </div>
        {isMulti && (
          <button
            onClick={confirm}
            className="inline-flex items-center gap-1.5 rounded bg-emerald-600 text-white px-3 py-1.5 text-xs font-medium hover:bg-emerald-700"
          >
            <Check className="size-3.5" /> Done
            {view.pendingExtras.length > 0 && ` (${view.pendingExtras.length})`}
          </button>
        )}
      </div>
    </div>
  );
}
