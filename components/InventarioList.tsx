"use client";

import type { InventoryIngredient, UnitCategory } from "@/lib/types";
import { colors, font, numeric, radius } from "@/lib/tokens";
import { Badge, Money, formatMoney } from "./ui";

interface InventarioListProps {
  inventario: InventoryIngredient[];
  onUpdate: (id: string, patch: Partial<InventoryIngredient>) => void;
  onRemove: (id: string) => void;
}

const CATEGORIA_ICON: Record<UnitCategory, React.ReactNode> = {
  peso: <path d="M10 3v3M4 6h12M6 6l-3 6a3 3 0 006 0zM14 6l-3 6a3 3 0 006 0z" />,
  volumen: <path d="M10 3c2.5 3 4.5 6 4.5 8.5a4.5 4.5 0 11-9 0C5.5 9 7.5 6 10 3z" />,
  pieza: <path d="M3 6.5l7-3.5 7 3.5-7 3.5-7-3.5zm0 0v7l7 3.5 7-3.5v-7" />,
};

const miniInput: React.CSSProperties = {
  width: 60,
  fontSize: 15,
  fontWeight: 700,
  padding: "2px 4px",
  border: "none",
  borderBottom: `1.5px solid ${colors.border}`,
  background: "transparent",
  color: colors.text,
  fontFamily: "inherit",
  textAlign: "right",
  ...numeric,
};

export function InventarioList({ inventario, onUpdate, onRemove }: InventarioListProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {inventario.map((ing) => {
        const bajo = ing.stock <= ing.stockMinimo;
        const tint = bajo ? colors.accent : colors.text;
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
              borderRadius: radius.lg,
              padding: "14px 16px",
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: bajo ? `${colors.accent}22` : `${colors.text}14`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: tint,
                flexShrink: 0,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                {CATEGORIA_ICON[ing.categoria]}
              </svg>
            </div>

            <div style={{ flex: 1, minWidth: 140 }}>
              <div style={{ fontFamily: font.family, fontSize: 14.5, fontWeight: 600, color: colors.text }}>
                {ing.nombre}
              </div>
              <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                {formatMoney(ing.precioCompra)} / {ing.unidadCompra}
              </div>
            </div>

            <label style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: 11, color: colors.textFaint }}>Stock actual</div>
              <div>
                <input
                  type="number"
                  value={ing.stock}
                  onChange={(e) => onUpdate(ing.id, { stock: Number(e.target.value) })}
                  style={{ ...miniInput, color: tint }}
                />{" "}
                <span style={{ fontSize: 11, fontWeight: 500, color: colors.textMuted }}>{ing.unidadCompra}</span>
              </div>
            </label>

            <label
              style={{
                textAlign: "right",
                flexShrink: 0,
                paddingLeft: 16,
                borderLeft: `1px solid ${colors.border}`,
              }}
            >
              <div style={{ fontSize: 11, color: colors.textFaint }}>Mínimo requerido</div>
              <input
                type="number"
                value={ing.stockMinimo}
                onChange={(e) => onUpdate(ing.id, { stockMinimo: Number(e.target.value) })}
                style={{ ...miniInput, fontSize: 14, fontWeight: 600, color: colors.textMuted, width: 50 }}
              />
            </label>

            <div style={{ width: 92, textAlign: "right", flexShrink: 0 }}>
              <Badge label={bajo ? "Stock bajo" : "OK"} color={bajo ? colors.accent : colors.positive} />
              <div style={{ fontSize: 11.5, color: colors.textMuted, marginTop: 4, ...numeric }}>
                <Money value={ing.stock * ing.precioCompra} />
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
                fontSize: 12,
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
