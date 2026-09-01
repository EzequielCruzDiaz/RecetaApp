import { UNIDADES } from "./conversion";
import type { InventoryIngredient, RecetaIngrediente, Unit } from "./types";

const FRACCIONES_UNICODE: Record<string, number> = {
  "¼": 1 / 4,
  "½": 1 / 2,
  "¾": 3 / 4,
  "⅓": 1 / 3,
  "⅔": 2 / 3,
  "⅕": 1 / 5,
  "⅖": 2 / 5,
  "⅗": 3 / 5,
  "⅘": 4 / 5,
  "⅙": 1 / 6,
  "⅛": 1 / 8,
  "⅜": 3 / 8,
  "⅝": 5 / 8,
  "⅞": 7 / 8,
};

const GLIFO_POR_VALOR: [valor: number, glifo: string][] = [
  [1 / 8, "⅛"],
  [1 / 4, "¼"],
  [1 / 3, "⅓"],
  [3 / 8, "⅜"],
  [1 / 2, "½"],
  [5 / 8, "⅝"],
  [2 / 3, "⅔"],
  [3 / 4, "¾"],
  [7 / 8, "⅞"],
];

const EPSILON = 1e-3;

export function parseCantidad(entrada: string): number | null {
  const texto = entrada.trim().toLowerCase();
  if (texto === "") return null;

  let resto = texto;
  let extraFraccion = 0;
  const ultimo = resto.at(-1) ?? "";
  if (ultimo in FRACCIONES_UNICODE) {
    extraFraccion = FRACCIONES_UNICODE[ultimo];
    resto = resto.slice(0, -1).trim();
  }

  if (resto === "") return redondearSuave(extraFraccion);

  let total = 0;
  for (const parte of resto.split(/\s+/)) {
    const valor = parseTrozo(parte);
    if (valor == null) return null;
    total += valor;
  }
  return redondearSuave(total + extraFraccion);
}

function parseTrozo(trozo: string): number | null {
  const fraccion = trozo.match(/^(\d+)\/(\d+)$/);
  if (fraccion) {
    const den = Number(fraccion[2]);
    return den === 0 ? null : Number(fraccion[1]) / den;
  }
  const decimal = trozo.replace(",", ".");
  if (!/^\d*\.?\d+$/.test(decimal)) return null;
  const n = Number(decimal);
  return Number.isFinite(n) ? n : null;
}

function redondearSuave(n: number): number {
  const r = Math.round(n * 1000) / 1000;
  return Object.is(r, -0) ? 0 : r;
}

export function formatCantidad(valor: number, maxDecimales = 2): string {
  if (!Number.isFinite(valor)) return "0";
  const signo = valor < 0 ? "-" : "";
  const abs = Math.abs(valor);

  const entero = Math.floor(abs + EPSILON);
  const frac = abs - entero;

  if (frac < EPSILON) return `${signo}${entero}`;

  for (const [v, glifo] of GLIFO_POR_VALOR) {
    if (Math.abs(frac - v) < 0.02) {
      return entero > 0 ? `${signo}${entero} ${glifo}` : `${signo}${glifo}`;
    }
  }

  const decimal = abs.toFixed(maxDecimales).replace(/\.?0+$/, "");
  return `${signo}${decimal}`;
}

export function nombreUnidad(unidad: Unit, cantidad: number): string {
  const meta = UNIDADES[unidad];
  if (!meta) return unidad;
  return Math.abs(cantidad - 1) < EPSILON ? meta.nombre : meta.plural;
}

export function formatCantidadUnidad(cantidad: number, unidad: Unit): string {
  return `${formatCantidad(cantidad)} ${nombreUnidad(unidad, cantidad)}`;
}

export function formatLineaReceta(
  linea: RecetaIngrediente,
  ing: InventoryIngredient | undefined,
): string {
  const nombre = ing?.nombre ?? "(ingrediente no encontrado)";
  if (linea.alGusto || linea.cantidad == null || linea.unidad == null) {
    return `${nombre} — a gusto`;
  }
  return `${formatCantidadUnidad(linea.cantidad, linea.unidad)} de ${nombre}`;
}

export function formatMoneda(n: number): string {
  return `$${n.toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
