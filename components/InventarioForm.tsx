"use client";

import { useState } from "react";
import type { BorradorInventoryIngredient, PieceUnit, Unit, UnitCategory } from "@/lib/types";
import { colors, numeric, radius } from "@/lib/tokens";
import { buttonStyle, inputStyle } from "./ui";

const PIEZAS: PieceUnit[] = ["unidad", "docena", "diente", "atado", "lata", "paquete", "saco", "caja"];

interface InventarioFormProps {
  onSubmit: (ingrediente: BorradorInventoryIngredient) => void;
}

export function InventarioForm({ onSubmit }: InventarioFormProps) {
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState<UnitCategory>("peso");
  const [unidadCompra, setUnidadCompra] = useState<Unit>("kg");
  const [precioCompra, setPrecioCompra] = useState(0);
  const [stock, setStock] = useState(0);
  const [stockMinimo, setStockMinimo] = useState(0);
  const [conEquivalencia, setConEquivalencia] = useState(false);
  const [unidadPieza, setUnidadPieza] = useState<PieceUnit>("unidad");
  const [equivCantidad, setEquivCantidad] = useState(0);
  const [unidadBase, setUnidadBase] = useState<"g" | "kg" | "ml" | "L">("g");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) return;
    onSubmit({
      nombre: nombre.trim(),
      categoria,
      unidadCompra,
      precioCompra,
      stock,
      stockMinimo,
      equivalencia: conEquivalencia
        ? { unidadPieza, cantidad: equivCantidad, unidadBase }
        : undefined,
    });
    setNombre("");
    setPrecioCompra(0);
    setStock(0);
    setStockMinimo(0);
    setConEquivalencia(false);
    setEquivCantidad(0);
  }

  return (
    <form
      onSubmit={submit}
      style={{
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: radius.md,
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0, color: colors.text }}>Agregar ingrediente</h3>

      <input
        placeholder="Nombre"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        style={inputStyle}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10 }}>
        <label style={{ fontSize: 12, color: colors.textMuted }}>
          Categoría
          <select value={categoria} onChange={(e) => setCategoria(e.target.value as UnitCategory)} style={inputStyle}>
            <option value="peso">peso</option>
            <option value="volumen">volumen</option>
            <option value="pieza">pieza</option>
          </select>
        </label>
        <label style={{ fontSize: 12, color: colors.textMuted }}>
          Unidad de compra
          <select value={unidadCompra} onChange={(e) => setUnidadCompra(e.target.value as Unit)} style={inputStyle}>
            <optgroup label="Peso">
              <option value="g">g</option>
              <option value="kg">kg</option>
              <option value="lb">lb</option>
              <option value="oz">oz</option>
            </optgroup>
            <optgroup label="Volumen">
              <option value="ml">ml</option>
              <option value="L">L</option>
              <option value="taza">taza</option>
              <option value="galon">galón</option>
            </optgroup>
            <optgroup label="Pieza">
              {PIEZAS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </optgroup>
          </select>
        </label>
        <label style={{ fontSize: 12, color: colors.textMuted }}>
          Precio / unidad
          <input
            type="number"
            value={precioCompra}
            onChange={(e) => setPrecioCompra(Number(e.target.value))}
            style={{ ...inputStyle, ...numeric }}
          />
        </label>
        <label style={{ fontSize: 12, color: colors.textMuted }}>
          Stock actual
          <input
            type="number"
            value={stock}
            onChange={(e) => setStock(Number(e.target.value))}
            style={{ ...inputStyle, ...numeric }}
          />
        </label>
        <label style={{ fontSize: 12, color: colors.textMuted }}>
          Stock mínimo
          <input
            type="number"
            value={stockMinimo}
            onChange={(e) => setStockMinimo(Number(e.target.value))}
            style={{ ...inputStyle, ...numeric }}
          />
        </label>
      </div>

      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: colors.textMuted }}>
        <input
          type="checkbox"
          checked={conEquivalencia}
          onChange={(e) => setConEquivalencia(e.target.checked)}
          style={{ accentColor: colors.accent }}
        />
        Tiene equivalencia (pieza ↔ peso/volumen)
      </label>

      {conEquivalencia && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, color: colors.textMuted }}>1</span>
          <select value={unidadPieza} onChange={(e) => setUnidadPieza(e.target.value as PieceUnit)} style={{ ...inputStyle, width: "auto" }}>
            {PIEZAS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <span style={{ fontSize: 13, color: colors.textMuted }}>=</span>
          <input
            type="number"
            value={equivCantidad}
            onChange={(e) => setEquivCantidad(Number(e.target.value))}
            style={{ ...inputStyle, width: 90, ...numeric }}
          />
          <select value={unidadBase} onChange={(e) => setUnidadBase(e.target.value as "g" | "kg" | "ml" | "L")} style={{ ...inputStyle, width: "auto" }}>
            <option value="g">g</option>
            <option value="kg">kg</option>
            <option value="ml">ml</option>
            <option value="L">L</option>
          </select>
        </div>
      )}

      <button type="submit" style={{ ...buttonStyle, alignSelf: "flex-start" }}>
        Agregar
      </button>
    </form>
  );
}
