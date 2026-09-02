import type { Unit } from "../lib/types";
import { colors, font } from "../lib/tokens";

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
          <select
            value={unidad ?? ""}
            onChange={(e) => onChange({ ...value, unidad: e.target.value as Unit })}
            style={{ ...inputStyle, width: 110 }}
          >
            <option value="" disabled>
              Unidad
            </option>
            <optgroup label="Peso">
              <option value="g">g</option>
              <option value="kg">kg</option>
              <option value="lb">lb</option>
              <option value="oz">oz</option>
            </optgroup>
            <optgroup label="Volumen">
              <option value="ml">ml</option>
              <option value="L">L</option>
              <option value="cdta">cdta</option>
              <option value="cda">cda</option>
              <option value="taza">taza</option>
              <option value="oz_liq">oz líq.</option>
              <option value="galon">galón</option>
            </optgroup>
            <optgroup label="Pieza / empaque">
              <option value="unidad">unidad</option>
              <option value="docena">docena</option>
              <option value="diente">diente</option>
              <option value="atado">atado</option>
              <option value="lata">lata</option>
              <option value="paquete">paquete</option>
              <option value="saco">saco</option>
              <option value="caja">caja</option>
            </optgroup>
          </select>
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
