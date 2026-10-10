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
  /** Posiciones en `items` que conviene revisar (solo la lectura con IA las marca). */
  itemsDudosos?: number[];
  camposDudosos?: ("proveedor" | "rnc" | "ncf" | "fecha" | "total")[];
  /** Notas cortas sobre lo que no se leía bien. */
  dudas?: string[];
}

const RE_FECHA_DMY = /\b(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})\b/;
const RE_FECHA_ISO = /\b(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})\b/;

/** Etiqueta de RNC, aunque el OCR confunda la R ("ANC", "RNG"). */
const RE_ETIQUETA_RNC = /(?:^|[^a-z])[rah]\.?\s?n\.?\s?[cg]\.?(?![a-z])/i;
const RE_ETIQUETA_NCF = /(?:^|[^a-z])(?:e-?)?n\.?\s?c\.?\s?[fe]\.?(?![a-z])/i;
/** El RNC de quien compra no es el del suplidor. */
const RE_CLIENTE = /cliente|comprador|adquiriente/i;

const SALTAR_ITEM =
  /(sub\s*-?\s*total|total|itbis|impuesto|descuento|r\.?n\.?c|n\.?c\.?f|fecha|hora|cambio|efectivo|tarjeta|balance|gracias|caj[ae]|cajer[oa]|vendedor|\bcalle\b|\bc\/|\bav(enida)?\b|\btel[eé]?f?(ono)?\b|whatsapp|\bsector\b|\bkm\b|direcci[oó]n|cliente|c[eé]dula|art[ií]culos|factura|comprobante|consumidor|cr[eé]dito fiscal|descripci[oó]n|importe|\bvalor\b|\bcant\.?\b|precio\s*$)/i;

/** Líneas con "total" que no son el total de la factura. */
const NO_ES_TOTAL = /sub\s*-?\s*total|itbis|impuesto|art[ií]culos|[ií]tems|unidades|cantidad|descuento/i;

/** "2 X 395.00  790.00": cantidad × precio [importe], en la línea de abajo de la descripción. */
const RE_MULTIPLICA = /^(\d+(?:[.,]\d+)?)\s*[x×*]\s*(\d[\d.,]*)(?:\s+(\d[\d.,]*))?$/i;

