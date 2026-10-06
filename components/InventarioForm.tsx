"use client";

import { useState } from "react";
import type { BorradorInventoryIngredient, PieceUnit, Unit, UnitCategory } from "@/lib/types";
import { colors, font, numeric, radius } from "@/lib/tokens";
import { buttonStyle, inputStyle, NumberInput, Select } from "./ui";

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
        background: "#FFFDF8",
        border: "1.5px dashed #D8C7A8",
        borderRadius: radius.xl,
        padding: 22,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <h3 style={{ fontFamily: font.family, fontSize: 16, fontWeight: 600, margin: 0, color: colors.text }}>
        Agregar ingrediente
      </h3>

      <input
        placeholder="Nombre"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        style={inputStyle}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10 }}>
        <label style={{ fontSize: 12, color: colors.textMuted }}>
          Categoría
          <Select
            value={categoria}
            onChange={(v) => setCategoria(v as UnitCategory)}
            options={[
              { value: "peso", label: "peso" },
              { value: "volumen", label: "volumen" },
              { value: "pieza", label: "pieza" },
            ]}
            style={{ marginTop: 4 }}
          />
        </label>
        <label style={{ fontSize: 12, color: colors.textMuted }}>
          Unidad de compra
          <Select
            value={unidadCompra}
            onChange={(v) => setUnidadCompra(v as Unit)}
            options={[
              { value: "g", label: "g", group: "Peso" },
              { value: "kg", label: "kg", group: "Peso" },
              { value: "lb", label: "lb", group: "Peso" },
              { value: "oz", label: "oz", group: "Peso" },
              { value: "ml", label: "ml", group: "Volumen" },
              { value: "L", label: "L", group: "Volumen" },
              { value: "taza", label: "taza", group: "Volumen" },
              { value: "galon", label: "galón", group: "Volumen" },
              ...PIEZAS.map((p) => ({ value: p, label: p, group: "Pieza" })),
            ]}
            style={{ marginTop: 4 }}
          />
        </label>
        <label style={{ fontSize: 12, color: colors.textMuted }}>
          Precio / unidad
          <NumberInput
            value={precioCompra}
            onChange={setPrecioCompra}
            style={{ ...inputStyle, ...numeric }}
          />
        </label>
        <label style={{ fontSize: 12, color: colors.textMuted, display: "flex", flexDirection: "column", gap: 4 }}>
          Stock actual
          <NumberInput
            value={stock}
            onChange={setStock}
            style={{ ...inputStyle, ...numeric }}
          />
          <span style={{ fontSize: 10.5, color: colors.textFaint }}>Cuánto hay ahora mismo en el almacén.</span>
        </label>
        <label style={{ fontSize: 12, color: colors.textMuted, display: "flex", flexDirection: "column", gap: 4 }}>
          Stock mínimo
          <NumberInput
            value={stockMinimo}
            onChange={setStockMinimo}
            style={{ ...inputStyle, ...numeric }}
          />
          <span style={{ fontSize: 10.5, color: colors.textFaint }}>
            Cuando el stock actual llegue a este número, aparece como &quot;Stock bajo&quot;.
          </span>
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
          <Select
            value={unidadPieza}
            onChange={(v) => setUnidadPieza(v as PieceUnit)}
            options={PIEZAS.map((p) => ({ value: p, label: p }))}
            style={{ width: 120 }}
          />
          <span style={{ fontSize: 13, color: colors.textMuted }}>=</span>
          <NumberInput
            value={equivCantidad}
            onChange={setEquivCantidad}
            style={{ ...inputStyle, width: 90, ...numeric }}
          />
          <Select
            value={unidadBase}
            onChange={(v) => setUnidadBase(v as "g" | "kg" | "ml" | "L")}
            options={[
              { value: "g", label: "g" },
              { value: "kg", label: "kg" },
              { value: "ml", label: "ml" },
              { value: "L", label: "L" },
            ]}
            style={{ width: 90 }}
          />
        </div>
      )}

      <button type="submit" style={{ ...buttonStyle, alignSelf: "flex-start" }}>
        Guardar ingrediente
      </button>
    </form>
  );
}
