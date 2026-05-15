import Link from "next/link";

export default function FlowsLanding() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-3xl w-full space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Keyboarder Flows</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Two POS Hot Drinks journeys, same axes, different ordering. Open
            each and step through the Coffee tile to compare taps and screens.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Link
            href="/flows/a"
            className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 hover:border-blue-500 hover:shadow-md transition"
          >
            <div className="text-xs font-semibold text-blue-600">FLOW A</div>
            <div className="mt-1 text-lg font-medium">
              Size First (4 Levels, Item Level)
            </div>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              HOT DRINKS → Size → Variety → wizard (Milks → Extras).
            </p>
            <ul className="mt-3 text-xs text-zinc-500 space-y-0.5">
              <li>• 2 menu drills before the wizard</li>
              <li>• Wizard: Milks (single) then Extras (multi)</li>
              <li>• 23 varieties surfaced inside each Size</li>
            </ul>
          </Link>

          <Link
            href="/flows/b"
            className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 hover:border-indigo-500 hover:shadow-md transition"
          >
            <div className="text-xs font-semibold text-indigo-600">FLOW B</div>
            <div className="mt-1 text-lg font-medium">
              Type First (3 Levels, Modifiers)
            </div>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              HOT DRINKS → Type → wizard (Size_Milk → Extras).
            </p>
            <ul className="mt-3 text-xs text-zinc-500 space-y-0.5">
              <li>• 1 menu drill before the wizard</li>
              <li>• Wizard: Size_Milk combo (single) then Extras (multi)</li>
              <li>• 36 Size_Milk tiles (6 sizes × 6 milks)</li>
            </ul>
          </Link>
        </div>
      </div>
    </div>
  );
}
