/**
 * Lectura de facturas con un modelo de visión de Claude (solo servidor).
 *
 * Tesseract lee letras, no facturas: en un recibo de supermercado confunde
 * las líneas de pago y de ahorro con productos. El modelo entiende qué es
 * cada línea y devuelve los campos ya estructurados. La clave
 * (`ANTHROPIC_API_KEY`) solo existe en el servidor; sin ella la ruta
 * responde 503 y el navegador usa Tesseract.
 */
import Anthropic from "@anthropic-ai/sdk";
import { supabaseConfigurado } from "./supabase/config";
import { sesionValida } from "./supabase/sesion";
import { ESQUEMA_LECTURA, necesitaRespaldo, normalizarLecturaIA } from "./factura-lectura";
import type { CamposFacturaOCR } from "./factura-ocr";

/** Haiku lee casi todas las facturas por una fracción de centavo. */
export const MODELO_FACTURA = process.env.FACTURA_MODELO || "claude-haiku-5-5";
/**
 * Si lo que leyó Haiku no cuadra con el total (o no leyó productos), se
 * vuelve a leer una sola vez con este modelo, más caro pero más fino con
 * tickets borrosos. `FACTURA_MODELO_RESPALDO=no` lo apaga.
 */
export const MODELO_RESPALDO =
  process.env.FACTURA_MODELO_RESPALDO === "no" ? null : process.env.FACTURA_MODELO_RESPALDO || "claude-sonnet-5-5";

const TIPOS_IMAGEN = ["image/jpeg", "image/png", "image/webp"] as const;
type TipoImagen = (typeof TIPOS_IMAGEN)[number];
const MAX_BYTES = 5 * 1024 * 1024;
/** Un ticket largo llega partido en franjas (ver `franjasFactura`). */
const MAX_IMAGENES = 3;

export interface ImagenFactura {
  datos: string;
  tipo: TipoImagen;
}

const INSTRUCCIONES = `Lees fotos de facturas de compra de negocios de comida en República Dominicana (supermercados, colmados, distribuidores, mercados) para registrar la compra en el inventario.

Devuelve:
- proveedor: el negocio que EMITE la factura (nombre comercial del encabezado, ej. "Supermercado Nacional"), nunca el cliente.
- rnc: RNC del emisor, el que está en el encabezado junto al nombre y la dirección (9 dígitos, u 11 si es cédula). En las facturas de crédito fiscal, el "RNC:" que va debajo del NCF o e-NCF, junto a una razón social, es del CLIENTE: ignóralo.
- ncf: comprobante fiscal: B + 10 dígitos, o e-CF E + 12 dígitos (ej. E310000012345).
- fecha: fecha de emisión en formato AAAA-MM-DD. Las fechas dominicanas vienen día/mes/año ("30/09/26" es 2026-09-30). "Válido hasta" es el vencimiento del comprobante, no la fecha de la factura.
- items: solo productos comprados, en el orden de la factura.
  - nombre: como está impreso, legible (sin códigos de barra ni de artículo).
  - cantidad y unidad: si es pesado ("1.25 LB X 89.00"), cantidad 1.25 y unidad "lb". "2 X 45.00" es cantidad 2. Si no dice unidad, unidad null, salvo una cantidad con decimales en un supermercado (producto pesado): es en libras, unidad "lb".
  - precioUnitario: lo que se pagó por unidad, ya con el descuento de esa línea si lo hay.
  - importe: total de la línea tal como está impreso.
  - dudoso: true si no se lee bien el nombre, la cantidad o el precio.
- subtotal: la suma de los importes impresa ("SUBTOTAL"), o null.
- descuento: la suma de los descuentos generales (líneas "DESCUENTO" debajo del subtotal), en positivo, o null.
- itbis: ITBIS total si aparece. total: total a pagar, o null si no se ve.
- camposDudosos: los campos del encabezado que no se leen con seguridad.
- dudas: notas cortas en español (máximo 3) sobre lo que no se pudo leer, para que la persona lo revise. Vacío si todo se lee bien.

Tickets de supermercado (Nacional, Jumbo, Bravo, Sirena y parecidos):
- Columnas DESCRIPCION, ITBIS y VALOR: VALOR es el importe de la línea y ya trae el ITBIS; la columna ITBIS es solo informativa. La letra al final (C, D, E…) es la tasa de ITBIS, no parte del precio.
- La cantidad y el precio van en una línea propia ENCIMA de la descripción ("3  20.00" y debajo "PLATANO MADURO  0.00  60.00 E" es cantidad 3 a 20.00). Esa línea pertenece al producto de abajo, no al de arriba. Un producto sin esa línea es cantidad 1 y su precio es el VALOR.
- Si el ticket está fotocopiado en dos columnas, lee la columna izquierda completa y luego la derecha. Las últimas líneas de la izquierda suelen repetirse arriba de la derecha: cuéntalas una sola vez.
- La suma de VALOR da el SUBTOTAL, y TOTAL A PAGAR = SUBTOTAL − DESCUENTOS.

No son productos: subtotales, ITBIS, descuentos generales, propinas, formas de pago (efectivo, tarjeta, VISA, MASTERCARD, cambio, devuelta), "usted ahorró" / "hubiese ahorrado", "items con C gravados…", puntos o lealtad, notas escritas a mano, ni datos del cajero o la caja.
Si llegan varias imágenes, son franjas de la MISMA factura de arriba hacia abajo y se solapan un poco: la línea que aparece al final de una franja y al principio de la siguiente es una sola, no la cuentes dos veces.
Antes de responder, comprueba que la suma de los importes dé el subtotal impreso y el total (con el ITBIS incluido o sumado aparte, menos descuentos). Si no cuadra, vuelve a mirar las líneas, sobre todo las repetidas y las de cantidad, y marca como dudoso lo que no puedas confirmar.
Nunca inventes: si un dato no se ve, devuelve null. Si la imagen no es una factura, devuelve items vacío y explícalo en dudas.`;