export function parseMonto(raw: string): number | undefined {
  let s = raw.replace(/[^\d.,-]/g, "").trim();
  if (!s || s === "-") return undefined;

  const lastDot = s.lastIndexOf(".");
  const lastComma = s.lastIndexOf(",");

  if (lastDot !== -1 && lastComma !== -1) {
    if (lastComma > lastDot) s = s.replace(/\./g, "").replace(",", ".");
    else s = s.replace(/,/g, "");
  } else if (lastComma !== -1) {
    // Una sola coma seguida de 1 o 2 dígitos es decimal ("12,5", "350,00");
    // con 3 dígitos o varias comas es separador de miles ("1,250").
    s = /^-?\d+,\d{1,2}$/.test(s) ? s.replace(",", ".") : s.replace(/,/g, "");
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

/** Letras que el OCR pone donde van dígitos (O→0, l→1…). */
const aDigitos = (s: string) =>
  s.replace(/[OoQD]/g, "0").replace(/[Il|!]/g, "1").replace(/[Ss]/g, "5").replace(/[Zz]/g, "2");

function formatearRnc(digitos: string): string | undefined {
  if (digitos.length === 9) return `${digitos[0]}-${digitos.slice(1, 3)}-${digitos.slice(3, 8)}-${digitos[8]}`;
  if (digitos.length === 11) return `${digitos.slice(0, 3)}-${digitos.slice(3, 10)}-${digitos[10]}`;
  return undefined;
}

/** RNC del suplidor: con etiqueta primero; sin etiqueta, el primero con forma de RNC. Nunca el del cliente. */
function buscarRnc(lineas: string[]): { rnc: string; linea: number } | undefined {
  const deSuplidor = (l: string) => !RE_CLIENTE.test(l);
  for (let i = 0; i < lineas.length; i++) {
    const l = lineas[i];
    const m = l.match(RE_ETIQUETA_RNC);
    if (!m || !deSuplidor(l)) continue;
    const resto = l.slice((m.index ?? 0) + m[0].length);
    const crudo = resto.match(/^[^\dOoIl]{0,6}([\dOoIl][\dOoIl.\- ]{7,16}[\dOoIl])/)?.[1];
    const rnc = crudo && formatearRnc(aDigitos(crudo).replace(/\D/g, ""));
    if (rnc) return { rnc, linea: i };
  }
  for (let i = 0; i < lineas.length; i++) {
    if (!deSuplidor(lineas[i])) continue;
    const m = lineas[i].match(/\b(\d-\d{2}-\d{5}-\d|\d{3}-\d{7}-\d)\b/);
    if (m) return { rnc: m[1], linea: i };
  }
  return undefined;
}

/** NCF: B + 10 dígitos o E + 12, corrigiendo las confusiones típicas del OCR. */
function buscarNcf(lineas: string[]): string | undefined {
  const candidato = (token: string, conEtiqueta: boolean) => {
    const t = token.replace(/[^A-Za-z0-9|!]/g, "");
    const inicial = t[0]?.toUpperCase();
    const valida = inicial === "B" || inicial === "E" || (conEtiqueta && inicial === "8");
    if (!valida) return undefined;
    const resto = aDigitos(t.slice(1));
    if (!/^\d+$/.test(resto)) return undefined;
    const letra = inicial === "8" ? "B" : inicial;
    if (letra === "B" && resto.length === 10) return `B${resto}`;
    if (letra === "E" && resto.length === 12) return `E${resto}`;
    return undefined;
  };
  for (const l of lineas) {
    const m = l.match(RE_ETIQUETA_NCF);
    if (!m) continue;
    for (const token of l.slice((m.index ?? 0) + m[0].length).split(/[\s:]+/)) {
      const ncf = candidato(token, true);
      if (ncf) return ncf;
    }
  }
  for (const l of lineas) {
    for (const token of l.split(/\s+/)) {
      const ncf = candidato(token, false);
      if (ncf) return ncf;
    }
  }
  return undefined;
}

const proporcionLetras = (s: string) => (s.match(/[a-záéíóúñ]/gi)?.length ?? 0) / Math.max(1, s.replace(/\s/g, "").length);

/** Quita basura que el OCR deja en los bordes de la línea ('|', ']', comillas…) y el "RD$". */
function limpiarLinea(l: string): string {
  return l
    .replace(/RD\s?\$\s?/gi, "")
    .replace(/\$\s?(?=\d)/g, "")
    .replace(/^[^A-Za-z0-9ÁÉÍÓÚÑáéíóúñ]+/, "")
    .replace(/[\s|\]\[}{'"`_~»«]+$/, "")
    .trim();
}

interface ItemCrudo {
  item: FacturaItem;
  /** Línea completa de la descripción, por si la línea siguiente trae la cantidad. */
  descripcion: string;
  /** Solo traía un monto: puede ser que la cantidad venga abajo. */
  soloMonto: boolean;
}

function leerItem(l: string): ItemCrudo | undefined {
  // Código de impuesto al final del monto ("620.00 G", "98.50 E").
  const linea = l.replace(/(\d)\s+[A-Z]{1,2}$/, "$1");
  const m = linea.match(/^(.*?[a-záéíóúñ].*?)((?:\s+\d[\d.,]*){1,4})$/i);
  if (!m) return undefined;
  const tokens = m[2].trim().split(/\s+/);
  const nums = tokens.map(parseMonto);
  if (nums.some((n) => n == null || n < 0)) return undefined;
  const valores = nums as number[];
  const importe = valores[valores.length - 1];
  if (!(importe > 0)) return undefined;

  const conCantidad = m[1].match(/^(\d+(?:[.,]\d+)?)\s*(?:x|und|u|lb|kg|pcs?)?\s+(.*)$/i);
  let cantidad = conCantidad ? parseMonto(conCantidad[1]) ?? 1 : 1;
  let nombre = (conCantidad ? conCantidad[2] : m[1]).replace(/\s{2,}/g, " ").trim();
  if (nombre.length < 2 || proporcionLetras(nombre) < 0.5) return undefined;

  // La última cifra es el importe (cantidad × precio); antes pueden venir la
  // cantidad, el precio unitario y la columna de ITBIS.
  let precio: number;
  if (conCantidad) {
    precio = valores.length >= 2 ? valores[0] : importe / cantidad; // "2 Arroz 4,500.00 0.00 9,000.00"
  } else if (valores.length >= 3) {
    [cantidad, precio] = valores; // "Arroz 3 45.00 135.00"
  } else if (valores.length === 2 && /^\d{1,2}$/.test(tokens[0])) {
    cantidad = valores[0]; // "Arroz 5 350.00"
    precio = importe / cantidad;
  } else if (valores.length === 2 && /[.,]\d{1,2}$/.test(tokens[0])) {
    precio = valores[0]; // "Arroz 70.00 350.00"
    cantidad = Math.round((importe / precio) * 1000) / 1000;
  } else if (valores.length === 2) {
    // "Habichuela roja 118  98.50": un entero largo sin decimales es parte
    // del nombre (el OCR leyó "1LB" como "118").
    nombre = `${nombre} ${tokens[0]}`;
    precio = importe;
  } else {
    precio = importe / cantidad;
  }
  if (!(cantidad > 0) || !(precio > 0)) return undefined;

  return {
    item: { nombre, cantidad, unidad: null, precioUnitario: Math.round(precio * 100) / 100 },
    descripcion: m[1].replace(/\s{2,}/g, " ").trim(),
    soloMonto: valores.length === 1 && !conCantidad,
  };
}

export function parseFacturaTexto(texto: string): CamposFacturaOCR {
  // Con preserve_interword_spaces, una fila puede traer otra columna separada
  // por muchos espacios (encabezados a dos columnas): para el encabezado se
  // separan; para los ítems se mantiene la fila entera.
  const filas = texto.split(/\r?\n/).map(limpiarLinea).filter(Boolean);
  const segmentos = filas.flatMap((l) => l.split(/\s{4,}/).map((s) => s.trim())).filter(Boolean);
  const campos: CamposFacturaOCR = { items: [], textoCrudo: texto };

  const rnc = buscarRnc(segmentos);
  if (rnc) campos.rnc = rnc.rnc;

  const ncf = buscarNcf(segmentos);
  if (ncf) campos.ncf = ncf;

  const iso = texto.match(RE_FECHA_ISO);
  const dmy = texto.match(RE_FECHA_DMY);
  if (iso) campos.fecha = normalizarFecha(+iso[1], +iso[2], +iso[3], true);
  else if (dmy) campos.fecha = normalizarFecha(+dmy[1], +dmy[2], +dmy[3], false);

  const montoFinal = (l: string) => parseMonto(l.replace(/\s+[A-Z]$/, "").match(/([\d.,]+)\s*$/)?.[1] ?? "");

  for (const l of filas) {
    if (!/i\.?\s?t\.?\s?b\.?\s?i\.?\s?s/i.test(l)) continue;
    const v = montoFinal(l);
    if (v != null && v > 0) {
      campos.itbis = v;
      break;
    }
  }

  let total: number | undefined;
  for (const l of filas) {
    if (!/\btotal\b/i.test(l) || NO_ES_TOTAL.test(l)) continue;
    const v = montoFinal(l);
    if (v == null) continue;
    if (/total\s+(a\s+pagar|general|factura|neto)|monto\s+total/i.test(l)) {
      total = v;
      break;
    }
    total = v;
  }
  if (total != null) campos.total = total;

  // El suplidor es la primera línea "de nombre" del encabezado.
  const finEncabezado = segmentos.findIndex(
    (l) => RE_ETIQUETA_RNC.test(l) || RE_ETIQUETA_NCF.test(l) || /fecha|tel/i.test(l),
  );
  const encabezado = finEncabezado > 0 ? segmentos.slice(0, finEncabezado) : segmentos.slice(0, 4);
  const proveedor = encabezado.find(
    (l) =>
      l.length >= 4 &&
      proporcionLetras(l) >= 0.6 &&
      !/factura|comprobante|consumidor|cr[eé]dito fiscal|\bav(enida)?\b|\bcalle\b|\bc\/|r\.?n\.?c|n\.?c\.?f|fecha/i.test(l),
  );
  if (proveedor) campos.proveedor = proveedor;

  let pendiente: string | null = null;
  let anterior: ItemCrudo | null = null;
  for (const l of filas) {
    const mult = l.replace(/(\d)\s+[A-Z]{1,2}$/, "$1").match(RE_MULTIPLICA);
    if (mult) {
      const cantidad = parseMonto(mult[1]);
      const precio = parseMonto(mult[2]);
      const nombre = pendiente ?? (anterior?.soloMonto ? anterior.descripcion : null);
      if (nombre && cantidad && cantidad > 0 && precio && precio > 0) {
        if (!pendiente && anterior) campos.items.pop();
        campos.items.push({ nombre, cantidad, unidad: null, precioUnitario: precio });
      }
      pendiente = null;
      anterior = null;
      continue;
    }

    if (l.length < 4 || SALTAR_ITEM.test(l) || l === proveedor || l.startsWith(`${proveedor} `)) {
      pendiente = null;
      anterior = null;
      continue;
    }

    const leido = leerItem(l);
    if (leido) {
      campos.items.push(leido.item);
      pendiente = null;
      anterior = leido;
    } else {
      // Descripción sin monto: la cantidad y el precio pueden venir abajo.
      pendiente = proporcionLetras(l) >= 0.6 ? l.replace(/\s{2,}/g, " ") : null;
      anterior = null;
    }
  }

  return campos;
}

/**
 * Junta dos lecturas de la misma foto: una por filas (Tesseract PSM 6, que
 * mantiene juntos producto y montos) y otra por bloques sueltos (PSM 11, que
 * no mezcla un encabezado a dos columnas). Los ítems y montos salen de la
 * primera; suplidor, RNC, NCF y fecha, de la que los tenga.
 */
export function combinarLecturas(porFilas: CamposFacturaOCR, sueltos: CamposFacturaOCR): CamposFacturaOCR {
  return {
    ...porFilas,
    proveedor: sueltos.proveedor ?? porFilas.proveedor,
    rnc: porFilas.rnc ?? sueltos.rnc,
    ncf: porFilas.ncf ?? sueltos.ncf,
    fecha: porFilas.fecha ?? sueltos.fecha,
    itbis: porFilas.itbis ?? sueltos.itbis,
    total: porFilas.total ?? sueltos.total,
    items: porFilas.items.length ? porFilas.items : sueltos.items,
    textoCrudo: porFilas.textoCrudo,
  };
}
