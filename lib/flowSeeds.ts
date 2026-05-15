import {
  CELLS_PER_MENU,
  ConfiguratorCell,
  KeyboardLayout,
  Menu,
  Product,
  Region,
} from "./schema";
import { emptyMenu, newId } from "./tree";
import { seedFromTaxonomy } from "./seedFromTaxonomy";

// Flow B: HOT DRINKS shows 23 Type tiles directly. Tapping a Type opens a
// configurator wizard with two axes — Size_Milk (single-select combos like
// "Small_Soy") and Extras (multi-select). The drill stops at Extras.
//
// Example completed order: { Type: Flat White, Size_Milk: Small_Soy,
// Extras: [Caramel] }.

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

const SIZES = [
  "Small",
  "Medium",
  "Large",
  "XL",
  "Med Refill",
  "Large Refill",
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

function sizeMilkCombos(): { label: string }[] {
  const out: { label: string }[] = [];
  for (const s of SIZES) {
    for (const m of MILKS) {
      out.push({ label: `${s}_${m}` });
    }
  }
  return out;
}

function typeConfigurator(label: string): ConfiguratorCell {
  return {
    kind: "configurator",
    label,
    axes: [
      { name: "Size_Milk", options: sizeMilkCombos() },
      {
        name: "Extras",
        multiSelect: true,
        options: EXTRAS.map((e) => ({ label: e })),
      },
    ],
  };
}

// Build the HOT DRINKS dept for Flow B: 23 Type tiles, each a configurator
// carrying Size_Milk → Extras axes.
function buildHotDrinksFlowB(): Menu {
  const dept = emptyMenu("HOT DRINKS", 2);
  TYPES.forEach((type, i) => {
    if (i >= CELLS_PER_MENU) return;
    dept.cells[i] = typeConfigurator(type);
  });
  return dept;
}

// Flow A reuses the existing skeleton seed (Size → Type → wizard{Milks,
// Extras}). Re-exported here so /flows/a and /flows/b share a call surface.
export function buildLayoutFlowA(
  products: Product[],
  region: Region,
): KeyboardLayout {
  return {
    id: newId("l"),
    name: "Flow A — Size first",
    region,
    kind: "main",
    root: seedFromTaxonomy(products, "Flow A — Size first"),
    updatedAt: new Date().toISOString(),
  };
}

export function buildLayoutFlowB(
  products: Product[],
  region: Region,
): KeyboardLayout {
  // Reuse Flow A seed for the rest of the depts; only HOT DRINKS differs.
  const root = seedFromTaxonomy(products, "Flow B — Type first");
  const hotIdx = root.cells.findIndex(
    (c) => c.kind === "submenu" && c.menu.label === "HOT DRINKS",
  );
  if (hotIdx >= 0) {
    root.cells[hotIdx] = { kind: "submenu", menu: buildHotDrinksFlowB() };
  }
  return {
    id: newId("l"),
    name: "Flow B — Type first",
    region,
    kind: "main",
    root,
    updatedAt: new Date().toISOString(),
  };
}
