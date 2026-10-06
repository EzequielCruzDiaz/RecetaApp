"use client";

import { useState } from "react";
import type { InventoryIngredient, Receta, RecetaIngrediente } from "@/lib/types";
import { computeRecipeCost } from "@/lib/conversion";
import { colors, font, numeric, radius } from "@/lib/tokens";
import { buttonStyle, formatMoney, inputStyle, NumberInput, Select } from "./ui";
import { IngredientRow } from "./IngredientRow";

interface RecipeFormProps {
  inventario: InventoryIngredient[];
  recetaInicial?: Receta;
  onGuardar: (receta: Receta) => void;
}

export function RecipeForm({ inventario, recetaInicial, onGuardar }: RecipeFormProps) {
  const [nombre, setNombre] = useState(recetaInicial?.nombre ?? "");
  const [categoria, setCategoria] = useState(recetaInicial?.categoria ?? "");
  const [porciones, setPorciones] = useState(recetaInicial?.porciones ?? 4);
  const [unidadRendimiento, setUnidadRendimiento] = useState(
    recetaInicial?.unidadRendimiento ?? "porciones",
  );
  const [ingredientes, setIngredientes] = useState<RecetaIngrediente[]>(
    recetaInicial?.ingredientes ?? [],
  );

  const inventarioMap = Object.fromEntries(inventario.map((i) => [i.id, i]));
  const disponibles = inventario.filter(
    (i) => !ingredientes.some((ri) => ri.ingredientId === i.id),
  );

  const { costoTotal, costoPorPorcion } = computeRecipeCost(
    { id: "temp", nombre, porciones, unidadRendimiento, ingredientes },
    inventarioMap,
  );

  function agregarIngrediente(ingredientId: string) {
    const ing = inventarioMap[ingredientId];
    if (!ing) return;
    setIngredientes([
      ...ingredientes,
      { ingredientId, cantidad: 0, unidad: ing.unidadCompra, alGusto: false },
    ]);
  }

  function guardar() {
    if (nombre.trim() === "" || ingredientes.length === 0) return;
    onGuardar({
      id: recetaInicial?.id ?? crypto.randomUUID(),
      nombre: nombre.trim(),
      categoria: categoria.trim() || undefined,
      porciones,
      unidadRendimiento: unidadRendimiento.trim() || "porciones",
      ingredientes,
    });
    if (!recetaInicial) {
      setNombre("");
      setCategoria("");
      setPorciones(4);
      setIngredientes([]);
    }
  }

  return (
    <div
      style={{
        background: "#FFFDF8",
        border: "1.5px dashed #D8C7A8",
        borderRadius: radius.xl,
        padding: 22,
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <div>
        <h3 style={{ fontFamily: font.family, fontSize: 16, fontWeight: 600, margin: 0, color: colors.text }}>
          {recetaInicial ? "Editar receta" : "Agregar una receta"}
        </h3>
        {!recetaInicial && (
          <p style={{ fontSize: 12, color: colors.textMuted, margin: "4px 0 0" }}>
            Elegí ingredientes del inventario y cuánto usa esta receta de cada uno — el costo se calcula solo.
          </p>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 10 }}>
        <label style={{ fontSize: 12, color: colors.textMuted }}>
          Nombre
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} style={inputStyle} />
        </label>
        <label style={{ fontSize: 12, color: colors.textMuted }}>
          Categoría
          <input
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            placeholder="Acompañantes"
            style={inputStyle}
          />
        </label>
        <label style={{ fontSize: 12, color: colors.textMuted }}>
          Rendimiento
          <NumberInput
            min={1}
            value={porciones}
            onChange={setPorciones}
            style={{ ...inputStyle, ...numeric }}
          />
        </label>
        <label style={{ fontSize: 12, color: colors.textMuted }}>
          Unidad de rendimiento
          <input
            value={unidadRendimiento}
            onChange={(e) => setUnidadRendimiento(e.target.value)}
            placeholder="porciones / lb / unidades"
            style={inputStyle}
          />
        </label>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted }}>Ingredientes</span>
        {ingredientes.map((ri, index) => {
          const ing = inventarioMap[ri.ingredientId];
          if (!ing) return null;
          return (
            <IngredientRow
              key={ri.ingredientId}
              ingrediente={ing}
              value={ri}
              onChange={(v) => setIngredientes((prev) => prev.map((x, i) => (i === index ? v : x)))}
              onRemove={() => setIngredientes((prev) => prev.filter((_, i) => i !== index))}
            />
          );
        })}
        {disponibles.length > 0 && (
          <Select
            value=""
            onChange={(v) => v && agregarIngrediente(v)}
            placeholder="+ Agregar ingrediente"
            options={disponibles.map((i) => ({ value: i.id, label: i.nombre }))}
            style={{ marginTop: 6 }}
          />
        )}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderTop: `1px solid ${colors.border}`,
          paddingTop: 12,
        }}
      >
        <div style={{ fontSize: 13, color: colors.textMuted }}>
          <span style={numeric}>Total {formatMoney(costoTotal)}</span>
          {"  ·  "}
          <span style={{ ...numeric, color: colors.accent, fontWeight: 700 }}>
            {formatMoney(costoPorPorcion)} / {unidadRendimiento.replace(/s$/, "") || "porción"}
          </span>
        </div>
        <button type="button" onClick={guardar} style={buttonStyle}>
          {recetaInicial ? "Guardar cambios" : "Guardar receta"}
        </button>
      </div>
    </div>
  );
}
