"use client";

import type { InventoryIngredient } from "@/lib/types";
import { colors, numeric, radius } from "@/lib/tokens";
import { Money, formatMoney } from "./ui";

interface InventarioListProps {
  inventario: InventoryIngredient[];
  onUpdate: (id: string, patch: Partial<InventoryIngredient>) => void;
  onRemove: (id: string) => void;
}

const miniInput: React.CSSProperties = {
  width: 64,
  fontSize: 13,
  padding: "4px 6px",
  border: `1px solid ${colors.border}`,
  borderRadius: radius.sm,
  background: colors.surface,
  color: colors.text,
  fontFamily: "inherit",
  ...numeric,
};

export function InventarioList({ inventario, onUpdate, onRemove }: InventarioListProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {inventario.map((ing) => {
        const bajo = ing.stock <= ing.stockMinimo;
        return (
          <div
            key={ing.id}
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 16,
              background: colors.surface,
              border: `1px solid ${bajo ? colors.accent : colors.border}`,
              borderRadius: radius.md,
              padding: "12px 14px",
            }}
          >
            <div style={{ flex: 1, minWidth: 160 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: colors.text }}>{ing.nombre}</div>
              <div style={{ fontSize: 12, color: colors.textMuted }}>
                {ing.categoria} · {formatMoney(ing.precioCompra)} / {ing.unidadCompra}
              </div>
            </div>

            <label style={{ fontSize: 12, color: colors.textMuted, display: "flex", flexDirection: "column", gap: 2 }}>
              Stock ({ing.unidadCompra})
              <input
                type="number"
                value={ing.stock}
                onChange={(e) => onUpdate(ing.id, { stock: Number(e.target.value) })}
                style={miniInput}
              />
            </label>

            <label style={{ fontSize: 12, color: colors.textMuted, display: "flex", flexDirection: "column", gap: 2 }}>
              Mínimo
              <input
                type="number"
                value={ing.stockMinimo}
                onChange={(e) => onUpdate(ing.id, { stockMinimo: Number(e.target.value) })}
                style={miniInput}
              />
            </label>

            <div style={{ minWidth: 96, textAlign: "right" }}>
              {bajo ? (
                <span style={{ fontSize: 12, fontWeight: 600, color: colors.accent }}>Stock bajo</span>
              ) : (
                <span style={{ fontSize: 12, color: colors.positive }}>OK</span>
              )}
              <div style={{ fontSize: 12, color: colors.textMuted, ...numeric }}>
                Valor <Money value={ing.stock * ing.precioCompra} />
              </div>
            </div>

            <button
              type="button"
              onClick={() => onRemove(ing.id)}
              aria-label={`Quitar ${ing.nombre}`}
              style={{
                border: "none",
                background: "transparent",
                color: colors.textFaint,
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              Quitar
            </button>
          </div>
        );
      })}
    </div>
  );
}
