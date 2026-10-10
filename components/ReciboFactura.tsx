import type { Factura } from "@/lib/types";
import { colors, font, numeric } from "@/lib/tokens";
import { formatMoney, ghostButtonStyle } from "./ui";

interface ReciboFacturaProps {
  factura: Factura;
  onBorrar: () => void;
}

const separador: React.CSSProperties = {
  borderTop: `1.5px dashed ${colors.borderStrong}`,
  margin: "12px 0",
};

export function ReciboFactura({ factura: f, onBorrar }: ReciboFacturaProps) {
  const vinculados = f.items.filter((it) => it.ingredientId).length;
  const subtotal = f.items.reduce((acc, it) => acc + it.cantidad * it.precioUnitario, 0);
  const todos = vinculados === f.items.length;

  const sello =
    vinculados === 0
      ? { texto: "No tocó el stock", color: colors.accent }
      : todos
        ? { texto: "Aplicada al inventario", color: colors.positive }
        : { texto: `${vinculados}/${f.items.length} al inventario`, color: colors.positive };

  return (
    <div style={{ filter: "drop-shadow(0 10px 14px rgba(42,29,23,0.13))" }}>
      <article
        className="recibo"
        style={{
          position: "relative",
          background: "#FFFEFA",
          padding: "22px 22px 30px",
          color: colors.text,
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 5,
            background: `repeating-linear-gradient(90deg, ${colors.monte} 0 18px, ${colors.mango} 18px 36px)`,
          }}
        />

        <header style={{ textAlign: "center" }}>
          <div style={{ fontFamily: font.display, fontSize: 20, fontWeight: 600, letterSpacing: -0.3, lineHeight: 1.2 }}>
            {f.proveedor}
          </div>
          <div style={{ fontFamily: font.mono, fontSize: 11.5, color: colors.textMuted, marginTop: 6, lineHeight: 1.6 }}>
            {f.rnc && <div>RNC {f.rnc}</div>}
            <div>
              {f.fecha}
              {f.ncf ? ` · NCF ${f.ncf}` : ""}
            </div>
          </div>
        </header>

        <div style={separador} />

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {f.items.map((it, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13 }}>
              <span
                title={it.ingredientId ? "Sumó al stock" : "No vinculado: no sumó al stock"}
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  marginTop: 6,
                  flexShrink: 0,
                  background: it.ingredientId ? colors.positive : "transparent",
                  border: `1.5px solid ${it.ingredientId ? colors.positive : colors.textFaint}`,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700 }}>{it.nombre}</div>
                <div style={{ fontFamily: font.mono, fontSize: 11.5, color: colors.textMuted }}>
                  {it.cantidad}
                  {it.unidad ? ` ${it.unidad}` : ""} × {formatMoney(it.precioUnitario)}
                </div>
              </div>
              <span style={{ fontFamily: font.mono, fontSize: 12.5, fontWeight: 600, ...numeric, whiteSpace: "nowrap" }}>
                {formatMoney(it.cantidad * it.precioUnitario)}
              </span>
            </div>
          ))}
        </div>

        <div style={separador} />

        <div style={{ fontFamily: font.mono, fontSize: 12.5, color: colors.textMuted, display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Subtotal</span>
            <span style={numeric}>{formatMoney(subtotal)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>ITBIS</span>
            <span style={numeric}>{formatMoney(f.itbis)}</span>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase" }}>Total</span>
          <span style={{ fontFamily: font.display, fontSize: 26, fontWeight: 600, letterSpacing: -0.5, ...numeric }}>
            {formatMoney(f.total)}
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, gap: 10 }}>
          <span
            style={{
              display: "inline-block",
              transform: "rotate(-3deg)",
              border: `2px solid ${sello.color}`,
              color: sello.color,
              borderRadius: 6,
              padding: "3px 9px",
              fontSize: 10.5,
              fontWeight: 800,
              letterSpacing: 1,
              textTransform: "uppercase",
              opacity: 0.85,
            }}
          >
            {sello.texto}
          </span>
          <button type="button" onClick={onBorrar} style={{ ...ghostButtonStyle, padding: "5px 11px", fontSize: 11.5 }}>
            Borrar
          </button>
        </div>
      </article>
    </div>
  );
}
