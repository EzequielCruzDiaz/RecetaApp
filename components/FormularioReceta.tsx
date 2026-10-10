"use client";

import { useState } from "react";
import type { InventoryIngredient, Receta, RecetaIngrediente } from "@/lib/types";
import { computeRecipeCost } from "@/lib/conversion";
import { colors, font, numeric, radius } from "@/lib/tokens";
import { FormHeader, NumberInput, Select, buttonStyle, formPanelStyle, formatMoney, inputStyle, labelStyle, unidadSingular } from "./ui";
import { FilaIngrediente } from "./FilaIngrediente";

interface FormularioRecetaProps {
  inventario: InventoryIngredient[];
  recetaInicial?: Receta;
  onGuardar: (receta: Receta) => void;
}

export function FormularioReceta({ inventario, recetaInicial, onGuardar }: FormularioRecetaProps) {
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
    <div style={formPanelStyle}>
      <FormHeader
        title={recetaInicial ? "Editar receta" : "Nueva receta"}
        hint={
          recetaInicial
            ? undefined
            : "Elige ingredientes del inventario y cuánto lleva de cada uno. El costo se calcula solo."
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
        <label style={labelStyle}>
          Nombre
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Moro de guandules" style={inputStyle} />
        </label>
        <label style={labelStyle}>
          Categoría
          <input
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            placeholder="Acompañantes"
            style={inputStyle}
          />
        </label>
        <label style={labelStyle}>
          Rendimiento
          <NumberInput
            min={1}
            value={porciones}
            onChange={setPorciones}
            style={{ ...inputStyle, ...numeric }}
          />
        </label>
        <label style={labelStyle}>
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
        <span style={{ ...labelStyle, marginBottom: 4 }}>Ingredientes</span>
        {ingredientes.map((ri, index) => {
          const ing = inventarioMap[ri.ingredientId];
          if (!ing) return null;
          return (
            <FilaIngrediente
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
          gap: 16,
          flexWrap: "wrap",
          background: colors.surfaceAlt,
          border: `1px solid ${colors.border}`,
          borderRadius: radius.lg,
          padding: "12px 12px 12px 18px",
        }}
      >
        <div style={{ display: "flex", gap: 22, alignItems: "baseline", flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, color: colors.textMuted, fontWeight: 600 }}>
            La tanda <span style={{ ...numeric, color: colors.text, fontWeight: 800 }}>{formatMoney(costoTotal)}</span>
          </span>
          <span style={{ fontSize: 13, color: colors.textMuted, fontWeight: 600 }}>
            Por {unidadSingular(unidadRendimiento || "porciones")}{" "}
            <span style={{ ...numeric, fontFamily: font.display, fontSize: 22, color: colors.text, fontWeight: 600 }}>
              {formatMoney(costoPorPorcion)}
            </span>
          </span>
        </div>
        <button type="button" onClick={guardar} style={buttonStyle}>
          {recetaInicial ? "Guardar cambios" : "Guardar receta"}
        </button>
      </div>
    </div>
  );
}
