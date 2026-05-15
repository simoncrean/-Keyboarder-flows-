"use client";

import { useEffect } from "react";
import { Breadcrumb } from "@/components/builder/Breadcrumb";
import { KeyboardGrid } from "@/components/builder/KeyboardGrid";
import { ConfiguratorView } from "@/components/builder/ConfiguratorView";
import { DndProvider } from "@/components/builder/DndProvider";
import { useBuilder, useBuilderUndo, useBuilderRedo } from "@/lib/store";

function MainArea() {
  const inConfigurator = useBuilder((s) => s.configurator !== null);
  return inConfigurator ? <ConfiguratorView /> : <KeyboardGrid />;
}

// Minimal builder surface for the flow comparison: just breadcrumb +
// menu/wizard grid. No toolbar, no palette, no properties panel. Keyboard
// shortcuts kept for ⌘Z / Esc since they're handy when walking the drill.
export function FlowJourney() {
  const ascend = useBuilder((s) => s.ascend);
  const undo = useBuilderUndo();
  const redo = useBuilderRedo();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;
      if (isInput) return;
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (e.key === "Escape") {
        ascend();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ascend, undo, redo]);

  return (
    <DndProvider renderOverlay={() => null}>
      <div className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-800">
        <Breadcrumb />
      </div>
      <div className="flex-1 overflow-auto p-6 bg-zinc-50 dark:bg-zinc-950">
        <div className="mx-auto max-w-5xl">
          <MainArea />
        </div>
      </div>
    </DndProvider>
  );
}
