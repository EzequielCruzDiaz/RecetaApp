export const TESSERACT_LANG = "spa";

export const TESSERACT_OPTIONS = {
  workerPath: "/tesseract/worker.min.js",
  corePath: "/tesseract/tesseract-core-simd-lstm.wasm.js",
  langPath: "/tesseract/lang",
} as const;