export class ErrorLectura extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

let cliente: Anthropic | null = null;

async function leerConModelo(modelo: string, imagenes: ImagenFactura[]): Promise<CamposFacturaOCR> {
  cliente ??= new Anthropic();
  const respuesta = await cliente.messages.create({
    model: modelo,
    max_tokens: 16000,
    // `medium` le da a Haiku margen para cuadrar los importes con el total.
    output_config: { effort: "medium", format: { type: "json_schema", schema: ESQUEMA_LECTURA } },
    system: INSTRUCCIONES,
    messages: [
      {
        role: "user",
        content: [
          ...imagenes.map((img) => ({
            type: "image" as const,
            source: { type: "base64" as const, media_type: img.tipo, data: img.datos },
          })),
          { type: "text", text: imagenes.length > 1 ? `Lee esta factura (${imagenes.length} franjas).` : "Lee esta factura." },
        ],
      },
    ],
  });

  if (respuesta.stop_reason === "refusal") throw new ErrorLectura("El modelo no quiso leer la imagen.", 422);
  if (respuesta.stop_reason === "max_tokens") throw new ErrorLectura("La factura es demasiado larga para leerla de una vez.", 422);
  const bloque = respuesta.content.find((b) => b.type === "text");
  if (!bloque || bloque.type !== "text") throw new ErrorLectura("El modelo no devolvió datos.", 502);
  try {
    return normalizarLecturaIA(JSON.parse(bloque.text));
  } catch {
    throw new ErrorLectura("El modelo devolvió datos ilegibles.", 502);
  }
}

/** Lee con el modelo barato y, solo si el resultado no cuadra, una vez con el de respaldo. */
export async function leerFacturaConIA(imagenes: ImagenFactura[]): Promise<CamposFacturaOCR> {
  let primera: CamposFacturaOCR | undefined;
  let fallo: unknown;
  try {
    primera = await leerConModelo(MODELO_FACTURA, imagenes);
    if (!necesitaRespaldo(primera)) return primera;
  } catch (e) {
    fallo = e;
  }
  if (!MODELO_RESPALDO || MODELO_RESPALDO === MODELO_FACTURA) {
    if (primera) return primera;
    throw fallo;
  }
  try {
    const segunda = await leerConModelo(MODELO_RESPALDO, imagenes);
    // Si el respaldo tampoco cuadra pero no leyó nada, la primera lectura sirve más.
    return primera && segunda.items.length === 0 ? primera : segunda;
  } catch (e) {
    if (primera) return primera;
    throw e;
  }
}

