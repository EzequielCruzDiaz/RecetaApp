/**
 * Lecturas de facturas (por IA o por OCR) y cómo se juntan en el borrador.
 *
 * Se pueden subir varias facturas para una misma compra: los productos de
 * cada una se agregan debajo de los anteriores marcados con su `origen`, y
 * al quitar la foto se van exactamente esos productos.
 */
import type { CamposFacturaOCR } from "./factura-ocr";
import type { FacturaItem, Unit } from "./types";

export type MotorLectura = "ia" | "ocr";

export interface LecturaFactura {
  id: string;
  /** URL local de la foto (`URL.createObjectURL`), solo para la miniatura. */
  foto: string;
  motor: MotorLectura;
  campos: CamposFacturaOCR;
}

/** Ítem del formulario: el de la factura más de qué foto vino y si hay que revisarlo. */
export interface ItemBorrador extends FacturaItem {
  origen?: string;
  dudoso?: boolean;
}

export type CampoEncabezado = "proveedor" | "fecha" | "rnc" | "ncf";
export type Encabezado = Record<CampoEncabezado, string>;
const CAMPOS_ENCABEZADO: CampoEncabezado[] = ["proveedor", "fecha", "rnc", "ncf"];

const filaSinTocar = (it: FacturaItem) => it.nombre.trim() === "" && !(it.precioUnitario > 0);

/** Agrega los productos de la lectura debajo de los que ya están (la fila vacía inicial se va). */
export function agregarLectura(items: ItemBorrador[], lectura: LecturaFactura): ItemBorrador[] {
  const dudosos = new Set(lectura.campos.itemsDudosos ?? []);
  const nuevos = lectura.campos.items.map((it, i) => ({
    ...it,
    origen: lectura.id,
    dudoso: dudosos.has(i) || undefined,
  }));
  return [...items.filter((it) => it.origen || !filaSinTocar(it)), ...nuevos];
}

/** El ítem tal como se guarda, sin las marcas del formulario. */
export function aItemFactura(it: ItemBorrador): FacturaItem {
  const { nombre, cantidad, unidad, precioUnitario, ingredientId, cantidadStock } = it;
  return { nombre, cantidad, unidad, precioUnitario, ingredientId, cantidadStock };
}

/** Quita los productos que vinieron de esa foto; los escritos a mano se quedan. */
export function quitarLectura(items: ItemBorrador[], id: string): ItemBorrador[] {
  return items.filter((it) => it.origen !== id);
}

/** Completa solo los campos que siguen vacíos, para no pisar lo que ya se escribió. */
export function completarEncabezado(actual: Encabezado, campos: CamposFacturaOCR): Encabezado {
  const sig = { ...actual };
  for (const c of CAMPOS_ENCABEZADO) {
    if (!sig[c].trim() && campos[c]) sig[c] = campos[c]!;
  }
  return sig;
}

/**
 * Al quitar una factura, los campos que salieron de ella pasan a la siguiente
 * que tenga el dato; lo que el usuario cambió a mano se respeta.
 */
export function encabezadoSin(
  actual: Encabezado,
  quitada: LecturaFactura,
  restantes: LecturaFactura[],
  hoy: string,
): Encabezado {
  const sig = { ...actual };
  for (const c of CAMPOS_ENCABEZADO) {
    if (!quitada.campos[c] || sig[c] !== quitada.campos[c]) continue;
    sig[c] = restantes.find((l) => l.campos[c])?.campos[c] ?? (c === "fecha" ? hoy : "");
  }
  return sig;
}

/** Total pagado de una factura; si no se ve, subtotal menos descuentos. */
function totalDe(c: CamposFacturaOCR): number | undefined {
  if (c.total != null) return c.total;
  if (c.subtotal != null) return c.subtotal - (c.descuento ?? 0);
  return undefined;
}

