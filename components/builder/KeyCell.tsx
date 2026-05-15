"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import { useMemo } from "react";
import { Cell, Product } from "@/lib/schema";
import { useBuilder } from "@/lib/store";
import { cn } from "@/lib/cn";
import { ChevronRight, Sliders } from "lucide-react";

const DEPARTMENT_COLORS: Record<string, string> = {
  Convenience: "bg-sky-500",
  "Food Service": "bg-amber-500",
  Impulse: "bg-fuchsia-500",
  Services: "bg-slate-500",
  Tobacco: "bg-rose-600",
};

function colorForCell(
  cell: Cell,
  products: Record<string, Product>,
): string {
  if (cell.kind === "empty") return "bg-zinc-100 dark:bg-zinc-900 border-dashed";
  if (cell.kind === "submenu")
    return cell.menu.color ?? "bg-zinc-700 text-white";
  if (cell.kind === "configurator")
    return cell.colorOverride ?? "bg-indigo-600 text-white";
  const p = products[cell.productId];
  if (cell.colorOverride) return cell.colorOverride;
  if (p) return `${DEPARTMENT_COLORS[p.department] ?? "bg-zinc-300"} text-white`;
  return "bg-rose-300 text-white"; // broken link
}

export function KeyCell({ index }: { index: number }) {
  const cell = useBuilder((s) => {
    const m = s.layout.root;
    let cur = m;
    for (const i of s.menuPath) {
      const c = cur.cells[i];
      if (c.kind !== "submenu") break;
      cur = c.menu;
    }
    return cur.cells[index];
  });
  const products = useBuilder((s) => s.products);
  const selection = useBuilder((s) => s.selection);
  const select = useBuilder((s) => s.select);
  const enterMenu = useBuilder((s) => s.enterMenu);
  const enterConfigurator = useBuilder((s) => s.enterConfigurator);
  const menuPath = useBuilder((s) => s.menuPath);

  const isSelected =
    selection.kind === "cell" && selection.index === index;

  const droppable = useDroppable({ id: `cell:${index}` });

  const draggable = useDraggable({
    id: `cell:${index}`,
    disabled: cell.kind === "empty",
  });

  const product = useMemo(
    () => (cell.kind === "product" ? products[cell.productId] : undefined),
    [cell, products],
  );

  const label =
    cell.kind === "submenu"
      ? cell.menu.label
      : cell.kind === "product"
      ? cell.labelOverride ?? product?.shortName ?? "(missing)"
      : cell.kind === "configurator"
      ? cell.labelOverride ?? cell.label
      : "";

  const sublabel =
    cell.kind === "product" && product
      ? `$${(product.price / 100).toFixed(2)}`
      : "";

  const imageUrl =
    cell.kind === "product" || cell.kind === "configurator"
      ? cell.imageUrl
      : undefined;

  const colorClass = colorForCell(cell, products);
  const ageFlag = cell.kind === "product" && product?.ageRestricted;

  return (
    <div
      ref={(node) => {
        droppable.setNodeRef(node);
        draggable.setNodeRef(node);
      }}
      {...draggable.attributes}
      {...draggable.listeners}
      onClick={(e) => {
        e.stopPropagation();
        select(index);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        if (cell.kind === "submenu") enterMenu(index);
        else if (cell.kind === "configurator") enterConfigurator(menuPath, index);
      }}
      className={cn(
        "relative aspect-[5/3] rounded-md border text-left text-xs font-medium select-none",
        "transition-shadow cursor-grab active:cursor-grabbing",
        "flex flex-col p-2 overflow-hidden",
        colorClass,
        isSelected && "ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-zinc-900",
        droppable.isOver && "ring-2 ring-emerald-400",
        cell.kind === "empty" && "border-zinc-300 dark:border-zinc-700",
        draggable.isDragging && "opacity-30",
      )}
    >
      {cell.kind === "submenu" && (
        <ChevronRight className="absolute top-1 right-1 size-3 opacity-70" />
      )}
      {cell.kind === "configurator" && (
        <Sliders className="absolute top-1 right-1 size-3 opacity-80" />
      )}
      {ageFlag && (
        <span className="absolute top-1 left-1 rounded bg-black/40 px-1 text-[10px] leading-none py-0.5">
          18+
        </span>
      )}
      {imageUrl && (
        // Plain <img> — tile images come from arbitrary SharePoint URLs which
        // would require allow-listing in next.config.images. Tiles are tiny;
        // optimisation isn't worth the config cost here.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt=""
          className="absolute inset-0 size-full object-cover opacity-50"
          loading="lazy"
        />
      )}
      <span className="relative mt-auto leading-tight break-words line-clamp-2">
        {label}
      </span>
      {sublabel && (
        <span className="relative text-[10px] opacity-80">{sublabel}</span>
      )}
    </div>
  );
}
