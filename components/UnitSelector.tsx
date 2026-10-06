import type { Unit } from "@/lib/types";
import { colors, font } from "@/lib/tokens";
import { Select, type SelectOption } from "./ui";

const OPCIONES_UNIDAD: SelectOption[] = [
  { value: "g", label: "g", group: "Peso" },
  { value: "kg", label: "kg", group: "Peso" },
  { value: "lb", label: "lb", group: "Peso" },
  { value: "oz", label: "oz", group: "Peso" },
  { value: "ml", label: "ml", group: "Volumen" },
  { value: "L", label: "L", group: "Volumen" },
  { value: "cdta", label: "cdta", group: "Volumen" },
  { value: "cda", label: "cda", group: "Volumen" },
  { value: "taza", label: "taza", group: "Volumen" },
  { value: "oz_liq", label: "oz líq.", group: "Volumen" },
  { value: "galon", label: "galón", group: "Volumen" },
  { value: "unidad", label: "unidad", group: "Pieza / empaque" },
  { value: "docena", label: "docena", group: "Pieza / empaque" },
  { value: "diente", label: "diente", group: "Pieza / empaque" },
  { value: "atado", label: "atado", group: "Pieza / empaque" },
  { value: "lata", label: "lata", group: "Pieza / empaque" },
  { value: "paquete", label: "paquete", group: "Pieza / empaque" },
  { value: "saco", label: "saco", group: "Pieza / empaque" },
  { value: "caja", label: "caja", group: "Pieza / empaque" },
];

export interface UnitSelectorValue {
  cantidad: number | null;
  unidad: Unit | null;
  alGusto: boolean;
}

interface UnitSelectorProps {
  value: UnitSelectorValue;
  onChange: (value: UnitSelectorValue) => void;
  unidadSugerida?: Unit;
}

const inputStyle: React.CSSProperties = {
  fontSize: 14,
  padding: "8px 10px",
  border: `1px solid ${colors.border}`,
  borderRadius: 6,
  background: colors.surface,
  color: colors.text,
  fontFamily: font.family,
};

export function UnitSelector({ value, onChange, unidadSugerida }: UnitSelectorProps) {
  const { cantidad, unidad, alGusto } = value;

  function toggleAlGusto(checked: boolean) {
    onChange({
      cantidad: checked ? null : cantidad ?? 0,
      unidad: checked ? null : unidad ?? unidadSugerida ?? null,
      alGusto: checked,
    });
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <p style={{ fontSize: 12, color: colors.textMuted, margin: 0, fontFamily: font.family }}>
          Cantidad para esta receta
        </p>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: colors.textMuted, fontFamily: font.family }}>
          <input
            type="checkbox"
            checked={alGusto}
            onChange={(e) => toggleAlGusto(e.target.checked)}
            style={{ accentColor: colors.accent }}
          />
          Al gusto
        </label>
      </div>

      {!alGusto && (
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="number"
            value={cantidad ?? ""}
            onChange={(e) => onChange({ ...value, cantidad: e.target.value === "" ? null : Number(e.target.value) })}
            style={{ ...inputStyle, flex: 1 }}
          />
          <Select
            value={unidad ?? ""}
            onChange={(v) => onChange({ ...value, unidad: v as Unit })}
            placeholder="Unidad"
            options={OPCIONES_UNIDAD}
            style={{ width: 110 }}
          />
        </div>
      )}

      {alGusto && (
        <p style={{ fontSize: 11, color: colors.textFaint, margin: "6px 0 0", fontFamily: font.family }}>
          Se guarda sin costo cuantificado — no afecta el costo total de la receta.
        </p>
      )}
    </div>
  );
}
