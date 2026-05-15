"use client";

import { create } from "zustand";
import { temporal } from "zundo";
import { produce } from "immer";
import {
  CELLS_PER_MENU,
  Cell,
  KeyboardLayout,
  MAX_DEPTH,
  Menu,
  Product,
  Region,
} from "./schema";
import {
  emptyLayout,
  emptyMenu,
  findFirstEmptyIndex,
  getMenuAt,
  newId,
  Path,
  tryGetMenuAt,
} from "./tree";
import { seedFromTaxonomy } from "./seedFromTaxonomy";

type Selection =
  | { kind: "none" }
  | { kind: "cell"; path: Path; index: number };

// When the user double-clicks a ConfiguratorCell, we enter a layered picker
// mode: the keyboard grid renders one axis at a time. Single-select axes
// advance immediately on a pick; multi-select axes (e.g., Coffee > Extras)
// track an in-progress array in `pendingExtras` and advance when the user
// presses Done.
export type ConfiguratorPick = { axisName: string; option: string | string[] };
export type ConfiguratorView = {
  path: Path;
  cellIdx: number;
  axisIdx: number;
  picks: ConfiguratorPick[];
  pendingExtras: string[];
};

type State = {
  region: Region;
  layout: KeyboardLayout;
  menuPath: Path;
  selection: Selection;
  products: Record<string, Product>;
  catalogLoaded: boolean;
  configurator: ConfiguratorView | null;

  // mutations
  setRegion: (r: Region) => void;
  setLayout: (l: KeyboardLayout) => void;
  newLayoutFromTaxonomy: (name: string, region: Region, products: Product[]) => void;
  newLayoutBlank: (name: string, region: Region) => void;
  setProducts: (region: Region, products: Product[]) => void;

  enterMenu: (index: number) => void;
  ascend: () => void;
  goToPath: (path: Path) => void;

  enterConfigurator: (path: Path, cellIdx: number) => void;
  pickConfiguratorOption: (option: string) => void;
  confirmConfiguratorAxis: () => void;
  exitConfigurator: () => void;

  select: (index: number | null) => void;
  placeProduct: (index: number, productId: string) => void;
  moveCell: (fromIndex: number, toIndex: number) => void;
  removeCell: (index: number) => void;
  wrapCellAsSubmenu: (index: number, label: string) => boolean;
  setLabel: (index: number, label: string) => void;
  setColor: (index: number, color: string | undefined) => void;
};

function currentMenu(state: State): Menu {
  return getMenuAt(state.layout.root, state.menuPath);
}

