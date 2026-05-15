import {
  CELLS_PER_MENU,
  Cell,
  ConfiguratorCell,
  MAX_DEPTH,
  Menu,
  Product,
} from "./schema";
import { emptyMenu } from "./tree";

// In this fork the catalog/functional-grouping module is gone — flows pages
// pass an empty product list. We only need the dept order to build empty
// submenus + the HOT DRINKS coffee drill.
const FUNCTIONAL_GROUPS = [
  "HOT DRINKS",
  "COLD DRINKS",
  "CARWASH",
  "PRINTED MATERIAL",
  "FISHING & BAIT",
  "FORECOURT",
  "HOT FOOD",
  "WBC BAKERY",
  "KK",
  "Misc",
  "Epay managed",
] as const;

type FunctionalGroup = (typeof FUNCTIONAL_GROUPS)[number];

// Stub: never invoked while products is empty, kept so the original group
// bucketing code below still typechecks.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function groupForProduct(p: Product): FunctionalGroup {
  return "Misc";
}

// "Seed skeleton" produces a layout mirroring the xlsx import architecture:
//   - root → 11 functional dept submenus (HOT DRINKS, COLD DRINKS, …, Epay managed)
//   - HOT DRINKS is a Size → Type → Extras drill (one tile per Size, each
//     Size drills into Type configurator tiles whose only axis is the
//     multi-select Extras list — matches the customer's coffee workflow)
//   - all other depts are pre-populated with BlueTonder products grouped via
//     `groupForProduct`, with "More…" overflow at MAX_DEPTH

const IMPULSE_DEPTS = FUNCTIONAL_GROUPS;

const SIZES = [
  "Small",
  "Medium",
  "Large",
  "XL",
  "Med Refill",
  "Large Refill",
];

const TYPES = [
  "Flat White",
  "Latte",
  "Cappuccino",
  "Mocha",
  "Espresso",
  "Double Espresso",
  "Long Black",
  "Short Macchiato",
  "Long Macchiato",
  "Hot Chocolate",
  "Toffee Hot Chocolate",
  "Hot White Chocolate",
  "Fluffy",
  "Chai",
  "Dirty Chai",
  "Matcha",
  "Dirty Matcha",
  "Tea - English Breakfast",
  "Tea - Earl Gray",
  "Tea - Green",
  "Tea - Peppermint",
  "Tea - Lemon Honey & Ginger",
  "Tea - Hojicha",
];

const MILKS = ["Full Cream", "Trim", "Soy", "Almond", "Oat", "Coconut"];

const EXTRAS = [
  "Caramel",
  "Vanilla",
  "Hazelnut",
  "Tea Syrup",
  "Extra Coffee Shot",
  "Sugar",
  "Extra Tea Bag",
  "Cold Milk",
];

// Each Type tile is a leaf configurator with two axes — Milks
// (single-select) then Extras (multi-select). Tapping a type opens the
// wizard: pick one milk, advances; toggle any extras, hit Done. Extras is
// the final axis — the drill stops there.
function typeConfigurator(label: string): ConfiguratorCell {
  return {
    kind: "configurator",
    label,
    axes: [
      {
        name: "Milks",
        options: MILKS.map((m) => ({ label: m })),
      },
      {
        name: "Extras",
        multiSelect: true,
        options: EXTRAS.map((e) => ({ label: e })),
      },
    ],
  };
}

// Menu drill: HOT DRINKS → Size → Type. Tapping a Type opens the
// 2-axis Milks → Extras wizard.
function buildHotDrinksDept(): Menu {
  const dept = emptyMenu("HOT DRINKS", 2);
  SIZES.forEach((size, i) => {
    if (i >= CELLS_PER_MENU) return;
    const sizeMenu = emptyMenu(size, 3);
    TYPES.forEach((type, j) => {
      if (j >= CELLS_PER_MENU) return;
      sizeMenu.cells[j] = typeConfigurator(type);
    });
    dept.cells[i] = { kind: "submenu", menu: sizeMenu };
  });
  return dept;
}

// Fill the empty cells of `menu` with `items`. If items exceed empty slots,
// the last empty slot becomes a "More…" submenu containing the overflow.
// Stops at MAX_DEPTH (further overflow is dropped silently).
function appendProducts(menu: Menu, items: Product[]): void {
  if (items.length === 0) return;
  const emptyIndices: number[] = [];
  for (let i = 0; i < CELLS_PER_MENU; i++) {
    if (menu.cells[i].kind === "empty") emptyIndices.push(i);
  }
  if (emptyIndices.length === 0) return;

  const productCell = (p: Product): Cell => ({
    kind: "product",
    productId: p.id,
    labelOverride: p.shortName,
  });

  if (items.length <= emptyIndices.length) {
    items.forEach((p, k) => {
      menu.cells[emptyIndices[k]] = productCell(p);
    });
    return;
  }

  const visibleCount = emptyIndices.length - 1;
  for (let k = 0; k < visibleCount; k++) {
    menu.cells[emptyIndices[k]] = productCell(items[k]);
  }
  const overflowIdx = emptyIndices[emptyIndices.length - 1];
  if (menu.depth >= MAX_DEPTH) {
    menu.cells[overflowIdx] = productCell(items[visibleCount]);
    return;
  }
  const more = emptyMenu("More…", menu.depth + 1);
  appendProducts(more, items.slice(visibleCount));
  menu.cells[overflowIdx] = { kind: "submenu", menu: more };
}

export function seedFromTaxonomy(
  products: Product[],
  rootLabel = "Main",
): Menu {
  const root = emptyMenu(rootLabel, 1);

  // Pre-bucket products by functional grouping. HOT DRINKS is handled as a
  // Size→Type→Extras drill, so its catalog products are skipped here —
  // they remain available in the palette for manual placement if needed.
  const byGroup = new Map<(typeof IMPULSE_DEPTS)[number], Product[]>();
  for (const g of IMPULSE_DEPTS) byGroup.set(g, []);
  for (const p of products.filter((q) => q.active)) {
    const g = groupForProduct(p);
    byGroup.get(g)!.push(p);
  }

  IMPULSE_DEPTS.forEach((name, i) => {
    if (i >= CELLS_PER_MENU) return;
    if (name === "HOT DRINKS") {
      root.cells[i] = { kind: "submenu", menu: buildHotDrinksDept() };
      return;
    }
    const dept = emptyMenu(name, 2);
    const items = byGroup.get(name) ?? [];
    items.sort((a, b) => a.shortName.localeCompare(b.shortName));
    appendProducts(dept, items);
    root.cells[i] = { kind: "submenu", menu: dept };
  });
  return root;
}
