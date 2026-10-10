import type { InventoryIngredient, Receta } from "@/lib/types";
import { computeRecipeCost } from "@/lib/conversion";
import { colors, font, numeric, radius, shadow } from "@/lib/tokens";
import { Mosaico, categoriaColor, formatMoney, unidadSingular } from "./ui";

interface FichaRecetaProps {
  receta: Receta;
  inventario: InventoryIngredient[];
  activa?: boolean;
  accion?: React.ReactNode;
}

export function FichaReceta({ receta, inventario, activa, accion }: FichaRecetaProps) {
  const inventarioMap = Object.fromEntries(inventario.map((i) => [i.id, i]));
  const { costoTotal, costoPorPorcion } = computeRecipeCost(receta, inventarioMap);

  const rinde = receta.unidadRendimiento ?? "porciones";
  const color = categoriaColor(receta.categoria);

  const nombres = receta.ingredientes.map((ri) => inventarioMap[ri.ingredientId]?.nombre ?? ri.ingredientId);
  const visibles = nombres.slice(0, 4);
  const resto = nombres.length - visibles.length;

  return (
    <article
      style={{
        display: "flex",
        flexDirection: "column",
        background: colors.surface,
        border: `1px solid ${activa ? colors.monte : colors.border}`,
        borderRadius: radius.xl,
        boxShadow: activa ? `0 0 0 3px ${colors.mango}, ${shadow.raised}` : shadow.card,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "relative",
          height: 74,
          background: color,
          padding: "14px 18px",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          color: "#FFFFFF",
        }}
      >
        <Mosaico color="#FFFFFF" opacity={0.14} size={44} />
        <span
          style={{
            position: "relative",
            fontSize: 10.5,
            fontWeight: 800,
            letterSpacing: 1.2,
            textTransform: "uppercase",
          }}
        >
          {receta.categoria ?? "Sin categoría"}
        </span>
        <span
          style={{
            position: "relative",
            fontSize: 12,
            fontWeight: 700,
            background: "rgba(0,0,0,0.18)",
            borderRadius: 999,
            padding: "3px 9px",
            ...numeric,
          }}
        >
          Rinde {receta.porciones} {rinde}
        </span>
      </div>

      <div style={{ padding: "16px 18px 18px", display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
        <h3
          style={{
            fontFamily: font.display,
            fontWeight: 600,
            fontSize: 21,
            letterSpacing: -0.3,
            lineHeight: 1.15,
            margin: 0,
            color: colors.text,
          }}
        >
          {receta.nombre}
        </h3>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {visibles.map((n, i) => (
            <span
              key={i}
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: colors.textMuted,
                background: colors.surfaceAlt,
                border: `1px solid ${colors.border}`,
                borderRadius: 999,
                padding: "3px 9px",
              }}
            >
              {n}
            </span>
          ))}
          {resto > 0 && (
            <span style={{ fontSize: 12, fontWeight: 700, color: colors.textFaint, padding: "3px 4px" }}>+{resto}</span>
          )}
          {nombres.length === 0 && (
            <span style={{ fontSize: 12.5, color: colors.textFaint }}>Sin ingredientes todavía</span>
          )}
        </div>

        <div
          style={{
            marginTop: "auto",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 10,
            borderTop: `1px dashed ${colors.borderStrong}`,
            paddingTop: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.8, textTransform: "uppercase", color: colors.textFaint }}>
              Por {unidadSingular(rinde)}
            </div>
            <div
              style={{
                fontFamily: font.display,
                fontSize: 27,
                fontWeight: 600,
                letterSpacing: -0.5,
                lineHeight: 1.1,
                color: colors.text,
                ...numeric,
              }}
            >
              {formatMoney(costoPorPorcion)}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.8, textTransform: "uppercase", color: colors.textFaint }}>
              La tanda
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: colors.textMuted, ...numeric }}>{formatMoney(costoTotal)}</div>
          </div>
        </div>

        {accion}
      </div>
    </article>
  );
}