export const useBuilder = create<State>()(
  temporal(
    (set, get) => ({
      region: "NZ",
      layout: emptyLayout("New Keyboard", "NZ"),
      menuPath: [],
      selection: { kind: "none" },
      products: {},
      catalogLoaded: false,
      configurator: null,

      setRegion: (r) => set({ region: r }),

      setLayout: (l) =>
        set({
          layout: l,
          menuPath: [],
          selection: { kind: "none" },
          configurator: null,
        }),

      newLayoutFromTaxonomy: (name, region, products) => {
        const root = seedFromTaxonomy(products, name);
        set({
          layout: {
            id: newId("l"),
            name,
            region,
            kind: "main",
            root,
            updatedAt: new Date().toISOString(),
          },
          menuPath: [],
          selection: { kind: "none" },
          configurator: null,
        });
      },

      newLayoutBlank: (name, region) =>
        set({
          layout: emptyLayout(name, region),
          menuPath: [],
          selection: { kind: "none" },
          configurator: null,
        }),

      setProducts: (region, products) => {
        const byId: Record<string, Product> = {};
        for (const p of products) byId[p.id] = p;
        set({ region, products: byId, catalogLoaded: true });
      },

      enterMenu: (index) => {
        const m = currentMenu(get());
        const cell = m.cells[index];
        if (cell.kind !== "submenu") return;
        set((s) => ({ menuPath: [...s.menuPath, index], selection: { kind: "none" } }));
      },

      ascend: () => {
        const s = get();
        // While in a configurator wizard, ascend pops one pick. If the
        // current multi-select axis has unconfirmed toggles, clear them
        // first so the user can step back cleanly. Popping past the first
        // axis exits the wizard back to the parent menu.
        if (s.configurator) {
          if (s.configurator.pendingExtras.length > 0) {
            set({ configurator: { ...s.configurator, pendingExtras: [] } });
            return;
          }
          if (s.configurator.picks.length === 0 && s.configurator.axisIdx === 0) {
            set({ configurator: null });
            return;
          }
          set({
            configurator: {
              ...s.configurator,
              axisIdx: Math.max(0, s.configurator.axisIdx - 1),
              picks: s.configurator.picks.slice(0, -1),
              pendingExtras: [],
            },
          });
          return;
        }
        if (s.menuPath.length === 0) return;
        set({ menuPath: s.menuPath.slice(0, -1), selection: { kind: "none" } });
      },

      goToPath: (path) =>
        set({ menuPath: path, selection: { kind: "none" }, configurator: null }),

      enterConfigurator: (path, cellIdx) =>
        set({
          configurator: {
            path,
            cellIdx,
            axisIdx: 0,
            picks: [],
            pendingExtras: [],
          },
          selection: { kind: "none" },
        }),

      pickConfiguratorOption: (option) => {
        const s = get();
        if (!s.configurator) return;
        const menu = getMenuAt(s.layout.root, s.configurator.path);
        const cell = menu.cells[s.configurator.cellIdx];
        if (cell.kind !== "configurator") return;
        const axis = cell.axes[s.configurator.axisIdx];
        if (!axis) return;

        if (axis.multiSelect) {
          // Toggle in the pending list without advancing the axis.
          const idx = s.configurator.pendingExtras.indexOf(option);
          const next =
            idx >= 0
              ? s.configurator.pendingExtras.filter((_, i) => i !== idx)
              : [...s.configurator.pendingExtras, option];
          set({
            configurator: { ...s.configurator, pendingExtras: next },
          });
          return;
        }

        // Single-select: push pick + advance.
        const nextPicks = [
          ...s.configurator.picks,
          { axisName: axis.name, option } as ConfiguratorPick,
        ];
        const nextAxisIdx = s.configurator.axisIdx + 1;
        if (nextAxisIdx >= cell.axes.length) {
          if (typeof console !== "undefined") {
            console.log("[configurator] picked:", nextPicks);
          }
          set({ configurator: null });
          return;
        }
        set({
          configurator: {
            ...s.configurator,
            axisIdx: nextAxisIdx,
            picks: nextPicks,
            pendingExtras: [],
          },
        });
      },

      confirmConfiguratorAxis: () => {
        const s = get();
        if (!s.configurator) return;
        const menu = getMenuAt(s.layout.root, s.configurator.path);
        const cell = menu.cells[s.configurator.cellIdx];
        if (cell.kind !== "configurator") return;
        const axis = cell.axes[s.configurator.axisIdx];
        if (!axis || !axis.multiSelect) return;
        const nextPicks = [
          ...s.configurator.picks,
          {
            axisName: axis.name,
            option: [...s.configurator.pendingExtras],
          } as ConfiguratorPick,
        ];
        const nextAxisIdx = s.configurator.axisIdx + 1;
        if (nextAxisIdx >= cell.axes.length) {
          if (typeof console !== "undefined") {
            console.log("[configurator] picked:", nextPicks);
          }
          set({ configurator: null });
          return;
        }
        set({
          configurator: {
            ...s.configurator,
            axisIdx: nextAxisIdx,
            picks: nextPicks,
            pendingExtras: [],
          },
        });
      },

      exitConfigurator: () => set({ configurator: null }),

      select: (index) =>
        set((s) => ({
          selection:
            index == null
              ? { kind: "none" }
              : { kind: "cell", path: s.menuPath, index },
        })),

      placeProduct: (index, productId) =>
        set((s) => ({
          layout: produce(s.layout, (draft) => {
            const m = getMenuAt(draft.root, s.menuPath);
            m.cells[index] = { kind: "product", productId };
            draft.updatedAt = new Date().toISOString();
          }),
        })),

      moveCell: (fromIndex, toIndex) =>
        set((s) => ({
          layout: produce(s.layout, (draft) => {
            const m = getMenuAt(draft.root, s.menuPath);
            if (fromIndex === toIndex) return;
            const a = m.cells[fromIndex];
            const b = m.cells[toIndex];
            m.cells[toIndex] = a;
            m.cells[fromIndex] = b;
            draft.updatedAt = new Date().toISOString();
          }),
        })),

      removeCell: (index) =>
        set((s) => ({
          layout: produce(s.layout, (draft) => {
            const m = getMenuAt(draft.root, s.menuPath);
            m.cells[index] = { kind: "empty" };
            draft.updatedAt = new Date().toISOString();
          }),
        })),

      wrapCellAsSubmenu: (index, label) => {
        const s = get();
        const m = currentMenu(s);
        if (m.depth >= MAX_DEPTH) return false;
        const existing = m.cells[index];
        set({
          layout: produce(s.layout, (draft) => {
            const dm = getMenuAt(draft.root, s.menuPath);
            const sub: Menu = emptyMenu(label, dm.depth + 1);
            if (existing.kind !== "empty") sub.cells[0] = existing as Cell;
            dm.cells[index] = { kind: "submenu", menu: sub };
            draft.updatedAt = new Date().toISOString();
          }),
        });
        return true;
      },

      setLabel: (index, label) =>
        set((s) => ({
          layout: produce(s.layout, (draft) => {
            const m = getMenuAt(draft.root, s.menuPath);
            const c = m.cells[index];
            if (c.kind === "submenu") c.menu.label = label;
            else if (c.kind === "product" || c.kind === "configurator")
              c.labelOverride = label;
            draft.updatedAt = new Date().toISOString();
          }),
        })),

      setColor: (index, color) =>
        set((s) => ({
          layout: produce(s.layout, (draft) => {
            const m = getMenuAt(draft.root, s.menuPath);
            const c = m.cells[index];
            if (c.kind === "submenu") c.menu.color = color;
            else if (c.kind === "product" || c.kind === "configurator")
              c.colorOverride = color;
            draft.updatedAt = new Date().toISOString();
          }),
        })),
    }),
    {
      // Don't include selection/path/catalog in undo history — only the layout itself.
      partialize: (state) => ({ layout: state.layout }),
      limit: 100,
      handleSet: (handleSet) => (state) => handleSet(state),
    },
  ),
);

// Selectors
export const selectCurrentMenu = (s: State): Menu =>
  getMenuAt(s.layout.root, s.menuPath);

export const selectCanGoDeeper = (s: State): boolean => {
  const m = tryGetMenuAt(s.layout.root, s.menuPath);
  return m !== null && m.depth < MAX_DEPTH;
};

export const selectFirstEmpty = (s: State): number => {
  const m = tryGetMenuAt(s.layout.root, s.menuPath);
  return m ? findFirstEmptyIndex(m) : -1;
};

// Access to undo/redo via zundo. We re-export with friendlier names.
export const useBuilderUndo = () => useBuilder.temporal.getState().undo;
export const useBuilderRedo = () => useBuilder.temporal.getState().redo;

export const CELLS = CELLS_PER_MENU;
