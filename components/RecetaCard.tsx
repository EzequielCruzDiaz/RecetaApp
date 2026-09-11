import type { InventoryIngredient, Receta } from "@/lib/types";
import { computeRecipeCost } from "@/lib/conversion";
import { colors, font, numeric } from "@/lib/tokens";
import { Badge, Card, InitialChip, Money, categoriaColor } from "./ui";

interface RecetaCardProps {
  receta: Receta;
  inventario: InventoryIngredient[];
  accion?: React.ReactNode;
}

export function RecetaCard({ receta, inventario, accion }: RecetaCardProps) {
  const inventarioMap = Object.fromEntries(inventario.map((i) => [i.id, i]));
  const { costoTotal, costoPorPorcion } = computeRecipeCost(receta, inventarioMap);

  const rinde = receta.unidadRendimiento ?? "porciones";
  const color = categoriaColor(receta.categoria);

  const nombresIngredientes = receta.ingredientes.map(
    (ri) => inventarioMap[ri.ingredientId]?.nombre ?? ri.ingredientId,
  );
  const preview = nombresIngredientes.slice(0, 4).join(" · ") + (nombresIngredientes.length > 4 ? ` +${nombresIngredientes.length - 4}` : "");

  return (
    <Card style={{ display: "flex", flexDirection: "column", gap: 7, padding: 12 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <InitialChip label={receta.nombre[0]} color={color} size={30} />
          <h3
            style={{
              fontFamily: font.family,
              fontWeight: 600,
              fontSize: 13.5,
              margin: 0,
              color: colors.text,
              lineHeight: 1.3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {receta.nombre}
          </h3>
        </div>
        {receta.categoria && <Badge label={receta.categoria} color={color} />}
      </div>

      <p style={{ fontSize: 11, color: colors.textMuted, margin: 0 }}>
        Rinde <span style={numeric}>{receta.porciones}</span> {rinde} · {receta.ingredientes.length} ing.
      </p>

      <p
        style={{
          fontSize: 11.5,
          color: colors.textMuted,
          margin: 0,
          lineHeight: 1.4,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {preview || "Sin ingredientes todavía"}
      </p>

      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          borderTop: `1px solid ${colors.border}`,
          paddingTop: 8,
          marginTop: "auto",
        }}
      >
        <span style={{ fontSize: 10.5, color: colors.textMuted }}>
          Total <Money value={costoTotal} />
        </span>
        <span style={{ fontSize: 12, fontWeight: 700 }}>
          <Money value={costoPorPorcion} alert /> /{rinde.replace(/s$/, "")}
        </span>
      </div>

      {accion && <div style={{ display: "flex", gap: 6 }}>{accion}</div>}
    </Card>
  );
}
