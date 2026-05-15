"use client";

import Link from "next/link";

export function FlowChrome({ variant }: { variant: "A" | "B" }) {
  return (
    <div className="sticky top-0 z-50 flex items-center justify-center gap-2 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur px-4 py-2">
      <Link
        href="/flows"
        className="text-xs px-2 py-1 rounded-full text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
      >
        ← Flows
      </Link>
      <span className="h-4 w-px bg-zinc-300 dark:bg-zinc-700 mx-1" />
      <Link
        href="/flows/a"
        className={
          "text-xs px-3 py-1 rounded-full font-medium " +
          (variant === "A"
            ? "bg-blue-600 text-white"
            : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800")
        }
      >
        Flow A · Size first
      </Link>
      <Link
        href="/flows/b"
        className={
          "text-xs px-3 py-1 rounded-full font-medium " +
          (variant === "B"
            ? "bg-indigo-600 text-white"
            : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800")
        }
      >
        Flow B · Type first
      </Link>
    </div>
  );
}
