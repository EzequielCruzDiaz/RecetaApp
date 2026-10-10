"use client";

import { useState } from "react";
import type { InventoryIngredient, UnitCategory } from "@/lib/types";
import { colors, font, numeric, radius, shadow } from "@/lib/tokens";
import { Badge, Chip, NumberInput, StockMeter, formatMoney } from "./ui";

interface ListaInventarioProps {
  inventario: InventoryIngredient[];
  onUpdate: (id: string, patch: Partial<InventoryIngredient>) => void;
  onRemove: (id: string) => void;
}

const CATEGORIA_ICON: Record<UnitCategory, React.ReactNode> = {
  peso: <path d="M10 3v3M4 6h12M6 6l-3 6a3 3 0 006 0zM14 6l-3 6a3 3 0 006 0z" />,
  volumen: <path d="M10 3c2.5 3 4.5 6 4.5 8.5a4.5 4.5 0 11-9 0C5.5 9 7.5 6 10 3z" />,
  pieza: <path d="M3 6.5l7-3.5 7 3.5-7 3.5-7-3.5zm0 0v7l7 3.5 7-3.5v-7" />,
};

const CATEGORIA_TINTE: Record<UnitCategory, string> = {
  peso: "#8A6A3A",
  volumen: colors.caribe,
  pieza: colors.positive,
};

const FILTROS: { id: "todos" | "bajo" | UnitCategory; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "bajo", label: "Stock bajo" },
  { id: "peso", label: "Peso" },
  { id: "volumen", label: "Volumen" },
  { id: "pieza", label: "Pieza" },
];

const miniInput: React.CSSProperties = {
  width: 64,
  fontSize: 16,
  fontWeight: 800,
  padding: "3px 6px",
  border: `1px solid ${colors.border}`,
  borderRadius: 8,
  background: colors.surfaceAlt,
  color: colors.text,
  fontFamily: "inherit",
  textAlign: "right",
  ...numeric,
};

const etiqueta: React.CSSProperties = {
  fontSize: 10.5,
  fontWeight: 800,
  letterSpacing: 0.8,
  textTransform: "uppercase",
  color: colors.textFaint,
};

function Resumen({ label, children, alert }: { label: string; children: React.ReactNode; alert?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
      <span style={etiqueta}>{label}</span>
      <span
        style={{
          fontFamily: font.display,
          fontSize: 24,
          fontWeight: 600,
          letterSpacing: -0.4,
          color: alert ? colors.accent : colors.text,
          ...numeric,
        }}
      >
        {children}
      </span>
    </div>
  );
}

export function ListaInventario({ inventario, onUpdate, onRemove }: ListaInventarioProps) {
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]["id"]>("todos");

  const esBajo = (i: InventoryIngredient) => i.stock <= i.stockMinimo;
  const bajos = inventario.filter(esBajo).length;
  const valor = inventario.reduce((acc, i) => acc + i.stock * i.precioCompra, 0);

  const contar = (id: (typeof FILTROS)[number]["id"]) =>
    id === "todos" ? inventario.length : id === "bajo" ? bajos : inventario.filter((i) => i.categoria === id).length;

  const visibles = inventario.filter((i) =>
    filtro === "todos" ? true : filtro === "bajo" ? esBajo(i) : i.categoria === filtro,
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 16,
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: radius.lg,
          boxShadow: shadow.card,
          padding: "16px 20px",
        }}
      >
        <Resumen label="Ingredientes">{inventario.length}</Resumen>
        <Resumen label="Valor en almacén">{formatMoney(valor)}</Resumen>
        <Resumen label="Por reponer" alert={bajos > 0}>
          {bajos}
        </Resumen>
      </div>

      <div className="chips">
        {FILTROS.map((f) => {
          const n = contar(f.id);
          if (n === 0 && f.id !== "todos" && f.id !== "bajo") return null;
          return <Chip key={f.id} label={f.label} count={n} active={filtro === f.id} onClick={() => setFiltro(f.id)} />;
        })}
      </div>

      {visibles.length === 0 && (
        <p style={{ fontSize: 14, color: colors.positive, fontWeight: 700, margin: 0 }}>
          {filtro === "bajo" ? "Nada por reponer. Todo está sobre el mínimo." : "No hay ingredientes en este filtro."}
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {visibles.map((ing) => {
          const bajo = esBajo(ing);
          const tinte = CATEGORIA_TINTE[ing.categoria];
          return (
            <div
              key={ing.id}
              className="fila-inventario"
              style={{
                background: colors.surface,
                border: `1px solid ${bajo ? `${colors.accent}66` : colors.border}`,
                borderLeft: `4px solid ${bajo ? colors.accent : colors.border}`,
                borderRadius: radius.lg,
                boxShadow: shadow.card,
                padding: "14px 16px",
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  background: `${tinte}1A`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: tinte,
                }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  {CATEGORIA_ICON[ing.categoria]}
                </svg>
              </div>

              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 15.5, fontWeight: 800, color: colors.text }}>{ing.nombre}</div>
                <div style={{ fontSize: 12.5, color: colors.textMuted, marginTop: 2, fontWeight: 600, ...numeric }}>
                  {formatMoney(ing.precioCompra)} / {ing.unidadCompra}
                </div>
              </div>

              <div className="col-medidor" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <span style={etiqueta}>Hay</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <NumberInput
                      value={ing.stock}
                      onChange={(stock) => onUpdate(ing.id, { stock })}
                      aria-label={`Stock actual de ${ing.nombre}`}
                      style={{ ...miniInput, color: bajo ? colors.accent : colors.text }}
                    />
                    <span style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted }}>{ing.unidadCompra}</span>
                  </span>
                </label>
                <StockMeter stock={ing.stock} minimo={ing.stockMinimo} />
              </div>

              <label className="col-minimo">
                <span style={etiqueta}>Mínimo</span>
                <NumberInput
                  value={ing.stockMinimo}
                  onChange={(stockMinimo) => onUpdate(ing.id, { stockMinimo })}
                  aria-label={`Stock mínimo de ${ing.nombre}`}
                  style={{ ...miniInput, fontSize: 14, fontWeight: 700, color: colors.textMuted, width: 56 }}
                />
              </label>

              <div style={{ textAlign: "right" }}>
                <Badge label={bajo ? "Reponer" : "OK"} color={bajo ? colors.accent : colors.positive} />
                <div style={{ fontSize: 12.5, color: colors.textMuted, marginTop: 6, fontWeight: 700, ...numeric }}>
                  {formatMoney(ing.stock * ing.precioCompra)}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onRemove(ing.id)}
                aria-label={`Quitar ${ing.nombre}`}
                title="Quitar del inventario"
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 999,
                  border: `1px solid ${colors.border}`,
                  background: "transparent",
                  color: colors.textFaint,
                  cursor: "pointer",
                  fontSize: 12,
                }}
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