/** ITBIS, descuento y total de la compra: la suma de lo leído en cada factura. */
export function totalesDe(lecturas: LecturaFactura[]): { itbis: number; descuento: number; total: number | null } {
  const itbis = lecturas.reduce((acc, l) => acc + (l.campos.itbis ?? 0), 0);
  const descuento = lecturas.reduce((acc, l) => acc + (l.campos.descuento ?? 0), 0);
  const totales = lecturas.map((l) => totalDe(l.campos));
  const total =
    lecturas.length > 0 && totales.every((t) => t != null) ? totales.reduce((a, t) => a! + t!, 0)! : null;
  return { itbis: redondear(itbis), descuento: redondear(descuento), total: total == null ? null : redondear(total) };
}

const redondear = (n: number) => Math.round(n * 100) / 100;

/** Margen para redondeos de centavos en facturas largas. */
const tolerancia = (total: number) => Math.max(1, Math.abs(total) * 0.005);

/**
 * ¿El total cuadra con los productos? En el súper los precios ya traen el
 * ITBIS (total = suma − descuentos); en el colmado o el distribuidor se
 * suma aparte (total = suma + ITBIS − descuentos). Cualquiera de las dos vale.
 */
export function cuadraTotal(subtotal: number, itbis: number, total: number, descuento = 0): boolean {
  const t = tolerancia(total);
  const neto = subtotal - descuento;
  return Math.abs(total - neto) <= t || Math.abs(total - (neto + itbis)) <= t;
}

export interface Cuadre {
  suma: number;
  /** Contra qué se comparó: el total a pagar o, si no se ve, el subtotal impreso. */
  contra?: "total" | "subtotal";
  monto?: number;
  /** `null` si la factura no trae total ni subtotal legible. */
  cuadra: boolean | null;
}

export function cuadreLectura(campos: CamposFacturaOCR): Cuadre {
  const suma = redondear(campos.items.reduce((acc, it) => acc + it.cantidad * it.precioUnitario, 0));
  if (campos.total != null && campos.total > 0) {
    const cuadra = cuadraTotal(suma, campos.itbis ?? 0, campos.total, campos.descuento ?? 0);
    return { suma, contra: "total", monto: campos.total, cuadra };
  }
  // Ticket cortado o fotocopiado sin el final: el subtotal es la suma de los importes.
  if (campos.subtotal != null && campos.subtotal > 0) {
    return { suma, contra: "subtotal", monto: campos.subtotal, cuadra: cuadraTotal(suma, 0, campos.subtotal) };
  }
  return { suma, cuadra: null };
}

/**
 * ¿Conviene volver a leer la factura con un modelo más fuerte? Cuando no
 * salió ningún producto, los productos no cuadran con el total o hay
 * muchos marcados como dudosos.
 */
export function necesitaRespaldo(campos: CamposFacturaOCR): boolean {
  const n = campos.items.length;
  if (n === 0) return true;
  if (cuadreLectura(campos).cuadra === false) return true;
  return (campos.itemsDudosos?.length ?? 0) * 3 > n;
}

// ── Respuesta del modelo de visión ──────────────────────────────────────

/** Unidades que se le ofrecen al modelo; el resto del catálogo no aparece en facturas. */
export const UNIDADES_FACTURA = [
  "lb", "kg", "g", "oz", "L", "ml", "galon", "unidad", "docena", "paquete", "caja", "saco", "lata", "atado",
] as const satisfies readonly Unit[];

const nulo = { type: "null" } as const;
const texto = { anyOf: [{ type: "string" }, nulo] } as const;
const numero = { anyOf: [{ type: "number" }, nulo] } as const;

/** JSON Schema de la salida estructurada que se le pide al modelo. */
export const ESQUEMA_LECTURA = {
  type: "object",
  additionalProperties: false,
  required: [
    "proveedor",
    "rnc",
    "ncf",
    "fecha",
    "items",
    "subtotal",
    "descuento",
    "itbis",
    "total",
    "camposDudosos",
    "dudas",
  ],
  properties: {
    proveedor: texto,
    rnc: texto,
    ncf: texto,
    fecha: texto,
    items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["nombre", "cantidad", "unidad", "precioUnitario", "importe", "dudoso"],
        properties: {
          nombre: { type: "string" },
          cantidad: { type: "number" },
          unidad: { anyOf: [{ type: "string", enum: [...UNIDADES_FACTURA] }, nulo] },
          precioUnitario: { type: "number" },
          importe: numero,
          dudoso: { type: "boolean" },
        },
      },
    },
    subtotal: numero,
    descuento: numero,
    itbis: numero,
    total: numero,
    camposDudosos: { type: "array", items: { type: "string", enum: ["proveedor", "rnc", "ncf", "fecha", "total"] } },
    dudas: { type: "array", items: { type: "string" } },
  },
} as const;

