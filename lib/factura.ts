import { convertirAUnidadCompra } from "./conversion";
import type { BorradorFactura, Factura, FacturaItem, InventoryIngredient } from "./types";

/** Fecha de hoy en la zona del dispositivo (no UTC), como AAAA-MM-DD. */
export function hoyLocal(d: Date = new Date()): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function palabras(s: string): string[] {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[^a-z0-9ñ]+/)
    .filter(Boolean);
}

/**
 * Ingrediente del inventario al que probablemente se refiere un ítem de
 * factura: todas las palabras del ingrediente tienen que estar en el nombre
 * del ítem ("Arroz selecto 125lb" → "Arroz selecto"; "Salami" no es "Sal").
 * Si varios encajan, gana el más específico.
 */
export function sugerirIngrediente(
  nombreItem: string,
  inventario: InventoryIngredient[],
): string | undefined {
  const delItem = new Set(palabras(nombreItem));
  if (delItem.size === 0) return undefined;
  let mejor: { id: string; peso: number } | undefined;
  for (const ing of inventario) {
    const delIng = palabras(ing.nombre);
    if (delIng.length === 0 || !delIng.every((p) => delItem.has(p))) continue;
    if (!mejor || delIng.length > mejor.peso) mejor = { id: ing.id, peso: delIng.length };
  }
  return mejor?.id;
}

/**
 * Cuánto suma un ítem al stock de `ing`, en su unidad de compra. Sin unidad
 * en el ítem se asume la de compra. `null` si las unidades no se pueden
 * convertir (ej. "saco" para algo que se lleva en lb sin equivalencia).
 */
export function cantidadParaStock(
  item: Pick<FacturaItem, "cantidad" | "unidad">,
  ing: InventoryIngredient,
): number | null {
  try {
    const n = convertirAUnidadCompra(ing, item.cantidad, item.unidad ?? ing.unidadCompra);
    return Math.round(n * 1000) / 1000;
  } catch {
    return null;
  }
}

/**
 * Deja en cada ítem vinculado la cantidad que va a sumar al stock, para que
 * al borrar la factura se reste exactamente lo mismo.
 */
export function prepararItems(items: FacturaItem[], inventario: InventoryIngredient[]): FacturaItem[] {
  return items.map((it) => {
    const ing = it.ingredientId ? inventario.find((i) => i.id === it.ingredientId) : undefined;
    if (!ing) return { ...it, cantidadStock: undefined };
    return { ...it, cantidadStock: cantidadParaStock(it, ing) ?? undefined };
  });
}

/** Lo que un ítem ya registrado sumó (o resta al borrar). Facturas viejas no traen `cantidadStock`. */
function aporte(it: FacturaItem): number {
  return it.cantidadStock ?? it.cantidad;
}

/** Inventario con los ítems de la factura sumados (`signo` 1) o revertidos (`signo` -1). */
export function aplicarAlStock(
  inventario: InventoryIngredient[],
  items: FacturaItem[],
  signo: 1 | -1,
): InventoryIngredient[] {
  return inventario.map((ing) => {
    const suma = items
      .filter((it) => it.ingredientId === ing.id)
      .reduce((acc, it) => acc + aporte(it), 0);
    if (!suma) return ing;
    return { ...ing, stock: Math.round((ing.stock + signo * suma) * 1000) / 1000 };
  });
}

const normalizarNcf = (s?: string) => (s ?? "").replace(/[^a-z0-9]/gi, "").toUpperCase();
const normalizarRnc = (s?: string) => (s ?? "").replace(/\D/g, "");

/**
 * Factura ya registrada con el mismo NCF del mismo suplidor. Un NCF no se
 * repite, así que registrarla otra vez sumaría el stock dos veces.
 */
export function buscarDuplicada(
  borrador: Pick<BorradorFactura, "ncf" | "rnc" | "proveedor">,
  facturas: Factura[],
): Factura | undefined {
  const ncf = normalizarNcf(borrador.ncf);
  if (!ncf) return undefined;
  const rnc = normalizarRnc(borrador.rnc);
  const proveedor = borrador.proveedor.trim().toLowerCase();
  return facturas.find((f) => {
    if (normalizarNcf(f.ncf) !== ncf) return false;
    const otroRnc = normalizarRnc(f.rnc);
    if (rnc && otroRnc) return rnc === otroRnc;
    return f.proveedor.trim().toLowerCase() === proveedor;
  });
}

export interface EntradaFactura {
  proveedor: string;
  fecha: string;
  rnc: string;
  ncf: string;
  items: FacturaItem[];
}

export interface ErroresItem {
  nombre?: string;
  cantidad?: string;
  unidad?: string;
  precio?: string;
}

export interface ErroresFactura {
  proveedor?: string;
  fecha?: string;
  rnc?: string;
  ncf?: string;
  items?: string;
  porItem: Record<number, ErroresItem>;
}

/** Una fila que el usuario no llegó a tocar (sin nombre ni precio) no cuenta. */
export const itemVacio = (it: FacturaItem) => it.nombre.trim() === "" && !(it.precioUnitario > 0);

export function hayErrores(e: ErroresFactura): boolean {
  return Boolean(e.proveedor || e.fecha || e.rnc || e.ncf || e.items || Object.keys(e.porItem).length);
}

export function validarFactura(
  f: EntradaFactura,
  inventario: InventoryIngredient[],
  facturas: Factura[],
  hoy: string = hoyLocal(),
): ErroresFactura {
  const e: ErroresFactura = { porItem: {} };

  if (!f.proveedor.trim()) e.proveedor = "Escribe a quién le compraste.";

  if (!/^\d{4}-\d{2}-\d{2}$/.test(f.fecha)) e.fecha = "Pon la fecha de la factura.";
  else if (f.fecha > hoy) e.fecha = "La fecha no puede ser después de hoy.";

  const digitosRnc = f.rnc.replace(/\D/g, "").length;
  if (f.rnc.trim() && digitosRnc !== 9 && digitosRnc !== 11) {
    e.rnc = "El RNC lleva 9 dígitos (11 si es cédula).";
  }

  const ncf = normalizarNcf(f.ncf);
  if (ncf && !/^(B\d{10}|E\d{12})$/.test(ncf)) {
    e.ncf = "El NCF es B + 10 dígitos (o E + 12 si es electrónico).";
  } else if (ncf && buscarDuplicada(f, facturas)) {
    e.ncf = "Ya registraste esta factura. Guardarla otra vez sumaría el stock dos veces.";
  }

  let conDatos = 0;
  f.items.forEach((it, i) => {
    if (itemVacio(it)) return;
    conDatos++;
    const ei: ErroresItem = {};
    if (!it.nombre.trim()) ei.nombre = "Ponle nombre al producto.";
    if (!(it.cantidad > 0)) ei.cantidad = "Tiene que ser mayor que 0.";
    if (!(it.precioUnitario > 0)) ei.precio = "Falta el precio.";
    const ing = it.ingredientId ? inventario.find((x) => x.id === it.ingredientId) : undefined;
    if (ing && it.unidad && cantidadParaStock(it, ing) === null) {
      ei.unidad = `No sé cuántas ${ing.unidadCompra} trae un ${it.unidad}: cambia la unidad o define la equivalencia en Inventario.`;
    }
    if (Object.keys(ei).length) e.porItem[i] = ei;
  });
  if (conDatos === 0) e.items = "Agrega al menos un producto.";

  return e;
}
