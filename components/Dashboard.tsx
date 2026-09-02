"use client";

import Link from "next/link";
import type { InventoryIngredient, Receta } from "../lib/types";
import { computeRecipeCost } from "../lib/conversion";
import { colors, numeric } from "../lib/tokens";
import { Card, Money } from "./ui";

interface DashboardProps {
  recetas: Receta[];
  inventario: InventoryIngredient[];
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Card style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 12, color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.4 }}>
        {label}
      </span>
      <span style={{ fontSize: 22, fontWeight: 700, color: colors.text, ...numeric }}>{children}</span>
    </Card>
  );
}

export function Dashboard({ recetas, inventario }: DashboardProps) {
  const inventarioMap = Object.fromEntries(inventario.map((i) => [i.id, i]));

  const costeos = recetas.map((r) => ({
    receta: r,
    ...computeRecipeCost(r, inventarioMap),
  }));

  const promedioPorPorcion =
    costeos.length > 0
      ? costeos.reduce((acc, c) => acc + c.costoPorPorcion, 0) / costeos.length
      : 0;

  const bajoStock = inventario.filter((i) => i.stock <= i.stockMinimo);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        <Stat label="Recetas costeadas">{recetas.length}</Stat>
        <Stat label="Costo prom. / porción">
          <Money value={promedioPorPorcion} />
        </Stat>
        <Stat label="Ingredientes en inventario">{inventario.length}</Stat>
        <Stat label="Stock bajo">
          <span style={{ color: bajoStock.length > 0 ? colors.accent : colors.text }}>
            {bajoStock.length}
          </span>
        </Stat>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: colors.text }}>Recetas recientes</h3>
            <Link href="/recetas" style={{ fontSize: 12, color: colors.accent, textDecoration: "none" }}>
              Ver todas
            </Link>
          </div>
          {costeos.slice(0, 6).map((c) => (
            <div key={c.receta.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: colors.text }}>{c.receta.nombre}</span>
              <span style={{ ...numeric, color: colors.textMuted }}>
                <Money value={c.costoPorPorcion} /> / {c.receta.unidadRendimiento ?? "porción"}
              </span>
            </div>
          ))}
          {costeos.length === 0 && (
            <p style={{ fontSize: 13, color: colors.textFaint, margin: 0 }}>Todavía no hay recetas.</p>
          )}
        </Card>

        <Card style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: colors.text }}>Stock bajo</h3>
            <Link href="/inventario" style={{ fontSize: 12, color: colors.accent, textDecoration: "none" }}>
              Ir a inventario
            </Link>
          </div>
          {bajoStock.map((i) => (
            <div key={i.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: colors.text }}>{i.nombre}</span>
              <span style={{ ...numeric, color: colors.accent }}>
                {i.stock} / {i.stockMinimo} {i.unidadCompra}
              </span>
            </div>
          ))}
          {bajoStock.length === 0 && (
            <p style={{ fontSize: 13, color: colors.positive, margin: 0 }}>Todo el inventario sobre el mínimo.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
