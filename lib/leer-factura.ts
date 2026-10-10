/**
 * Lectura de una foto de factura desde el navegador: primero con IA en el
 * servidor (`/api/facturas/leer`); si no hay conexión, clave o el servicio
 * falla, con Tesseract en el propio teléfono.
 */
import { combinarLecturas, parseFacturaTexto, type CamposFacturaOCR } from "./factura-ocr";
import type { MotorLectura } from "./factura-lectura";
import { PASADAS_OCR, TESSERACT_LANG, TESSERACT_OPTIONS } from "./ocr-config";
import { fotoParaIA, prepararFotoFactura } from "./ocr-imagen";
import { getSupabase } from "./supabase/client";
import { supabaseConfigurado } from "./supabase/config";

export interface ResultadoLectura {
  motor: MotorLectura;
  campos: CamposFacturaOCR;
  /** Por qué no se usó la IA, si no se usó (se muestra en la tarjeta de la foto). */
  avisoIA?: string;
}

async function encabezadoSesion(): Promise<Record<string, string>> {
  if (!supabaseConfigurado) return {};
  const { data } = await getSupabase().auth.getSession();
  return data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {};
}

type RespuestaIA = { ok: true; campos: CamposFacturaOCR } | { ok: false; aviso?: string };

/** Por qué no se pudo usar la IA cuando la ruta no devolvió un JSON nuestro (proxy, Vercel, timeout). */
function motivoPorEstado(status: number): string {
  if (status === 404) return "La app no tiene la ruta de lectura con IA: actualízala (git pull y redeploy).";
  if (status === 413) return "La foto pesa demasiado para el servidor.";
  if (status === 504) return "El servidor tardó demasiado leyendo la factura.";
  return `El servidor respondió con error ${status}.`;
}

async function leerConIA(foto: Blob): Promise<RespuestaIA> {
  if (typeof navigator !== "undefined" && !navigator.onLine) return { ok: false, aviso: "No hay conexión a internet." };
  const cuerpo = new FormData();
  try {
    (await fotoParaIA(foto)).forEach((parte, i) => cuerpo.append("foto", parte, `factura-${i + 1}.jpg`));
  } catch {
    return { ok: false, aviso: "Este navegador no pudo preparar la foto para la IA." };
  }
  let res: Response;
  try {
    res = await fetch("/api/facturas/leer", { method: "POST", body: cuerpo, headers: await encabezadoSesion() });
  } catch {
    return { ok: false, aviso: "No se pudo conectar con el servidor de la app." };
  }
  const json = (await res.json().catch(() => null)) as { campos?: CamposFacturaOCR; error?: string } | null;
  if (res.ok && json?.campos) return { ok: true, campos: json.campos };
  return { ok: false, aviso: json?.error ?? motivoPorEstado(res.status) };
}

async function leerConOCR(foto: Blob, onProgreso: (pct: number) => void): Promise<CamposFacturaOCR> {
  const { createWorker } = await import("tesseract.js");
  // Sin preparar, la sombra y el papel desteñido de una foto de celular
  // se comen la columna de montos. Si el navegador no puede, va la foto tal cual.
  const imagen = await prepararFotoFactura(foto).catch(() => foto);
  let pasada = 0;
  const worker = await createWorker(TESSERACT_LANG, 1, {
    ...TESSERACT_OPTIONS,
    logger: (m: { status: string; progress: number }) => {
      if (m.status === "recognizing text") onProgreso(Math.round(((pasada + m.progress) / PASADAS_OCR.length) * 100));
    },
  });
  try {
    const lecturas: CamposFacturaOCR[] = [];
    for (const parametros of PASADAS_OCR) {
      await worker.setParameters(parametros as unknown as Record<string, string>);
      const { data } = await worker.recognize(imagen);
      lecturas.push(parseFacturaTexto(data.text));
      pasada++;
    }
    return combinarLecturas(lecturas[0], lecturas[1]);
  } finally {
    await worker.terminate();
  }
}

export async function leerFactura(
  foto: Blob,
  onFase: (fase: "ia" | "ocr", progreso: number) => void,
): Promise<ResultadoLectura> {
  onFase("ia", 0);
  const ia = await leerConIA(foto);
  if (ia.ok) return { motor: "ia", campos: ia.campos };
  onFase("ocr", 0);
  const campos = await leerConOCR(foto, (pct) => onFase("ocr", pct));
  return { motor: "ocr", campos, avisoIA: ia.aviso };
}
