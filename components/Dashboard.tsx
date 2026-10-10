"use client";

import Link from "next/link";
import type { Factura, InventoryIngredient, Receta } from "@/lib/types";
import { computeRecipeCost } from "@/lib/conversion";
import { colors, font, numeric, radius, shadow } from "@/lib/tokens";
import { Card, Money, Mosaico, SectionTitle, StockMeter, categoriaColor, formatMoney, unidadSingular } from "./ui";

interface DashboardProps {
  recetas: Receta[];
  inventario: InventoryIngredient[];
  facturas: Factura[];
}

const linkStyle: React.CSSProperties = {
  fontSize: 13,
  color: colors.accent,
  textDecoration: "none",
  fontWeight: 800,
  whiteSpace: "nowrap",
};

function Stat({
  label,
  hint,
  alert,
  children,
}: {
  label: string;
  hint: string;
  alert?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        position: "relative",
        background: colors.surface,
        border: `1px solid ${alert ? `${colors.accent}55` : colors.border}`,
        borderRadius: radius.lg,
        boxShadow: shadow.card,
        padding: "16px 18px 15px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        overflow: "hidden",
      }}
    >
      <span style={{ fontSize: 11, color: colors.textMuted, textTransform: "uppercase", letterSpacing: 1, fontWeight: 800 }}>
        {label}
      </span>
      <span
        className="stat-valor"
        style={{
          fontFamily: font.display,
          fontSize: 30,
          fontWeight: 600,
          letterSpacing: -0.6,
          lineHeight: 1.1,
          color: alert ? colors.accent : colors.text,
          ...numeric,
        }}
      >
        {children}
      </span>
      <span style={{ fontSize: 12, color: colors.textFaint, fontWeight: 600 }}>{hint}</span>
    </div>
  );
}

function Pizarra({ costeos }: { costeos: { receta: Receta; costoPorPorcion: number }[] }) {
  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        background: colors.monte,
        color: colors.sidebarText,
        borderRadius: radius.xl,
        padding: "26px 28px 24px",
        height: "100%",
        boxShadow: shadow.raised,
        border: "6px solid #6B4A2F",
      }}
    >
      <Mosaico color={colors.mango} opacity={0.07} size={56} />
      <div style={{ position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, marginBottom: 4 }}>
          <h2
            style={{
              fontFamily: font.display,
              fontStyle: "italic",
              fontSize: 28,
              fontWeight: 500,
              margin: 0,
              color: colors.mango,
              letterSpacing: -0.4,
            }}
          >
            La pizarra
          </h2>
          <Link href="/recetas" style={{ ...linkStyle, color: colors.mango }}>
            Ver recetas →
          </Link>
        </div>
        <p style={{ fontSize: 13, color: colors.sidebarMuted, margin: "0 0 18px" }}>
          Lo que te cuesta cada plato, por porción.
        </p>

        {costeos.length === 0 && (
          <p style={{ fontSize: 14, color: colors.sidebarMuted, margin: 0 }}>Todavía no hay recetas en la pizarra.</p>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
          {costeos.slice(0, 8).map((c) => (
            <div key={c.receta.id} style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 2,
                  transform: "rotate(45deg) translateY(-2px)",
                  background: categoriaColor(c.receta.categoria),
                  boxShadow: "0 0 0 1.5px rgba(244,236,223,0.5)",
                  flexShrink: 0,
                }}
              />
              <span style={{ fontFamily: font.display, fontSize: 17, fontWeight: 500, minWidth: 0 }}>
                {c.receta.nombre}
              </span>
              <span className="lider" />
              <span style={{ fontSize: 15, fontWeight: 800, ...numeric, whiteSpace: "nowrap" }}>
                {formatMoney(c.costoPorPorcion)}
                <span style={{ fontSize: 11.5, fontWeight: 600, color: colors.sidebarMuted }}>
                  {" "}
                  /{unidadSingular(c.receta.unidadRendimiento ?? "porciones")}
                </span>
              </span>
            </div>
          ))}
        </div>
        {costeos.length > 8 && (
          <p style={{ fontSize: 12.5, color: colors.sidebarMuted, margin: "16px 0 0" }}>
            y {costeos.length - 8} más en Recetas.
          </p>
        )}
      </div>
    </div>
  );
}

