/**
 * Preparación de la foto de una factura antes del OCR.
 *
 * Una foto de celular trae sombra de la mano, luz despareja y papel térmico
 * desteñido; Tesseract binariza con un umbral global y en esas zonas pierde
 * la columna de montos (y con ella los ítems). Aquí se escala a un tamaño
 * cómodo para Tesseract y se binariza con un umbral local, que sigue a la
 * luz de cada zona.
 */

/** Lado mayor con el que se manda la imagen a Tesseract. */
export const LADO_OBJETIVO = 2000;

/** Factor de escala para que el lado mayor quede en `objetivo` (sin agrandar más de 2×). */
export function escalaPara(ancho: number, alto: number, objetivo = LADO_OBJETIVO): number {
  const mayor = Math.max(ancho, alto);
  if (mayor <= 0) return 1;
  return Math.min(2, objetivo / mayor);
}

/** RGBA → luminancia (0–255). */
export function aGrises(rgba: Uint8ClampedArray, ancho: number, alto: number): Uint8ClampedArray {
  const gris = new Uint8ClampedArray(ancho * alto);
  for (let i = 0, p = 0; i < gris.length; i++, p += 4) {
    gris[i] = (rgba[p] * 299 + rgba[p + 1] * 587 + rgba[p + 2] * 114) / 1000;
  }
  return gris;
}

/**
 * Umbral adaptativo (Bradley–Roth): un píxel es tinta si es `sensibilidad`
 * más oscuro que el promedio de su vecindario. Devuelve 0 (tinta) o 255.
 */
export function umbralAdaptativo(
  gris: Uint8ClampedArray,
  ancho: number,
  alto: number,
  ventana = Math.max(15, Math.round(Math.max(ancho, alto) / 40)),
  sensibilidad = 0.12,
): Uint8ClampedArray {
  // Imagen integral con una fila y columna extra de ceros.
  const w1 = ancho + 1;
  const integral = new Float64Array(w1 * (alto + 1));
  for (let y = 0; y < alto; y++) {
    let fila = 0;
    for (let x = 0; x < ancho; x++) {
      fila += gris[y * ancho + x];
      integral[(y + 1) * w1 + x + 1] = integral[y * w1 + x + 1] + fila;
    }
  }

  const r = Math.floor(ventana / 2);
  const salida = new Uint8ClampedArray(ancho * alto);
  for (let y = 0; y < alto; y++) {
    const y0 = Math.max(0, y - r);
    const y1 = Math.min(alto, y + r + 1);
    for (let x = 0; x < ancho; x++) {
      const x0 = Math.max(0, x - r);
      const x1 = Math.min(ancho, x + r + 1);
      const suma = integral[y1 * w1 + x1] - integral[y0 * w1 + x1] - integral[y1 * w1 + x0] + integral[y0 * w1 + x0];
      const promedio = suma / ((x1 - x0) * (y1 - y0));
      salida[y * ancho + x] = gris[y * ancho + x] < promedio * (1 - sensibilidad) ? 0 : 255;
    }
  }
  return salida;
}

/**
 * En el navegador: respeta la orientación EXIF, escala y binariza. Devuelve
 * un canvas listo para `Tesseract.recognize`.
 */
export async function prepararFotoFactura(archivo: Blob): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(archivo, { imageOrientation: "from-image" });
  const escala = escalaPara(bitmap.width, bitmap.height);
  const ancho = Math.max(1, Math.round(bitmap.width * escala));
  const alto = Math.max(1, Math.round(bitmap.height * escala));

  const canvas = document.createElement("canvas");
  canvas.width = ancho;
  canvas.height = alto;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Este navegador no deja procesar la imagen.");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, ancho, alto);
  bitmap.close();

  const datos = ctx.getImageData(0, 0, ancho, alto);
  const bn = umbralAdaptativo(aGrises(datos.data, ancho, alto), ancho, alto);
  for (let i = 0, p = 0; i < bn.length; i++, p += 4) {
    datos.data[p] = datos.data[p + 1] = datos.data[p + 2] = bn[i];
    datos.data[p + 3] = 255;
  }
  ctx.putImageData(datos, 0, 0);
  return canvas;
}