const esTexto = (v: unknown): v is string => typeof v === "string" && v.trim() !== "";
const esNumero = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

function fechaValida(v: unknown): string | undefined {
  if (!esTexto(v)) return undefined;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v.trim());
  if (!m) return undefined;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (y < 2000 || y > 2100 || mo < 1 || mo > 12 || d < 1 || d > 31) return undefined;
  return v.trim();
}

/**
 * Convierte la respuesta del modelo en campos del formulario. No se confía
 * en el formato: lo que no tenga sentido se descarta o se marca para revisar.
 */
export function normalizarLecturaIA(raw: unknown): CamposFacturaOCR {
  const r = (raw ?? {}) as Record<string, unknown>;
  const items: FacturaItem[] = [];
  const itemsDudosos: number[] = [];

  for (const crudo of Array.isArray(r.items) ? r.items : []) {
    const it = (crudo ?? {}) as Record<string, unknown>;
    if (!esTexto(it.nombre)) continue;
    const cantidad = esNumero(it.cantidad) && it.cantidad > 0 ? it.cantidad : 1;
    let precio = esNumero(it.precioUnitario) && it.precioUnitario > 0 ? it.precioUnitario : 0;
    const importe = esNumero(it.importe) && it.importe > 0 ? it.importe : undefined;
    let dudoso = it.dudoso === true;
    if (!precio && importe) precio = importe / cantidad;
    if (!precio) continue;
    // Si cantidad × precio no da el importe impreso, algo se leyó mal.
    if (importe && Math.abs(cantidad * precio - importe) > Math.max(0.05, importe * 0.01)) {
      // Puso el importe de la línea como precio: el precio es importe ÷ cantidad.
      if (Math.abs(precio - importe) <= 0.01) precio = importe / cantidad;
      else dudoso = true;
    }
    const unidad = (UNIDADES_FACTURA as readonly string[]).includes(it.unidad as string) ? (it.unidad as Unit) : null;
    if (dudoso) itemsDudosos.push(items.length);
    items.push({
      nombre: (it.nombre as string).trim().replace(/\s+/g, " "),
      cantidad: Math.round(cantidad * 1000) / 1000,
      unidad,
      precioUnitario: redondear(precio),
    });
  }

  const rncDigitos = esTexto(r.rnc) ? r.rnc.replace(/\D/g, "") : "";
  const ncf = esTexto(r.ncf) ? r.ncf.replace(/[^a-z0-9]/gi, "").toUpperCase() : "";
  const camposDudosos = (Array.isArray(r.camposDudosos) ? r.camposDudosos : []).filter(
    (c): c is CampoEncabezado | "total" => ["proveedor", "rnc", "ncf", "fecha", "total"].includes(c as string),
  );

  return {
    proveedor: esTexto(r.proveedor) ? r.proveedor.trim().replace(/\s+/g, " ") : undefined,
    rnc: rncDigitos.length === 9 || rncDigitos.length === 11 ? rncDigitos : undefined,
    ncf: /^(B\d{10}|E\d{12})$/.test(ncf) ? ncf : undefined,
    fecha: fechaValida(r.fecha),
    subtotal: esNumero(r.subtotal) && r.subtotal > 0 ? redondear(r.subtotal) : undefined,
    // Algunos tickets imprimen el descuento en negativo.
    descuento: esNumero(r.descuento) && r.descuento !== 0 ? redondear(Math.abs(r.descuento)) : undefined,
    itbis: esNumero(r.itbis) && r.itbis >= 0 ? redondear(r.itbis) : undefined,
    total: esNumero(r.total) && r.total > 0 ? redondear(r.total) : undefined,
    items,
    itemsDudosos,
    camposDudosos,
    dudas: (Array.isArray(r.dudas) ? r.dudas : []).filter(esTexto).map((d) => d.trim()).slice(0, 5),
    textoCrudo: "",
  };
}
