// Assets de Tesseract self-hosteados (ver public/tesseract/). Evita depender
// de la CDN y permite que el OCR funcione offline una vez cacheado por el SW.

export const TESSERACT_LANG = "spa";

export const TESSERACT_OPTIONS = {
  workerPath: "/tesseract/worker.min.js",
  corePath: "/tesseract/tesseract-core-simd-lstm.wasm.js",
  langPath: "/tesseract/lang",
} as const;
