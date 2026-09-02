"use client";

import { useMemo, useState } from "react";
import type { InventoryIngredient, Receta } from "../lib/types";
import { computeIngredientCost } from "../lib/conversion";
import { colors, numeric } from "../lib/tokens";
import { Card, Money, formatMoney, inputStyle } from "./ui";

interface EscaladorRecetaProps {
  receta: Receta;
  inventario: InventoryIngredient[];
}

export function EscaladorReceta({ receta, inventario }: EscaladorRecetaProps) {
  const rinde = receta.unidadRendimiento ?? "porciones";
  const [deseada, setDeseada] = useState(receta.porciones);

  const inventarioMap = useMemo(
    () => Object.fromEntries(inventario.map((i) => [i.id, i])),
    [inventario],
  );

  const ratio = receta.porciones > 0 && deseada > 0 ? deseada / receta.porciones : 1;

  const filas = receta.ingredientes.map((ri) => {
    const ing = inventarioMap[ri.ingredientId];
    const nombre = ing?.nombre ?? ri.ingredientId;
    const alGusto = ri.alGusto || ri.cantidad === null || ri.unidad === null;
    const cantidad = alGusto ? null : (ri.cantidad as number) * ratio;

    let costo: number | null = null;
    if (!alGusto && ing && cantidad !== null && ri.unidad) {
      try {
        costo = computeIngredientCost(ing, cantidad, ri.unidad);
      } catch {
        costo = null;
      }
    }
    return { nombre, unidad: ri.unidad, cantidad, alGusto, costo };
  });

  const total = filas.reduce((acc, f) => acc + (f.costo ?? 0), 0);
  const porUnidad = deseada > 0 ? total / deseada : 0;

  return (
    <Card style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: colors.text }}>
          Escalar producción — {receta.nombre}
        </h3>
        <p style={{ fontSize: 13, color: colors.textMuted, margin: "4px 0 0" }}>
          Receta base rinde <span style={numeric}>{receta.porciones}</span> {rinde}.
        </p>
      </div>

      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: colors.textMuted }}>
        Quiero producir
        <input
          type="number"
          min={0}
          value={deseada}
          onChange={(e) => setDeseada(Number(e.target.value))}
          style={{ ...inputStyle, width: 90 }}
        />
        {rinde}
        <span style={{ color: colors.textFaint }}>· ratio ×{Number(ratio.toFixed(2))}</span>
      </label>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {filas.map((f, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              border: `1px solid ${colors.border}`,
              borderRadius: 8,
              padding: "8px 12px",
              fontSize: 13,
            }}
          >
            <span style={{ color: colors.text }}>{f.nombre}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <span style={{ ...numeric, color: colors.textMuted }}>
                {f.alGusto || f.cantidad === null
                  ? "a gusto"
                  : `${Number(f.cantidad.toFixed(2))} ${f.unidad}`}
              </span>
              <span style={{ ...numeric, color: colors.textMuted, minWidth: 90, textAlign: "right" }}>
                {f.costo === null ? "—" : formatMoney(f.costo)}
              </span>
            </span>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          borderTop: `1px solid ${colors.border}`,
          paddingTop: 10,
        }}
      >
        <span style={{ fontSize: 13, color: colors.textMuted }}>
          Costo total <Money value={total} />
        </span>
        <span style={{ fontSize: 14, color: colors.textMuted }}>
          Por {rinde.replace(/s$/, "")} <Money value={porUnidad} alert />
        </span>
      </div>
    </Card>
  );
}
