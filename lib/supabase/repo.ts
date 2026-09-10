import type {
  BorradorFactura,
  BorradorInventoryIngredient,
  Factura,
  FacturaItem,
  InventoryIngredient,
  Receta,
  RecetaIngrediente,
  Unit,
  UnitCategory,
} from "@/lib/types";
import type { Database, Json } from "./database.types";
import { getSupabase } from "./client";

type IngRow = Database["public"]["Tables"]["inventory_ingredients"]["Row"];
type RecetaRow = Database["public"]["Tables"]["recipes"]["Row"];
type RecetaIngRow = Database["public"]["Tables"]["recipe_ingredients"]["Row"];
type FacturaRow = Database["public"]["Tables"]["invoices"]["Row"];
type FacturaItemRow = Database["public"]["Tables"]["invoice_items"]["Row"];

// ── Mappers row → tipo de dominio ─────────────────────────────

function aIngrediente(r: IngRow): InventoryIngredient {
  return {
    id: r.id,
    nombre: r.nombre,
    categoria: r.categoria as UnitCategory,
    unidadCompra: r.unidad_compra as Unit,
    precioCompra: Number(r.precio_compra),
    stock: Number(r.stock),
    stockMinimo: Number(r.stock_minimo),
    equivalencia:
      (r.equivalencia as InventoryIngredient["equivalencia"] | null) ?? undefined,
  };
}

function aRecetaIngrediente(r: RecetaIngRow): RecetaIngrediente {
  return {
    ingredientId: r.ingredient_id ?? "",
    cantidad: r.cantidad === null ? null : Number(r.cantidad),
    unidad: (r.unidad as Unit | null) ?? null,
    alGusto: r.al_gusto,
  };
}

function aReceta(r: RecetaRow & { recipe_ingredients: RecetaIngRow[] }): Receta {
  return {
    id: r.id,
    nombre: r.nombre,
    categoria: r.categoria ?? undefined,
    porciones: Number(r.porciones),
    unidadRendimiento: r.unidad_rendimiento ?? undefined,
    ingredientes: [...r.recipe_ingredients]
      .sort((a, b) => a.orden - b.orden)
      .map(aRecetaIngrediente),
  };
}

function aFacturaItem(r: FacturaItemRow): FacturaItem {
  return {
    nombre: r.nombre,
    cantidad: Number(r.cantidad),
    unidad: (r.unidad as Unit | null) ?? null,
    precioUnitario: Number(r.precio_unitario),
    ingredientId: r.ingredient_id ?? undefined,
  };
}

function aFactura(r: FacturaRow & { invoice_items: FacturaItemRow[] }): Factura {
  return {
    id: r.id,
    proveedor: r.proveedor,
    fecha: r.fecha,
    rnc: r.rnc ?? undefined,
    ncf: r.ncf ?? undefined,
    itbis: Number(r.itbis),
    total: Number(r.total),
    aplicadaAlInventario: r.aplicada_al_inventario,
    items: (r.invoice_items ?? []).map(aFacturaItem),
  };
}

// ── Inventario ───────────────────────────────────────────────

export async function fetchInventario(): Promise<InventoryIngredient[]> {
  const { data, error } = await getSupabase()
    .from("inventory_ingredients")
    .select("*")
    .order("nombre");
  if (error) throw error;
  return (data ?? []).map(aIngrediente);
}

export async function crearIngrediente(
  b: BorradorInventoryIngredient,
): Promise<InventoryIngredient> {
  const { data, error } = await getSupabase()
    .from("inventory_ingredients")
    .insert({
      nombre: b.nombre,
      categoria: b.categoria,
      unidad_compra: b.unidadCompra,
      precio_compra: b.precioCompra,
      stock: b.stock,
      stock_minimo: b.stockMinimo,
      equivalencia: (b.equivalencia ?? null) as Json | null,
    })
    .select()
    .single();
  if (error) throw error;
  return aIngrediente(data);
}

export async function actualizarIngrediente(
  id: string,
  patch: Partial<InventoryIngredient>,
): Promise<void> {
  const row: Database["public"]["Tables"]["inventory_ingredients"]["Update"] = {};
  if (patch.nombre !== undefined) row.nombre = patch.nombre;
  if (patch.categoria !== undefined) row.categoria = patch.categoria;
  if (patch.unidadCompra !== undefined) row.unidad_compra = patch.unidadCompra;
  if (patch.precioCompra !== undefined) row.precio_compra = patch.precioCompra;
  if (patch.stock !== undefined) row.stock = patch.stock;
  if (patch.stockMinimo !== undefined) row.stock_minimo = patch.stockMinimo;
  if (patch.equivalencia !== undefined) {
    row.equivalencia = (patch.equivalencia ?? null) as Json | null;
  }

  const { error } = await getSupabase()
    .from("inventory_ingredients")
    .update(row)
    .eq("id", id);
  if (error) throw error;
}

export async function borrarIngrediente(id: string): Promise<void> {
  const { error } = await getSupabase().from("inventory_ingredients").delete().eq("id", id);
  if (error) throw error;
}

// ── Recetas ──────────────────────────────────────────────────

export async function fetchRecetas(): Promise<Receta[]> {
  const { data, error } = await getSupabase()
    .from("recipes")
    .select("*, recipe_ingredients(*)")
    .order("nombre");
  if (error) throw error;
  return ((data ?? []) as unknown as (RecetaRow & { recipe_ingredients: RecetaIngRow[] })[]).map(
    aReceta,
  );
}

export async function guardarReceta(r: Receta): Promise<void> {
  const { error } = await getSupabase().rpc("guardar_receta", {
    p_id: r.id,
    p_nombre: r.nombre,
    p_categoria: r.categoria ?? null,
    p_porciones: r.porciones,
    p_unidad_rendimiento: r.unidadRendimiento ?? "porciones",
    p_ingredientes: r.ingredientes.map((ri, i) => ({
      ingredient_id: ri.ingredientId,
      cantidad: ri.cantidad,
      unidad: ri.unidad,
      al_gusto: ri.alGusto,
      orden: i,
    })) as unknown as Json,
  });
  if (error) throw error;
}

export async function borrarReceta(id: string): Promise<void> {
  const { error } = await getSupabase().from("recipes").delete().eq("id", id);
  if (error) throw error;
}

// ── Facturas ─────────────────────────────────────────────────

export async function fetchFacturas(): Promise<Factura[]> {
  const { data, error } = await getSupabase()
    .from("invoices")
    .select("*, invoice_items(*)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as unknown as (FacturaRow & { invoice_items: FacturaItemRow[] })[]).map(
    aFactura,
  );
}

export async function crearFactura(b: BorradorFactura): Promise<void> {
  const { error } = await getSupabase().rpc("crear_factura", {
    p_proveedor: b.proveedor,
    p_fecha: b.fecha,
    p_rnc: b.rnc ?? null,
    p_ncf: b.ncf ?? null,
    p_itbis: b.itbis,
    p_total: b.total,
    p_items: b.items.map((it) => ({
      nombre: it.nombre,
      cantidad: it.cantidad,
      unidad: it.unidad,
      precio_unitario: it.precioUnitario,
      ingredient_id: it.ingredientId ?? null,
    })) as unknown as Json,
  });
  if (error) throw error;
}
