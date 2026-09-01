"use client";

import { useState } from "react";
import { parseCantidad } from "@/lib/tokens";
import type {
  BorradorInventoryIngredient,
  PieceUnit,
  Unit,
  UnitCategory,
} from "@/lib/types";
import UnitSelector from "./UnitSelector";

const CATEGORIAS: UnitCategory[] = ["peso", "volumen", "pieza"];

const PIEZAS: PieceUnit[] = [
  "unidad",
  "docena",
  "diente",
  "atado",
  "lata",
  "paquete",
  "saco",
  "caja",
];

const BASES: { id: "g" | "kg" | "ml" | "L"; etiqueta: string }[] = [
  { id: "g", etiqueta: "gramos (g)" },
  { id: "kg", etiqueta: "kilos (kg)" },
  { id: "ml", etiqueta: "mililitros (ml)" },
  { id: "L", etiqueta: "litros (L)" },
];

const campo =
  "rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

interface InventarioFormProps {
  onSubmit: (ingrediente: BorradorInventoryIngredient) => void;
}

export default function InventarioForm({ onSubmit }: InventarioFormProps) {
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState<UnitCategory>("peso");
  const [unidadCompra, setUnidadCompra] = useState<Unit>("kg");
  const [precioTexto, setPrecioTexto] = useState("");

  const [conEquivalencia, setConEquivalencia] = useState(false);
  const [unidadPieza, setUnidadPieza] = useState<PieceUnit>("unidad");
  const [equivCantidadTexto, setEquivCantidadTexto] = useState("");
  const [unidadBase, setUnidadBase] = useState<"g" | "kg" | "ml" | "L">("g");

  const [error, setError] = useState<string | null>(null);

  function reiniciar() {
    setNombre("");
    setCategoria("peso");
    setUnidadCompra("kg");
    setPrecioTexto("");
    setConEquivalencia(false);
    setUnidadPieza("unidad");
    setEquivCantidadTexto("");
    setUnidadBase("g");
    setError(null);
  }

  function manejarSubmit(e: React.FormEvent) {
    e.preventDefault();

    const nombreLimpio = nombre.trim();
    const precio = parseCantidad(precioTexto);

    if (nombreLimpio === "") return setError("Ponele un nombre.");
    if (precio == null || precio < 0)
      return setError("El precio de compra tiene que ser un número válido.");

    let equivalencia: BorradorInventoryIngredient["equivalencia"];
    if (conEquivalencia) {
      const cant = parseCantidad(equivCantidadTexto);
      if (cant == null || cant <= 0)
        return setError("La cantidad de la equivalencia tiene que ser mayor que cero.");
      equivalencia = { unidadPieza, cantidad: cant, unidadBase };
    }

    onSubmit({
      nombre: nombreLimpio,
      categoria,
      unidadCompra,
      precioCompra: precio,
      equivalencia,
    });
    reiniciar();
  }

  return (
    <form
      onSubmit={manejarSubmit}
      className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
        Agregar al inventario
      </h3>

      <div className="flex flex-col gap-1">
        <label htmlFor="inv-nombre" className="text-sm font-medium">
          Nombre
        </label>
        <input
          id="inv-nombre"
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className={campo}
        />
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="inv-categoria" className="text-sm font-medium">
            Categoría
          </label>
          <select
            id="inv-categoria"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value as UnitCategory)}
            className={campo}
          >
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">Unidad de compra</span>
          <UnitSelector value={unidadCompra} onChange={setUnidadCompra} />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="inv-precio" className="text-sm font-medium">
            Precio por unidad de compra
          </label>
          <input
            id="inv-precio"
            type="text"
            inputMode="decimal"
            value={precioTexto}
            onChange={(e) => setPrecioTexto(e.target.value)}
            placeholder="0"
            className={`${campo} w-40`}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={conEquivalencia}
          onChange={(e) => setConEquivalencia(e.target.checked)}
        />
        Tiene equivalencia (pieza ↔ peso/volumen)
      </label>

      {conEquivalencia && (
        <div className="flex flex-wrap items-end gap-3 rounded-lg border border-dashed border-zinc-300 p-3 dark:border-zinc-700">
          <span className="text-sm">1</span>
          <select
            aria-label="Unidad de pieza"
            value={unidadPieza}
            onChange={(e) => setUnidadPieza(e.target.value as PieceUnit)}
            className={campo}
          >
            {PIEZAS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <span className="text-sm">=</span>
          <input
            type="text"
            inputMode="decimal"
            aria-label="Cantidad equivalente"
            value={equivCantidadTexto}
            onChange={(e) => setEquivCantidadTexto(e.target.value)}
            placeholder="0"
            className={`${campo} w-24`}
          />
          <select
            aria-label="Unidad base"
            value={unidadBase}
            onChange={(e) =>
              setUnidadBase(e.target.value as "g" | "kg" | "ml" | "L")
            }
            className={campo}
          >
            {BASES.map((b) => (
              <option key={b.id} value={b.id}>
                {b.etiqueta}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          Agregar
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
