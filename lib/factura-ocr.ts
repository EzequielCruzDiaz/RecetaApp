import type { FacturaItem } from "./types";

export interface CamposFacturaOCR {
  proveedor?: string;
  fecha?: string;
  rnc?: string;
  ncf?: string;
  itbis?: number;
  total?: number;
  items: FacturaItem[];
  textoCrudo: string;
}

const RE_RNC = /\b(\d{3}-\d{7}-\d)\b/;
const RE_RNC_LOOSE = /\bR\.?\s?N\.?\s?C\.?\b[^\d]{0,12}(\d[\d-]{7,13}\d)/i;
const RE_NCF = /\b((?:B\d{2}\d{8})|(?:E\d{2}\d{10}))\b/;
const RE_NCF_LOOSE = /\be?-?\s?N\.?\s?C\.?\s?F\.?\b[^A-Z0-9]{0,8}([BE]\d{10,12})/i;
const RE_FECHA_DMY = /\b(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})\b/;
const RE_FECHA_ISO = /\b(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})\b/;

const SALTAR_ITEM =
  /(sub\s*-?\s*total|total|itbis|impuesto|descuento|r\.?n\.?c|n\.?c\.?f|fecha|cambio|efectivo|tarjeta|balance|gracias|caj[ae]|vendedor)/i;

export function parseMonto(raw: string): number | undefined {
  let s = raw.replace(/[^\d.,-]/g, "").trim();
  if (!s || s === "-") return undefined;

  const lastDot = s.lastIndexOf(".");
  const lastComma = s.lastIndexOf(",");

  if (lastDot !== -1 && lastComma !== -1) {
    if (lastComma > lastDot) s = s.replace(/\./g, "").replace(",", ".");
    else s = s.replace(/,/g, "");
  } else if (lastComma !== -1) {
    s = /,\d{2}$/.test(s) ? s.replace(",", ".") : s.replace(/,/g, "");
  }

  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

function normalizarFecha(a: number, b: number, c: number, iso: boolean): string | undefined {
  let y: number, mo: number, d: number;
  if (iso) [y, mo, d] = [a, b, c];
  else [d, mo, y] = [a, b, c];
  if (y < 100) y += 2000;
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || y < 2000 || y > 2100) return undefined;
  return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function parseFacturaTexto(texto: string): CamposFacturaOCR {
  const lineas = texto.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const campos: CamposFacturaOCR = { items: [], textoCrudo: texto };

  const rnc = texto.match(RE_RNC)?.[1] ?? texto.match(RE_RNC_LOOSE)?.[1];
  if (rnc) campos.rnc = rnc.trim();

  const ncf = texto.match(RE_NCF)?.[1] ?? texto.match(RE_NCF_LOOSE)?.[1];
  if (ncf) campos.ncf = ncf.toUpperCase();

  const iso = texto.match(RE_FECHA_ISO);
  const dmy = texto.match(RE_FECHA_DMY);
  if (iso) campos.fecha = normalizarFecha(+iso[1], +iso[2], +iso[3], true);
  else if (dmy) campos.fecha = normalizarFecha(+dmy[1], +dmy[2], +dmy[3], false);

  for (const l of lineas) {
    if (!/i\.?\s?t\.?\s?b\.?\s?i\.?\s?s/i.test(l)) continue;
    const v = parseMonto(l.match(/([\d.,]+)\s*$/)?.[1] ?? "");
    if (v != null && v > 0) {
      campos.itbis = v;
      break;
    }
  }

  let total: number | undefined;
  for (const l of lineas) {
    if (!/\btotal\b/i.test(l) || /sub\s*-?\s*total/i.test(l)) continue;
    const v = parseMonto(l.match(/([\d.,]+)\s*$/)?.[1] ?? "");
    if (v == null) continue;
    if (/total\s+(a\s+pagar|general|factura|neto)|monto\s+total/i.test(l)) {
      total = v;
      break;
    }
    total = v;
  }
  if (total != null) campos.total = total;

  const idxRnc = rnc ? lineas.findIndex((l) => l.includes(rnc)) : -1;
  const previas = idxRnc > 0 ? lineas.slice(0, idxRnc) : lineas.slice(0, 4);
  const proveedor = previas.find(
    (l) => l.length >= 4 && /[a-záéíóúñ]/i.test(l) && !/factura|comprobante|r\.?n\.?c|n\.?c\.?f|fecha/i.test(l),
  );
  if (proveedor) campos.proveedor = proveedor;

  for (const l of lineas) {
    if (l.length < 5 || SALTAR_ITEM.test(l)) continue;
    const m = l.match(/^(.*?[a-záéíóúñ].*?)\s+(\d[\d.,]*)\s*$/i);
    if (!m) continue;
    const precio = parseMonto(m[2]);
    if (precio == null || precio <= 0) continue;

    const conCantidad = m[1].match(/^(\d+(?:[.,]\d+)?)\s*(?:x|und|u|lb|kg|pcs?)?\s+(.*)$/i);
    const cantidad = conCantidad ? parseMonto(conCantidad[1]) ?? 1 : 1;
    const nombre = (conCantidad ? conCantidad[2] : m[1]).trim();
    if (nombre.length < 2) continue;

    campos.items.push({ nombre, cantidad, unidad: null, precioUnitario: precio });
  }

  return campos;
}
