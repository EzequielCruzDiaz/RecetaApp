import { esPeso, esPieza, esVolumen, UNIT_INFO } from "./units";
import type { BorradorInventoryIngredient, InventoryIngredient, Receta } from "./types";

/** Para comparar nombres sin que importen mayúsculas, tildes ni espacios de más. */
export function claveNombre(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ");
}

export const sinErrores = (e: object) =>
  Object.values(e).every((v) => (v && typeof v === "object" ? Object.keys(v).length === 0 : !v));

export interface ErroresIngrediente {
  nombre?: string;
  precioCompra?: string;
  equivalencia?: string;
}

export function validarIngrediente(
  b: BorradorInventoryIngredient,
  inventario: InventoryIngredient[],
  idActual?: string,
): ErroresIngrediente {
  const e: ErroresIngrediente = {};

  if (!b.nombre.trim()) e.nombre = "Ponle nombre al ingrediente.";
  else if (inventario.some((i) => i.id !== idActual && claveNombre(i.nombre) === claveNombre(b.nombre))) {
    e.nombre = "Ya tienes un ingrediente con ese nombre.";
  }

  if (!(b.precioCompra > 0)) e.precioCompra = `Pon a cómo compras cada ${UNIT_INFO[b.unidadCompra].label}.`;

  const eq = b.equivalencia;
  if (eq) {
    const base = UNIT_INFO[eq.unidadBase].label;
    const compra = b.unidadCompra;
    if (!(eq.cantidad > 0)) {
      e.equivalencia = `Pon cuántos ${base} trae 1 ${eq.unidadPieza}.`;
    } else if ((esPeso(compra) && !esPeso(eq.unidadBase)) || (esVolumen(compra) && !esVolumen(eq.unidadBase))) {
      e.equivalencia = `Lo compras en ${UNIT_INFO[compra].label}: la equivalencia tiene que ser en ${
        esPeso(compra) ? "peso (g o kg)" : "volumen (ml o L)"
      }.`;
    } else if (esPieza(compra) && eq.unidadPieza !== compra) {
      e.equivalencia = `Lo compras por ${compra}: la equivalencia tiene que ser de 1 ${compra}.`;
    }
  }

  return e;
}

export interface ItemRecetaAValidar {
  ingredientId: string;
  nombre: string;
  cantidad: number;
  alGusto: boolean;
  /** Error de conversión de unidades, si lo hay. */
  error: string | null;
}

export interface ErroresReceta {
  nombre?: string;
  porciones?: string;
  ingredientes?: string;
  porItem: Record<string, string>;
}

export function validarReceta(
  r: { nombre: string; porciones: number; items: ItemRecetaAValidar[] },
  recetas: Receta[],
  idActual?: string,
): ErroresReceta {
  const e: ErroresReceta = { porItem: {} };

  if (!r.nombre.trim()) e.nombre = "Ponle nombre a la receta.";
  else if (recetas.some((x) => x.id !== idActual && claveNombre(x.nombre) === claveNombre(r.nombre))) {
    e.nombre = "Ya tienes una receta con ese nombre.";
  }

  if (!(r.porciones >= 1)) e.porciones = "Tiene que rendir al menos 1.";

  if (r.items.length === 0) e.ingredientes = "Agrega al menos un ingrediente.";

  for (const it of r.items) {
    if (it.alGusto) continue;
    if (it.error) e.porItem[it.ingredientId] = it.error;
    else if (!(it.cantidad > 0)) e.porItem[it.ingredientId] = "Pon cuánto lleva, o márcalo al gusto.";
  }

  return e;
}