/**
 * Por qué falló la llamada a la API, en palabras que la persona pueda
 * resolver. Nunca incluye la clave.
 */
export function explicarErrorApi(status: number | undefined, detalle = ""): { codigo: string; mensaje: string } {
  if (status === 401) {
    return { codigo: "clave-invalida", mensaje: "La clave de IA no es válida o fue revocada: revisa ANTHROPIC_API_KEY." };
  }
  if (status === 400 && /credit balance/i.test(detalle)) {
    return {
      codigo: "sin-credito",
      mensaje: "La cuenta de Anthropic no tiene crédito: recárgala en console.anthropic.com (Billing).",
    };
  }
  if (status === 403) return { codigo: "sin-permiso", mensaje: "La clave no tiene permiso para usar el modelo de lectura." };
  if (status === 404) {
    return { codigo: "modelo", mensaje: "El modelo configurado no existe: revisa FACTURA_MODELO y FACTURA_MODELO_RESPALDO." };
  }
  if (status === 429) return { codigo: "limite", mensaje: "Se pasó el límite de uso de la cuenta de IA: prueba en un minuto." };
  if (status && status >= 500) return { codigo: "caido", mensaje: "El servicio de IA está saturado o caído: prueba otra vez." };
  if (status === undefined) return { codigo: "red", mensaje: "El servidor no pudo conectarse con el servicio de IA." };
  return { codigo: "api", mensaje: `El servicio de IA respondió con error ${status}.` };
}

const error = (mensaje: string, status: number, codigo?: string) =>
  Response.json({ error: mensaje, codigo }, { status });

/** `POST /api/facturas/leer` con la foto en `foto` (multipart). */
export async function atenderLectura(request: Request): Promise<Response> {
  const clave = process.env.ANTHROPIC_API_KEY?.trim();
  if (!clave) {
    return error(
      "El servidor no tiene ANTHROPIC_API_KEY. Si ya la pusiste, reinicia npm run dev o haz redeploy en Vercel.",
      503,
      "sin-clave",
    );
  }
  // Un id de la consola ("apikey_…") o una clave cortada al pegarla no sirven.
  if (!clave.startsWith("sk-ant-")) {
    return error("ANTHROPIC_API_KEY no parece una clave: tiene que empezar con sk-ant-.", 503, "clave-formato");
  }
  // Con Supabase la app tiene login: sin sesión, nadie gasta la clave del negocio.
  if (supabaseConfigurado && !(await sesionValida(request))) {
    return error("Tu sesión venció: vuelve a iniciar sesión para leer facturas con IA.", 401, "sin-sesion");
  }

  let fotos: FormDataEntryValue[];
  try {
    fotos = (await request.formData()).getAll("foto");
  } catch {
    return error("Manda la foto como multipart en el campo `foto`.", 400);
  }
  if (fotos.length === 0 || !fotos.every((f) => f instanceof Blob)) return error("Falta la foto.", 400);
  if (fotos.length > MAX_IMAGENES) return error(`Máximo ${MAX_IMAGENES} imágenes por factura.`, 400);
  const blobs = fotos as Blob[];
  if (!blobs.every((f) => TIPOS_IMAGEN.includes(f.type as TipoImagen))) {
    return error("La foto tiene que ser JPG, PNG o WebP.", 415);
  }
  if (blobs.some((f) => f.size > MAX_BYTES)) return error("La foto pesa demasiado (máximo 5 MB).", 413);

  try {
    const imagenes = await Promise.all(
      blobs.map(async (f) => ({
        datos: Buffer.from(await f.arrayBuffer()).toString("base64"),
        tipo: f.type as TipoImagen,
      })),
    );
    const campos = await leerFacturaConIA(imagenes);
    return Response.json({ campos });
  } catch (e) {
    if (e instanceof ErrorLectura) return error(e.message, e.status);
    if (e instanceof Anthropic.APIError) {
      console.error("Lectura de factura con IA:", e.status, e.message);
      const { codigo, mensaje } = explicarErrorApi(e.status, e.message);
      return error(mensaje, 502, codigo);
    }
    throw e;
  }
}
