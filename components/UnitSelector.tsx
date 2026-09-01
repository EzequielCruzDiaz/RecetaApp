"use client";

import { UNIDADES, UNIDADES_POR_CATEGORIA } from "@/lib/conversion";
import type { Unit, UnitCategory } from "@/lib/types";

const ORDEN_CATEGORIAS: UnitCategory[] = ["peso", "volumen", "pieza"];

const ETIQUETA_CATEGORIA: Record<UnitCategory, string> = {
  peso: "Peso",
  volumen: "Volumen",
  pieza: "Pieza",
};

interface UnitSelectorProps {
  value: Unit;
  onChange: (unidad: Unit) => void;
  categoria?: UnitCategory;
  id?: string;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}

export default function UnitSelector({
  value,
  onChange,
  categoria,
  id,
  disabled,
  className,
  "aria-label": ariaLabel,
}: UnitSelectorProps) {
  const categorias = categoria ? [categoria] : ORDEN_CATEGORIAS;

  return (
    <select
      id={id}
      value={value}
      disabled={disabled}
      aria-label={ariaLabel ?? "Unidad"}
      onChange={(e) => onChange(e.target.value as Unit)}
      className={
        "rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm " +
        "text-zinc-900 shadow-sm outline-none focus:border-zinc-500 " +
        "disabled:cursor-not-allowed disabled:opacity-50 " +
        "dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 " +
        (className ?? "")
      }
    >
      {categorias.map((cat) => (
        <optgroup key={cat} label={ETIQUETA_CATEGORIA[cat]}>
          {UNIDADES_POR_CATEGORIA[cat].map((u) => (
            <option key={u.id} value={u.id}>
              {UNIDADES[u.id].nombre} ({u.abreviatura})
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
