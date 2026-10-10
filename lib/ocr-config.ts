export const TESSERACT_LANG = "spa";

export const TESSERACT_OPTIONS = {
  workerPath: "/tesseract/worker.min.js",
  corePath: "/tesseract/tesseract-core-simd-lstm.wasm.js",
  langPath: "/tesseract/lang",
} as const;

/**
 * Dos lecturas de la misma foto (ver combinarLecturas en factura-ocr.ts):
 * PSM 6 lee por filas y deja cada producto junto a sus montos; PSM 11 lee
 * bloques sueltos y no mezcla los encabezados a dos columnas.
 */
export const PASADAS_OCR = [
  { tessedit_pageseg_mode: "6", preserve_interword_spaces: "1" },
  { tessedit_pageseg_mode: "11", preserve_interword_spaces: "1" },
] as const;
