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
import { ESQUEMA_LECTURA, normalizarLecturaIA } from "./factura-lectura";
import type { CamposFacturaOCR } from "./factura-ocr";

/** Sonnet lee bien recibos térmicos y tickets largos; `claude-haiku-5-5` sale ~20× más barato. */
export const MODELO_FACTURA = process.env.FACTURA_MODELO || "claude-sonnet-5-5";

const TIPOS_IMAGEN = ["image/jpeg", "image/png", "image/webp"] as const;
type TipoImagen = (typeof TIPOS_IMAGEN)[number];
const MAX_BYTES = 5 * 1024 * 1024;

const INSTRUCCIONES = `Lees fotos de facturas de compra de negocios de comida en República Dominicana (supermercados, colmados, distribuidores, mercados) para registrar la compra en el inventario.

Devuelve:
- proveedor: el negocio que EMITE la factura (nombre comercial del encabezado, ej. "Supermercados Nacional"), nunca el cliente.
- rnc: RNC del emisor (9 dígitos, u 11 si es cédula). Ignora el RNC o cédula del cliente.
- ncf: comprobante fiscal: B + 10 dígitos, o e-CF E + 12 dígitos (ej. E310000012345).
- fecha: fecha de emisión en formato AAAA-MM-DD. Las fechas dominicanas vienen día/mes/año.
- items: solo productos comprados, en el orden de la factura.
  - nombre: como está impreso, legible (sin códigos de barra ni de artículo).
  - cantidad y unidad: si es pesado ("1.25 LB X 89.00"), cantidad 1.25 y unidad "lb". Si no dice unidad, unidad null. "2 X 45.00" es cantidad 2.
  - precioUnitario: lo que se pagó por unidad, ya con el descuento de esa línea si lo hay.
  - importe: total de la línea tal como está impreso.
  - dudoso: true si no se lee bien el nombre, la cantidad o el precio.
- itbis: ITBIS total si aparece. total: total a pagar.
- camposDudosos: los campos del encabezado que no se leen con seguridad.
- dudas: notas cortas en español (máximo 3) sobre lo que no se pudo leer, para que la persona lo revise. Vacío si todo se lee bien.

No son productos: subtotales, ITBIS, descuentos generales, propinas, formas de pago (efectivo, tarjeta, VISA, MASTERCARD, cambio, devuelta), "usted ahorró" / "hubiese ahorrado", puntos o lealtad, ni datos del cajero o la caja.
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

export async function leerFacturaConIA(datosBase64: string, tipo: TipoImagen): Promise<CamposFacturaOCR> {
  cliente ??= new Anthropic();
  const respuesta = await cliente.messages.create({
    model: MODELO_FACTURA,
    max_tokens: 8000,
    // Extracción: poco razonamiento basta y responde más rápido.
    output_config: { effort: "low", format: { type: "json_schema", schema: ESQUEMA_LECTURA } },
    system: INSTRUCCIONES,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: tipo, data: datosBase64 } },
          { type: "text", text: "Lee esta factura." },
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

const error = (mensaje: string, status: number, codigo?: string) =>
  Response.json({ error: mensaje, codigo }, { status });

/** `POST /api/facturas/leer` con la foto en `foto` (multipart). */
export async function atenderLectura(request: Request): Promise<Response> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return error("La lectura con IA no está configurada en este servidor.", 503, "sin-clave");
  }
  // Con Supabase la app tiene login: sin sesión, nadie gasta la clave del negocio.
  if (supabaseConfigurado && !(await sesionValida(request))) {
    return error("Inicia sesión para leer facturas.", 401);
  }

  let foto: FormDataEntryValue | null;
  try {
    foto = (await request.formData()).get("foto");
  } catch {
    return error("Manda la foto como multipart en el campo `foto`.", 400);
  }
  if (!(foto instanceof Blob)) return error("Falta la foto.", 400);
  if (!TIPOS_IMAGEN.includes(foto.type as TipoImagen)) return error("La foto tiene que ser JPG, PNG o WebP.", 415);
  if (foto.size > MAX_BYTES) return error("La foto pesa demasiado (máximo 5 MB).", 413);

  try {
    const datos = Buffer.from(await foto.arrayBuffer()).toString("base64");
    const campos = await leerFacturaConIA(datos, foto.type as TipoImagen);
    return Response.json({ campos });
  } catch (e) {
    if (e instanceof ErrorLectura) return error(e.message, e.status);
    if (e instanceof Anthropic.APIError) {
      console.error("Lectura de factura con IA:", e.status, e.message);
      return error("El servicio de lectura no respondió.", 502);
    }
    throw e;
  }
}
