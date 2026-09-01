"use client";

import { useState } from "react";
import EscaladorReceta from "@/components/EscaladorReceta";
import IngredientInventarioForm from "@/components/InventarioForm";
import RecetaCard from "@/components/RecetaCard";
import RecipeForm from "@/components/RecipeForm";
import { UNIDADES } from "@/lib/conversion";
import { formatMoneda } from "@/lib/tokens";
import {
  INVENTARIO_INICIAL,
  RECETAS_INICIALES,
} from "@/lib/recetas-iniciales";
import type {
  BorradorInventoryIngredient,
  BorradorReceta,
  InventoryIngredient,
  Receta,
} from "@/lib/types";

function nuevoId(prefijo: string): string {
  const rnd =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return `${prefijo}-${rnd}`;
}

export default function Home() {
  const [inventario, setInventario] =
    useState<InventoryIngredient[]>(INVENTARIO_INICIAL);
  const [recetas, setRecetas] = useState<Receta[]>(RECETAS_INICIALES);
  const [seleccionadaId, setSeleccionadaId] = useState<string | null>(
    RECETAS_INICIALES[0]?.id ?? null,
  );

  const seleccionada =
    recetas.find((r) => r.id === seleccionadaId) ?? recetas[0] ?? null;

  function agregarIngrediente(borrador: BorradorInventoryIngredient) {
    setInventario((prev) => [...prev, { ...borrador, id: nuevoId("ing") }]);
  }

  function quitarIngrediente(id: string) {
    const enUso = recetas.some((r) =>
      r.ingredientes.some((l) => l.ingredientId === id),
    );
    if (enUso) return;
    setInventario((prev) => prev.filter((i) => i.id !== id));
  }

  function agregarReceta(borrador: BorradorReceta) {
    const nueva: Receta = { ...borrador, id: nuevoId("receta") };
    setRecetas((prev) => [nueva, ...prev]);
    setSeleccionadaId(nueva.id);
  }

  function quitarReceta(id: string) {
    setRecetas((prev) => prev.filter((r) => r.id !== id));
    if (seleccionadaId === id) setSeleccionadaId(null);
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-6 py-12">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          RecetApp
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Inventario con precios, recetas por referencia y costeo por porción.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Inventario ({inventario.length})
        </h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {inventario.map((ing) => {
            const enUso = recetas.some((r) =>
              r.ingredientes.some((l) => l.ingredientId === ing.id),
            );
            return (
              <li
                key={ing.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex flex-col">
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {ing.nombre}
                  </span>
                  <span className="text-zinc-500">
                    {ing.categoria} · {formatMoneda(ing.precioCompra)} /{" "}
                    {UNIDADES[ing.unidadCompra].nombre}
                    {ing.equivalencia &&
                      ` · 1 ${ing.equivalencia.unidadPieza} = ${ing.equivalencia.cantidad} ${ing.equivalencia.unidadBase}`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => quitarIngrediente(ing.id)}
                  disabled={enUso}
                  title={enUso ? "En uso por una receta" : "Quitar"}
                  className="shrink-0 rounded-md px-2 py-1 text-zinc-500 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-red-950/40"
                >
                  ✕
                </button>
              </li>
            );
          })}
        </ul>
        <IngredientInventarioForm onSubmit={agregarIngrediente} />
      </section>

      {seleccionada && (
        <EscaladorReceta
          key={seleccionada.id}
          receta={seleccionada}
          inventario={inventario}
        />
      )}

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Recetas ({recetas.length})
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {recetas.map((receta) => (
            <RecetaCard
              key={receta.id}
              receta={receta}
              inventario={inventario}
              accion={
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSeleccionadaId(receta.id)}
                    disabled={receta.id === seleccionada?.id}
                    className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  >
                    {receta.id === seleccionada?.id
                      ? "En el escalador"
                      : "Escalar esta"}
                  </button>
                  <button
                    type="button"
                    onClick={() => quitarReceta(receta.id)}
                    className="rounded-md px-3 py-1.5 text-sm font-medium text-zinc-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                  >
                    Borrar
                  </button>
                </div>
              }
            />
          ))}
        </div>
      </section>

      <RecipeForm inventario={inventario} onSubmit={agregarReceta} />
    </main>
  );
}
