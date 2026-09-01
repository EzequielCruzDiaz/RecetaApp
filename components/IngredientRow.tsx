"use client";

import { useState } from "react";
import { formatCantidad, parseCantidad } from "@/lib/tokens";
import type { InventoryIngredient, RecetaIngrediente, Unit } from "@/lib/types";
import UnitSelector from "./UnitSelector";

export function unidadPorDefecto(ing: InventoryIngredient): Unit {
  return ing.equivalencia?.unidadPieza ?? ing.unidadCompra;
}

interface IngredientRowProps {
  linea: RecetaIngrediente;
  inventario: InventoryIngredient[];
  onChange: (linea: RecetaIngrediente) => void;
  onRemove: () => void;
  puedeQuitar?: boolean;
}

export default function IngredientRow({
  linea,
  inventario,
  onChange,
  onRemove,
  puedeQuitar = true,
}: IngredientRowProps) {
  const ing = inventario.find((i) => i.id === linea.ingredientId);

  const [cantidadTexto, setCantidadTexto] = useState(() =>
    linea.cantidad == null ? "" : formatCantidad(linea.cantidad),
  );
  const [cantidadPrevia, setCantidadPrevia] = useState(linea.cantidad);
  if (linea.cantidad !== cantidadPrevia) {
    setCantidadPrevia(linea.cantidad);
    setCantidadTexto(linea.cantidad == null ? "" : formatCantidad(linea.cantidad));
  }

  const cantidadInvalida =
    !linea.alGusto &&
    cantidadTexto.trim() !== "" &&
    parseCantidad(cantidadTexto) == null;

  function confirmarCantidad() {
    const valor = parseCantidad(cantidadTexto);
    if (valor == null) {
      setCantidadTexto(linea.cantidad == null ? "" : formatCantidad(linea.cantidad));
      return;
    }
    setCantidadTexto(formatCantidad(valor));
    if (valor !== linea.cantidad) onChange({ ...linea, cantidad: valor });
  }

  function cambiarIngrediente(id: string) {
    const nuevo = inventario.find((i) => i.id === id);
    onChange({
      ...linea,
      ingredientId: id,
      unidad: linea.alGusto ? null : nuevo ? unidadPorDefecto(nuevo) : linea.unidad,
    });
  }

  function alternarAlGusto(alGusto: boolean) {
    if (alGusto) {
      onChange({ ...linea, alGusto: true, cantidad: null, unidad: null });
    } else {
      onChange({
        ...linea,
        alGusto: false,
        cantidad: 1,
        unidad: ing ? unidadPorDefecto(ing) : "unidad",
      });
    }
  }

  return (
    <div className="flex flex-wrap items-start gap-2 rounded-lg border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-900">
      <select
        value={linea.ingredientId}
        aria-label="Ingrediente"
        onChange={(e) => cambiarIngrediente(e.target.value)}
        className="min-w-40 flex-1 rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 shadow-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
      >
        {inventario.length === 0 && <option value="">— sin inventario —</option>}
        {inventario.map((i) => (
          <option key={i.id} value={i.id}>
            {i.nombre}
          </option>
        ))}
      </select>

      <div className="flex flex-col">
        <input
          type="text"
          inputMode="decimal"
          value={linea.alGusto ? "" : cantidadTexto}
          placeholder={linea.alGusto ? "a gusto" : ""}
          disabled={linea.alGusto}
          aria-label="Cantidad"
          aria-invalid={cantidadInvalida}
          onChange={(e) => setCantidadTexto(e.target.value)}
          onBlur={confirmarCantidad}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              confirmarCantidad();
            }
          }}
          className={
            "w-20 rounded-md border px-2 py-1.5 text-sm shadow-sm outline-none " +
            "bg-white text-zinc-900 focus:border-zinc-500 disabled:opacity-50 " +
            "dark:bg-zinc-900 dark:text-zinc-100 " +
            (cantidadInvalida
              ? "border-red-400 focus:border-red-500"
              : "border-zinc-300 dark:border-zinc-700")
          }
        />
        {cantidadInvalida && (
          <span className="mt-0.5 text-xs text-red-500">No se entiende</span>
        )}
      </div>

      <UnitSelector
        value={linea.unidad ?? (ing ? unidadPorDefecto(ing) : "unidad")}
        disabled={linea.alGusto}
        onChange={(unidad) => onChange({ ...linea, unidad })}
      />

      <label className="flex items-center gap-1.5 whitespace-nowrap px-1 py-1.5 text-sm text-zinc-600 dark:text-zinc-300">
        <input
          type="checkbox"
          checked={linea.alGusto}
          onChange={(e) => alternarAlGusto(e.target.checked)}
        />
        a gusto
      </label>

      <button
        type="button"
        onClick={onRemove}
        disabled={!puedeQuitar}
        aria-label="Quitar ingrediente"
        className="rounded-md px-2 py-1.5 text-sm text-zinc-500 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-red-950/40"
      >
        ✕
      </button>
    </div>
  );
}