function ListaCompras({ bajoStock }: { bajoStock: InventoryIngredient[] }) {
  return (
    <Card style={{ padding: "20px 22px" }}>
      <SectionTitle action={<Link href="/inventario" style={linkStyle}>Ir a inventario →</Link>}>
        Lista de compras
      </SectionTitle>
      {bajoStock.length === 0 ? (
        <p style={{ fontSize: 14, color: colors.positive, fontWeight: 700, margin: 0 }}>
          Todo está por encima del mínimo. ¡Nítido!
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {bajoStock.map((i) => {
            const falta = Math.max(0, i.stockMinimo - i.stock);
            return (
              <div key={i.id} style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
                  <span style={{ fontSize: 14.5, fontWeight: 700, color: colors.text }}>{i.nombre}</span>
                  <span style={{ fontSize: 12.5, color: colors.accent, fontWeight: 800, ...numeric, whiteSpace: "nowrap" }}>
                    {falta > 0 ? `faltan ${Number(falta.toFixed(2))} ${i.unidadCompra}` : "en el mínimo"}
                  </span>
                </div>
                <StockMeter stock={i.stock} minimo={i.stockMinimo} />
                <span style={{ fontSize: 11.5, color: colors.textFaint, fontWeight: 600, ...numeric }}>
                  Hay {i.stock} de {i.stockMinimo} {i.unidadCompra} mínimo
                </span>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function UltimasCompras({ facturas }: { facturas: Factura[] }) {
  const recientes = [...facturas].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 3);
  return (
    <Card style={{ padding: "20px 22px" }}>
      <SectionTitle action={<Link href="/facturas" style={linkStyle}>Registrar →</Link>}>Últimas compras</SectionTitle>
      {recientes.length === 0 ? (
        <p style={{ fontSize: 13.5, color: colors.textMuted, margin: 0 }}>
          Cuando registres una factura de un suplidor, aparece aquí.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {recientes.map((f, i) => (
            <div
              key={f.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "11px 0",
                borderTop: i === 0 ? "none" : `1px dashed ${colors.border}`,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: colors.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {f.proveedor}
                </div>
                <div style={{ fontSize: 12, color: colors.textFaint, fontWeight: 600, ...numeric }}>
                  {f.fecha} · {f.items.length} {f.items.length === 1 ? "ítem" : "ítems"}
                </div>
              </div>
              <span style={{ fontSize: 14, color: colors.text }}>
                <Money value={f.total} />
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export function Dashboard({ recetas, inventario, facturas }: DashboardProps) {
  const inventarioMap = Object.fromEntries(inventario.map((i) => [i.id, i]));

  const costeos = recetas.map((r) => ({
    receta: r,
    ...computeRecipeCost(r, inventarioMap),
  }));

  const promedioPorPorcion =
    costeos.length > 0
      ? costeos.reduce((acc, c) => acc + c.costoPorPorcion, 0) / costeos.length
      : 0;

  const valorInventario = inventario.reduce((acc, i) => acc + i.stock * i.precioCompra, 0);
  const bajoStock = inventario.filter((i) => i.stock <= i.stockMinimo);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div className="grid-stats">
        <Stat label="Recetas" hint="costeadas al centavo">
          {recetas.length}
        </Stat>
        <Stat label="Costo promedio" hint="por porción">
          {formatMoney(promedioPorPorcion)}
        </Stat>
        <Stat label="En almacén" hint={`${inventario.length} ingredientes`}>
          {formatMoney(valorInventario)}
        </Stat>
        <Stat label="Stock bajo" hint={bajoStock.length > 0 ? "hay que reponer" : "todo en orden"} alert={bajoStock.length > 0}>
          {bajoStock.length}
        </Stat>
      </div>

      <div className="grid-resumen">
        <Pizarra costeos={costeos} />
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <ListaCompras bajoStock={bajoStock} />
          <UltimasCompras facturas={facturas} />
        </div>
      </div>
    </div>
  );
}
