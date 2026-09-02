import type { InventoryIngredient, RecetaIngrediente } from "../lib/types";
import { computeIngredientCost } from "../lib/conversion";
import { colors, font } from "../lib/tokens";
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
        borderRadius: 10,
        padding: 14,
        marginBottom: 10,
        background: colors.surface,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div>
          <p style={{ fontSize: 14, margin: 0, color: colors.text, fontFamily: font.family, fontWeight: 500 }}>{ingrediente.nombre}</p>
          <p style={{ fontSize: 12, color: colors.textFaint, margin: 0, fontFamily: font.family }}>
            En inventario: RD${ingrediente.precioCompra.toFixed(2)}/{ingrediente.unidadCompra}
          </p>
        </div>
        <button
          onClick={onRemove}
          aria-label={`Quitar ${ingrediente.nombre}`}
          style={{ border: "none", background: "transparent", color: colors.textMuted, cursor: "pointer", fontSize: 13 }}
        >
          Quitar
        </button>
      </div>

      <UnitSelector value={selectorValue} onChange={(v) => onChange({ ...value, ...v })} unidadSugerida={ingrediente.unidadCompra} />

      {error && (
        <p style={{ fontSize: 12, color: colors.accent, margin: "8px 0 0", fontFamily: font.family }}>{error}</p>
      )}

      {costo !== null && (
        <div
          style={{
            marginTop: 10,
            paddingTop: 10,
            borderTop: `1px solid ${colors.border}`,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <p style={{ fontSize: 14, fontWeight: 500, color: colors.text, margin: 0, fontVariantNumeric: "tabular-nums", fontFamily: font.family }}>
            RD${costo.toFixed(2)}
          </p>
        </div>
      )}
    </div>
  );
}
