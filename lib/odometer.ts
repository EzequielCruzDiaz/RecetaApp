export interface DigitoOdometro {
  digito: number;
  tenue: boolean;
}

export interface Odometro {
  entero: DigitoOdometro[];
  decimal: DigitoOdometro[];
}

/**
 * Descompone un monto en columnas de odómetro.
 * El último dígito entero nunca es "tenue" (RD$0.00 se lee como 0.00, no como vacío).
 * Valores fuera de rango se limitan (negativos → 0, exceso → máximo representable).
 */
export function digitosOdometro(valor: number, enteros = 4, decimales = 2): Odometro {
  const total = enteros + decimales;
  const maximo = Math.pow(10, total) - 1;
  const centavos = Math.min(maximo, Math.max(0, Math.round(valor * Math.pow(10, decimales))));
  const texto = String(centavos).padStart(total, "0");

  let izquierda = true;
  const columnas: DigitoOdometro[] = [];
  for (let i = 0; i < total; i++) {
    const digito = Number(texto[i]);
    if (digito !== 0 || i >= enteros - 1) izquierda = false;
    columnas.push({ digito, tenue: izquierda });
  }
  return { entero: columnas.slice(0, enteros), decimal: columnas.slice(enteros) };
}
