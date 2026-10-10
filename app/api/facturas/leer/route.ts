import { atenderLectura } from "@/lib/factura-vision";

// Leer una foto con el modelo tarda unos segundos; el límite por defecto puede quedar corto.
export const maxDuration = 60;

export function POST(request: Request) {
  return atenderLectura(request);
}
