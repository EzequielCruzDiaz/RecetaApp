"use client";

import Link from "next/link";
import type { InventoryIngredient, Receta } from "@/lib/types";
import { computeRecipeCost } from "@/lib/conversion";
import { colors, font, numeric } from "@/lib/tokens";
import { Card, InitialChip, Money, categoriaColor } from "./ui";

interface DashboardProps {
  recetas: Receta[];
  inventario: InventoryIngredient[];
}

const STAT_ICON = {
  book: (
    <path d="M10 5.5c-1.3-1-3.4-1.5-6-1.5v11c2.6 0 4.7.5 6 1.5m0-11c1.3-1 3.4-1.5 6-1.5v11c-2.6 0-4.7.5-6 1.5" />
  ),
  money: <path d="M10 6.5v7M12.2 8c0-1-1-1.6-2.2-1.6S7.8 7 7.8 8c0 2 4.4 1 4.4 3s-1.3 1.6-2.2 1.6-2.2-.6-2.2-1.6" />,
  box: <path d="M3 6.5l7-3.5 7 3.5-7 3.5-7-3.5zm0 0v7l7 3.5 7-3.5v-7" />,
  warn: <path d="M10 3l7.5 13.5H2.5zM10 8v4M10 14.2v.1" />,
};

function Stat({
  icon,
  iconColor,
  label,
  children,
}: {
  icon: React.ReactNode;
  iconColor: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Card style={{ display: "flex", flexDirection: "column", gap: 8, padding: "18px 18px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 8,
            background: `${iconColor}22`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: iconColor,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            {icon}
          </svg>
        </div>
        <span style={{ fontSize: 11.5, color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>
          {label}
        </span>
      </div>
      <span style={{ fontFamily: font.family, fontSize: 21, fontWeight: 700, color: colors.text, ...numeric }}>
        {children}
      </span>
    </Card>
  );
}

function HeroBanner() {
  return (
    <div
      style={{
        position: "relative",
        borderRadius: 20,
        overflow: "hidden",
        marginBottom: 28,
        background: colors.text,
        display: "grid",
        gridTemplateColumns: "1.2fr 1fr",
        minHeight: 160,
      }}
    >
      <div style={{ padding: "28px 30px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 8, zIndex: 1 }}>
        <div style={{ fontFamily: font.family, fontStyle: "italic", fontWeight: 500, fontSize: 19, color: colors.bg }}>
          Del fogón a la factura.
        </div>
        <div style={{ fontSize: 13.5, color: "#C9CFC4", maxWidth: 340 }}>
          Costeá cada plato al centavo, controlá el inventario y no se te va ni un plátano sin registrar.
        </div>
      </div>
      <div
        style={{
          background: `radial-gradient(circle at 25% 35%, ${colors.secondary}, transparent 60%), radial-gradient(circle at 85% 80%, ${colors.accent}, transparent 55%), linear-gradient(135deg, #33422F, ${colors.text})`,
        }}
      />
    </div>
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
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <HeroBanner />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 28 }}>
        <Stat icon={STAT_ICON.book} iconColor={colors.secondary} label="Recetas costeadas">
          {recetas.length}
        </Stat>
        <Stat icon={STAT_ICON.money} iconColor={colors.positive} label="Costo prom. / porción">
          <Money value={promedioPorPorcion} />
        </Stat>
        <Stat icon={STAT_ICON.box} iconColor={colors.text} label="Ingredientes">
          {inventario.length}
        </Stat>
        <Stat icon={STAT_ICON.warn} iconColor={colors.accent} label="Stock bajo">
          <span style={{ color: bajoStock.length > 0 ? colors.accent : colors.text }}>{bajoStock.length}</span>
        </Stat>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <h3 style={{ fontFamily: font.family, fontSize: 15, fontWeight: 600, margin: 0, color: colors.text }}>
              Recetas recientes
            </h3>
            <Link href="/recetas" style={{ fontSize: 12, color: colors.accent, textDecoration: "none", fontWeight: 600 }}>
              Ver todas →
            </Link>
          </div>
          {costeos.slice(0, 5).map((c) => {
            const color = categoriaColor(c.receta.categoria);
            return (
              <div key={c.receta.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <InitialChip label={c.receta.nombre[0]} color={color} />
                <span style={{ flex: 1, fontSize: 13.5, color: colors.text }}>{c.receta.nombre}</span>
                <span style={{ fontSize: 13, color: colors.textMuted, ...numeric }}>
                  <Money value={c.costoPorPorcion} /> / {c.receta.unidadRendimiento ?? "porción"}
                </span>
              </div>
            );
          })}
          {costeos.length === 0 && (
            <p style={{ fontSize: 13, color: colors.textFaint, margin: 0 }}>Todavía no hay recetas.</p>
          )}
        </Card>

        <Card style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <h3 style={{ fontFamily: font.family, fontSize: 15, fontWeight: 600, margin: 0, color: colors.text }}>
              Stock bajo
            </h3>
            <Link href="/inventario" style={{ fontSize: 12, color: colors.accent, textDecoration: "none", fontWeight: 600 }}>
              Ir a inventario →
            </Link>
          </div>
          {bajoStock.map((i) => (
            <div key={i.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13.5 }}>
              <span style={{ color: colors.text }}>{i.nombre}</span>
              <span style={{ color: colors.accent, fontWeight: 700, ...numeric }}>
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
