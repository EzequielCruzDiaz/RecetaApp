import type { InventoryIngredient, Receta } from "@/lib/types";
import { computeRecipeCost } from "@/lib/conversion";
import { colors, numeric } from "@/lib/tokens";
import { Badge, Card, Money, categoriaColor } from "./ui";

interface RecetaCardProps {
  receta: Receta;
  inventario: InventoryIngredient[];
  accion?: React.ReactNode;
}

export function RecetaCard({ receta, inventario, accion }: RecetaCardProps) {
  const inventarioMap = Object.fromEntries(inventario.map((i) => [i.id, i]));
  const { costoTotal, costoPorPorcion } = computeRecipeCost(receta, inventarioMap);

  const rinde = receta.unidadRendimiento ?? "porciones";
  const preview = receta.ingredientes.slice(0, 5);
  const resto = receta.ingredientes.length - preview.length;

  return (
    <Card style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: colors.text }}>{receta.nombre}</h3>
          <p style={{ fontSize: 12, color: colors.textMuted, margin: "4px 0 0" }}>
            Rinde{" "}
            <span style={numeric}>{receta.porciones}</span> {rinde} · {receta.ingredientes.length}{" "}
            {receta.ingredientes.length === 1 ? "ingrediente" : "ingredientes"}
          </p>
        </div>
        {receta.categoria && <Badge label={receta.categoria} color={categoriaColor(receta.categoria)} />}
      </div>

      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 4 }}>
        {preview.map((ri, i) => {
          const ing = inventarioMap[ri.ingredientId];
          const nombre = ing?.nombre ?? ri.ingredientId;
          return (
            <li key={i} style={{ fontSize: 13, color: colors.textMuted }}>
              {ri.alGusto || ri.cantidad === null || ri.unidad === null
                ? `${nombre} — a gusto`
                : `${ri.cantidad} ${ri.unidad} · ${nombre}`}
            </li>
          );
        })}
        {resto > 0 && (
          <li style={{ fontSize: 12, color: colors.textFaint }}>+{resto} más</li>
        )}
      </ul>

      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          borderTop: `1px solid ${colors.border}`,
          paddingTop: 10,
        }}
      >
        <span style={{ fontSize: 12, color: colors.textMuted }}>
          Total <Money value={costoTotal} />
        </span>
        <span style={{ fontSize: 13, color: colors.textMuted }}>
          Por {rinde.replace(/s$/, "")} <Money value={costoPorPorcion} alert />
        </span>
      </div>

      {accion && <div>{accion}</div>}
    </Card>
  );
}
