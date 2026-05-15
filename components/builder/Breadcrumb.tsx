"use client";

import { useMemo } from "react";
import { useBuilder } from "@/lib/store";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Menu } from "@/lib/schema";
import type { Path } from "@/lib/tree";

function buildCrumbs(root: Menu, menuPath: Path): { label: string; path: Path }[] {
  const crumbs: { label: string; path: Path }[] = [{ label: root.label, path: [] }];
  let m = root;
  for (let i = 0; i < menuPath.length; i++) {
    const idx = menuPath[i];
    const c = m.cells[idx];
    if (c.kind !== "submenu") break;
    m = c.menu;
    crumbs.push({ label: m.label, path: menuPath.slice(0, i + 1) });
  }
  return crumbs;
}

export function Breadcrumb() {
  const root = useBuilder((s) => s.layout.root);
  const menuPath = useBuilder((s) => s.menuPath);
  const configurator = useBuilder((s) => s.configurator);
  const crumbs = useMemo(() => buildCrumbs(root, menuPath), [root, menuPath]);
  const goToPath = useBuilder((s) => s.goToPath);
  const ascend = useBuilder((s) => s.ascend);
  const exitConfigurator = useBuilder((s) => s.exitConfigurator);
  const depth = crumbs.length;
  const atRoot = depth === 1 && !configurator;

  // When in a configurator wizard, append crumbs for the configurator cell
  // and each pick made so far. The cell label and pick labels are derived
  // from the live layout so they stay in sync if the user edits.
  const configuratorCrumbs = useMemo(() => {
    if (!configurator) return [] as { label: string; onClick?: () => void }[];
    const parentMenu = (() => {
      let m = root;
      for (const i of configurator.path) {
        const c = m.cells[i];
        if (c.kind !== "submenu") break;
        m = c.menu;
      }
      return m;
    })();
    const cell = parentMenu.cells[configurator.cellIdx];
    if (cell.kind !== "configurator") return [];
    const out: { label: string; onClick?: () => void }[] = [
      { label: cell.label, onClick: exitConfigurator },
    ];
    configurator.picks.forEach((p) => {
      const text = Array.isArray(p.option)
        ? p.option.length === 0
          ? "(none)"
          : p.option.join(", ")
        : p.option;
      out.push({ label: text });
    });
    const currentAxis = cell.axes[configurator.axisIdx];
    if (currentAxis) out.push({ label: currentAxis.name });
    return out;
  }, [configurator, root, exitConfigurator]);

  return (
    <div className="flex items-center gap-1 text-sm">
      <button
        onClick={ascend}
        disabled={atRoot}
        className={cn(
          "rounded p-1",
          atRoot
            ? "text-zinc-300 dark:text-zinc-700 cursor-not-allowed"
            : "hover:bg-zinc-100 dark:hover:bg-zinc-800",
        )}
        title="Back (Esc)"
      >
        <ArrowLeft className="size-4" />
      </button>
      {crumbs.map((c, i) => (
        <div key={`m${i}`} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="size-3 text-zinc-400" />}
          <button
            onClick={() => goToPath(c.path)}
            className={cn(
              "rounded px-1.5 py-0.5",
              i === crumbs.length - 1 && configuratorCrumbs.length === 0
                ? "font-semibold"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800",
            )}
          >
            {c.label}
          </button>
        </div>
      ))}
      {configuratorCrumbs.map((c, i) => (
        <div key={`c${i}`} className="flex items-center gap-1">
          <ChevronRight className="size-3 text-indigo-400" />
          <button
            onClick={c.onClick}
            disabled={!c.onClick}
            className={cn(
              "rounded px-1.5 py-0.5",
              i === configuratorCrumbs.length - 1
                ? "font-semibold text-indigo-700 dark:text-indigo-400"
                : "text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-200 hover:bg-indigo-50 dark:hover:bg-indigo-950",
              !c.onClick && "cursor-default",
            )}
          >
            {c.label}
          </button>
        </div>
      ))}
      {!configurator && (
        <span
          className={cn(
            "ml-2 text-xs",
            depth >= 5
              ? "text-rose-600 font-medium"
              : depth >= 4
              ? "text-amber-600"
              : "text-zinc-400",
          )}
          title="Menu nesting depth (max 5)"
        >
          depth {depth}/5
        </span>
      )}
    </div>
  );
}
