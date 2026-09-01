"use client";

import { useMemo, useState } from "react";
import { costoReceta, escalarReceta, mejorUnidad } from "@/lib/conversion";
import { formatCantidadUnidad, formatMoneda } from "@/lib/tokens";
import type { InventoryIngredient, Receta } from "@/lib/types";

interface EscaladorRecetaProps {
  receta: Receta;
  inventario: InventoryIngredient[];
}

const MULTIPLICADORES = [0.5, 2, 3];

export default function EscaladorReceta({
  receta,
  inventario,
}: EscaladorRecetaProps) {
  const [porciones, setPorciones] = useState(receta.porciones);
  const [normalizar, setNormalizar] = useState(false);

  const porcionesValidas = Number.isFinite(porciones) && porciones > 0;
  const objetivo = porcionesValidas ? porciones : receta.porciones;

  const escalada = useMemo(
    () => escalarReceta(receta, objetivo),
    [receta, objetivo],
  );
  const costo = useMemo(
    () => costoReceta(escalada, inventario),
    [escalada, inventario],
  );

  const porId = new Map(inventario.map((i) => [i.id, i]));
  const factor = objetivo / receta.porciones;

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <header className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Escalar: {receta.nombre}
        </h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Receta original para {receta.porciones}{" "}
          {receta.porciones === 1 ? "porción" : "porciones"}.
        </p>
      </header>

      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="esc-porciones" className="text-sm font-medium">
            Porciones
          </label>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Menos una porción"
              onClick={() => setPorciones((p) => Math.max(1, p - 1))}
              className="h-9 w-9 rounded-md border border-zinc-300 text-lg leading-none hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              −
            </button>
            <input
              id="esc-porciones"
              type="number"
              min={1}
              value={porciones}
              onChange={(e) => setPorciones(Number(e.target.value))}
              className="w-20 rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-center text-sm text-zinc-900 shadow-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
            <button
              type="button"
              aria-label="Más una porción"
              onClick={() => setPorciones((p) => p + 1)}
              className="h-9 w-9 rounded-md border border-zinc-300 text-lg leading-none hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              +
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          {MULTIPLICADORES.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() =>
                setPorciones(Math.max(1, Math.round(receta.porciones * m)))
              }
              className="rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              {m === 0.5 ? "½×" : `${m}×`}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPorciones(receta.porciones)}
            className="rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Original
          </button>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={normalizar}
            onChange={(e) => setNormalizar(e.target.checked)}
          />
          Ajustar unidades
        </label>
      </div>

      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        Factor ×{factor.toLocaleString("es-AR", { maximumFractionDigits: 2 })}
      </p>

      <ul className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
        {escalada.ingredientes.map((linea, i) => {
          const ing = porId.get(linea.ingredientId);
          const resultado = costo.lineas[i];

          let texto: string;
          if (linea.alGusto || linea.cantidad == null || linea.unidad == null) {
            texto = `${ing?.nombre ?? linea.ingredientId} — a gusto`;
          } else {
            const vista = normalizar
              ? mejorUnidad(linea.cantidad, linea.unidad)
              : { cantidad: linea.cantidad, unidad: linea.unidad };
            texto = `${formatCantidadUnidad(vista.cantidad, vista.unidad)} de ${
              ing?.nombre ?? linea.ingredientId
            }`;
          }

          return (
            <li
              key={i}
              className="flex items-baseline justify-between gap-3 border-b border-zinc-100 pb-1 last:border-0 dark:border-zinc-800"
            >
              <span>{texto}</span>
              <span className="shrink-0 tabular-nums text-zinc-500">
                {resultado.costo != null
                  ? formatMoneda(resultado.costo)
                  : resultado.alGusto
                    ? "a gusto"
                    : "—"}
              </span>
            </li>
          );
        })}
      </ul>

      <footer className="flex flex-col gap-1 border-t border-zinc-200 pt-2 text-sm dark:border-zinc-700">
        <div className="flex items-baseline justify-between">
          <span className="font-medium">Total</span>
          <span className="font-semibold tabular-nums">
            {formatMoneda(costo.total)}
          </span>
        </div>
        <div className="flex items-baseline justify-between text-zinc-600 dark:text-zinc-400">
          <span>Por porción ({objetivo})</span>
          <span className="tabular-nums">{formatMoneda(costo.porPorcion)}</span>
        </div>
      </footer>

      {!porcionesValidas && (
        <p className="text-sm text-red-500">
          Elegí un número de porciones mayor que cero.
        </p>
      )}
    </section>
  );
}
