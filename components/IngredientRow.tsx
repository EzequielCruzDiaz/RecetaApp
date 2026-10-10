import type { InventoryIngredient, RecetaIngrediente } from "@/lib/types";
import { computeIngredientCost } from "@/lib/conversion";
import { colors } from "@/lib/tokens";
import { formatMoney, ghostButtonStyle } from "./ui";
import { UnitSelector, type UnitSelectorValue } from "./UnitSelector";

interface IngredientRowProps {
  ingrediente: InventoryIngredient;
  value: RecetaIngrediente;
  onChange: (value: RecetaIngrediente) => void;
  onRemove: () => void;
}

export function IngredientRow({ ingrediente, value, onChange, onRemove }: IngredientRowProps) {
  const selectorValue: UnitSelectorValue = {
    cantidad: value.cantidad,
    unidad: value.unidad,
    alGusto: value.alGusto,
  };

  let costo: number | null = null;
  let error: string | null = null;

  if (!value.alGusto && value.cantidad !== null && value.unidad !== null) {
    try {
      costo = computeIngredientCost(ingrediente, value.cantidad, value.unidad);
    } catch (e) {
      error = e instanceof Error ? e.message : "No se pudo calcular el costo.";
    }
  }

  return (
    <div
      style={{
        border: `1px solid ${colors.border}`,
        borderLeft: `4px solid ${colors.mango}`,
        borderRadius: 12,
        padding: "14px 16px",
        marginBottom: 10,
        background: colors.surface,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div>
          <p style={{ fontSize: 15, margin: 0, color: colors.text, fontWeight: 700 }}>{ingrediente.nombre}</p>
          <p style={{ fontSize: 12, color: colors.textFaint, margin: "2px 0 0", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
            En inventario: {formatMoney(ingrediente.precioCompra)}/{ingrediente.unidadCompra}
          </p>
        </div>
        <button
          onClick={onRemove}
          aria-label={`Quitar ${ingrediente.nombre}`}
          style={ghostButtonStyle}
        >
          Quitar
        </button>
      </div>

      <UnitSelector value={selectorValue} onChange={(v) => onChange({ ...value, ...v })} unidadSugerida={ingrediente.unidadCompra} />

      {error && (
        <p style={{ fontSize: 12.5, color: colors.accent, margin: "8px 0 0", fontWeight: 600 }}>{error}</p>
      )}

      {costo !== null && (
        <div
          style={{
            marginTop: 10,
            paddingTop: 10,
            borderTop: `1px dashed ${colors.border}`,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <p style={{ fontSize: 15, fontWeight: 800, color: colors.text, margin: 0, fontVariantNumeric: "tabular-nums" }}>
            {formatMoney(costo)}
          </p>
        </div>
      )}
    </div>
  );
}
