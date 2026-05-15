import {
  CELLS_PER_MENU,
  Cell,
  KeyboardLayout,
  MAX_DEPTH,
  Menu,
  Region,
} from "./schema";

let _id = 0;
export const newId = (prefix = "n") =>
  `${prefix}_${Date.now().toString(36)}_${(_id++).toString(36)}`;

export const emptyCell = (): Cell => ({ kind: "empty" });

export const emptyMenu = (label: string, depth: number): Menu => ({
  id: newId("m"),
  label,
  depth,
  cells: Array.from({ length: CELLS_PER_MENU }, emptyCell),
});

export const emptyLayout = (
  name: string,
  region: Region,
  rootLabel = "Root",
): KeyboardLayout => ({
  id: newId("l"),
  name,
  region,
  kind: "main",
  root: emptyMenu(rootLabel, 1),
  updatedAt: new Date().toISOString(),
});

// Path is a sequence of cell indices descending into submenus.
// [] = root. [3] = the submenu cell at index 3 of root. [3, 7] = within that submenu, cell 7.
export type Path = number[];

export function getMenuAt(root: Menu, path: Path): Menu {
  let m = root;
  for (const idx of path) {
    const c = m.cells[idx];
    if (c.kind !== "submenu") {
      throw new Error(`Path ${path.join("/")} does not resolve to a submenu`);
    }
    m = c.menu;
  }
  return m;
}

export function tryGetMenuAt(root: Menu, path: Path): Menu | null {
  try {
    return getMenuAt(root, path);
  } catch {
    return null;
  }
}

export function canCreateSubmenuAt(root: Menu, path: Path): boolean {
  const parent = tryGetMenuAt(root, path);
  return parent !== null && parent.depth < MAX_DEPTH;
}

// Mutating helpers — call inside Immer producers in the store.
export function setCell(menu: Menu, index: number, cell: Cell): void {
  menu.cells[index] = cell;
}

export function moveCell(
  menu: Menu,
  fromIdx: number,
  toIdx: number,
): void {
  if (fromIdx === toIdx) return;
  const moving = menu.cells[fromIdx];
  const displaced = menu.cells[toIdx];
  menu.cells[toIdx] = moving;
  menu.cells[fromIdx] = displaced; // swap, not insert+shift — cells have positions
}

export function clearCell(menu: Menu, index: number): void {
  menu.cells[index] = emptyCell();
}

export function wrapInSubmenu(
  parent: Menu,
  index: number,
  label: string,
  childrenCells: Cell[],
): boolean {
  if (parent.depth >= MAX_DEPTH) return false;
  const sub = emptyMenu(label, parent.depth + 1);
  childrenCells.slice(0, CELLS_PER_MENU).forEach((c, i) => {
    sub.cells[i] = c;
  });
  parent.cells[index] = { kind: "submenu", menu: sub };
  return true;
}

export function countNonEmpty(menu: Menu): number {
  return menu.cells.reduce((n, c) => n + (c.kind === "empty" ? 0 : 1), 0);
}

export function findFirstEmptyIndex(menu: Menu): number {
  return menu.cells.findIndex((c) => c.kind === "empty");
}
