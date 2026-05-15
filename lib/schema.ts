import { z } from "zod";

export const GRID = { rows: 6, cols: 8 } as const;
export const CELLS_PER_MENU = GRID.rows * GRID.cols;
export const MAX_DEPTH = 5;

export const REGIONS = ["AU", "NZ"] as const;
export type Region = (typeof REGIONS)[number];

export const ProductSchema = z.object({
  id: z.string(),
  sku: z.string(),
  barcode: z.string().optional().nullable(),
  name: z.string(),
  shortName: z.string(),
  price: z.number().int(),
  cost: z.number().int().optional().nullable(),
  vatRatePct: z.number(),
  department: z.string(),
  category: z.string(),
  subCategory: z.string(),
  bmc: z.string(),
  brand: z.string().optional().nullable(),
  region: z.enum(REGIONS),
  active: z.boolean(),
  ageRestricted: z.boolean().optional().default(false),
  color: z.string().optional().nullable(),
});
export type Product = z.infer<typeof ProductSchema>;

const EmptyCellSchema = z.object({ kind: z.literal("empty") });
const ProductCellSchema = z.object({
  kind: z.literal("product"),
  productId: z.string(),
  labelOverride: z.string().optional(),
  colorOverride: z.string().optional(),
  imageUrl: z.string().optional(),
});

export const ConfiguratorAxisSchema = z.object({
  name: z.string(),
  options: z.array(
    z.object({
      label: z.string(),
      productId: z.string().optional(),
    }),
  ),
  // When true, the wizard renders this axis as a toggle grid — the user picks
  // any number of options and confirms with a Done button before advancing.
  multiSelect: z.boolean().optional(),
});

const ConfiguratorCellSchema = z.object({
  kind: z.literal("configurator"),
  label: z.string(),
  axes: z.array(ConfiguratorAxisSchema),
  labelOverride: z.string().optional(),
  colorOverride: z.string().optional(),
  imageUrl: z.string().optional(),
});

export const MenuSchema: z.ZodType<Menu> = z.lazy(() =>
  z.object({
    id: z.string(),
    label: z.string(),
    color: z.string().optional(),
    depth: z.number().int().min(1).max(MAX_DEPTH),
    cells: z.array(CellSchema).length(CELLS_PER_MENU),
  }),
);

const SubmenuCellSchema = z.object({
  kind: z.literal("submenu"),
  menu: MenuSchema,
});

export const CellSchema = z.discriminatedUnion("kind", [
  EmptyCellSchema,
  ProductCellSchema,
  ConfiguratorCellSchema,
  SubmenuCellSchema,
]);

export type EmptyCell = z.infer<typeof EmptyCellSchema>;
export type ProductCell = z.infer<typeof ProductCellSchema>;
export type ConfiguratorAxis = z.infer<typeof ConfiguratorAxisSchema>;
export type ConfiguratorCell = z.infer<typeof ConfiguratorCellSchema>;
export type SubmenuCell = { kind: "submenu"; menu: Menu };
export type Cell = EmptyCell | ProductCell | ConfiguratorCell | SubmenuCell;
export type Menu = {
  id: string;
  label: string;
  color?: string;
  depth: number;
  cells: Cell[];
};

export const LAYOUT_KINDS = ["main", "hotkeys"] as const;
export type LayoutKind = (typeof LAYOUT_KINDS)[number];

export const KeyboardLayoutSchema = z.object({
  id: z.string(),
  name: z.string(),
  region: z.enum(REGIONS),
  kind: z.enum(LAYOUT_KINDS).default("main"),
  root: MenuSchema,
  updatedAt: z.string(),
});
export type KeyboardLayout = z.infer<typeof KeyboardLayoutSchema>;
