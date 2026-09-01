"use client";

import { useState } from "react";
import type {
  BorradorReceta,
  InventoryIngredient,
  RecetaIngrediente,
} from "@/lib/types";
import IngredientRow, { unidadPorDefecto } from "./IngredientRow";

interface RecipeFormProps {
  inventario: InventoryIngredient[];
  onSubmit: (receta: BorradorReceta) => void;
}

function nuevaLinea(inventario: InventoryIngredient[]): RecetaIngrediente {
  const primero = inventario[0];
  return {
    ingredientId: primero?.id ?? "",
    cantidad: 1,
    unidad: primero ? unidadPorDefecto(primero) : "unidad",
    alGusto: false,
  };
}

const campo =
  "rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

export default function RecipeForm({ inventario, onSubmit }: RecipeFormProps) {
  const [nombre, setNombre] = useState("");
  const [porciones, setPorciones] = useState(4);
  const [lineas, setLineas] = useState<RecetaIngrediente[]>(() => [
    nuevaLinea(inventario),
  ]);
  const [error, setError] = useState<string | null>(null);

  const inventarioVacio = inventario.length === 0;

  function actualizarLinea(indice: number, cambiada: RecetaIngrediente) {
    setLineas((prev) => prev.map((l, i) => (i === indice ? cambiada : l)));
  }

  function quitarLinea(indice: number) {
    setLineas((prev) => prev.filter((_, i) => i !== indice));
  }

  function reiniciar() {
    setNombre("");
    setPorciones(4);
    setLineas([nuevaLinea(inventario)]);
    setError(null);
  }

  function manejarSubmit(e: React.FormEvent) {
    e.preventDefault();

    const nombreLimpio = nombre.trim();
    const ingredientes = lineas.filter((l) => l.ingredientId !== "");

    if (nombreLimpio === "") return setError("Ponele un nombre a la receta.");
    if (porciones <= 0)
      return setError("Las porciones tienen que ser un número positivo.");
    if (ingredientes.length === 0)
      return setError("Agregá al menos un ingrediente del inventario.");

    onSubmit({ nombre: nombreLimpio, porciones, ingredientes });
    reiniciar();
  }

  return (
    <form
      onSubmit={manejarSubmit}
      className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Nueva receta
      </h2>

      {inventarioVacio && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          Cargá primero algún ingrediente al inventario.
        </p>
      )}

      <div className="flex flex-wrap gap-4">
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="rf-nombre" className="text-sm font-medium">
            Nombre
          </label>
          <input
            id="rf-nombre"
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className={campo}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="rf-porciones" className="text-sm font-medium">
            Porciones
          </label>
          <input
            id="rf-porciones"
            type="number"
            min={1}
            value={porciones}
            onChange={(e) => setPorciones(Number(e.target.value))}
            className={`${campo} w-24`}
          />
        </div>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">Ingredientes</legend>
        {lineas.map((linea, i) => (
          <IngredientRow
            key={i}
            linea={linea}
            inventario={inventario}
            puedeQuitar={lineas.length > 1}
            onChange={(cambiada) => actualizarLinea(i, cambiada)}
            onRemove={() => quitarLinea(i)}
          />
        ))}
        <button
          type="button"
          disabled={inventarioVacio}
          onClick={() => setLineas((prev) => [...prev, nuevaLinea(inventario)])}
          className="self-start rounded-md border border-dashed border-zinc-400 px-3 py-1.5 text-sm text-zinc-600 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          + Agregar ingrediente
        </button>
      </fieldset>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={inventarioVacio}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          Guardar receta
        </button>
        <button
          type="button"
          onClick={reiniciar}
          className="rounded-md px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Limpiar
        </button>
      </div>
    </form>
  );
}
