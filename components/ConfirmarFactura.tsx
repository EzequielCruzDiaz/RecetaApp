"use client";

import { useState } from "react";
import type { BorradorFactura, FacturaItem, InventoryIngredient, Unit } from "@/lib/types";
import type { CamposFacturaOCR } from "@/lib/factura-ocr";
import { colors, numeric, radius } from "@/lib/tokens";
import { FormHeader, NumberInput, Select, buttonStyle, formPanelStyle, formatMoney, inputStyle, labelStyle } from "./ui";

const OCR_BORDER = colors.mango;
const OCR_BG = colors.mangoSoft;

interface ConfirmarFacturaProps {
  inventario: InventoryIngredient[];
  onConfirmar: (factura: BorradorFactura) => void;
  preset?: CamposFacturaOCR;
}

const hoy = () => new Date().toISOString().slice(0, 10);

const soloRnc = (s: string) => s.replace(/[^0-9-]/g, "").slice(0, 13);
const soloNcf = (s: string) => s.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 11);

const filaVacia = (): FacturaItem => ({
  nombre: "",
  cantidad: 1,
  unidad: null,
  precioUnitario: 0,
  ingredientId: undefined,
});

function autoVincular(items: FacturaItem[], inventario: InventoryIngredient[]): FacturaItem[] {
  return items.map((it) => {
    if (it.ingredientId) return it;
    const n = it.nombre.toLowerCase();
    const match = inventario.find(
      (ing) => n.includes(ing.nombre.toLowerCase()) || ing.nombre.toLowerCase().includes(n),
    );
    return match ? { ...it, ingredientId: match.id } : it;
  });
}

export function ConfirmarFactura({ inventario, onConfirmar, preset }: ConfirmarFacturaProps) {
  const [proveedor, setProveedor] = useState(preset?.proveedor ?? "");
  const [fecha, setFecha] = useState(preset?.fecha ?? hoy());
  const [rnc, setRnc] = useState(preset?.rnc ?? "");
  const [ncf, setNcf] = useState(preset?.ncf ?? "");
  const [items, setItems] = useState<FacturaItem[]>(
    preset?.items?.length ? autoVincular(preset.items, inventario) : [filaVacia()],
  );
  const [itbis, setItbis] = useState(preset?.itbis ?? 0);
  const [totalManual, setTotalManual] = useState<number | null>(preset?.total ?? null);

  const subtotal = items.reduce((acc, it) => acc + it.cantidad * it.precioUnitario, 0);
  const totalCalculado = subtotal + itbis;
  const total = totalManual ?? totalCalculado;
  const descuadre = totalManual != null && Math.abs(totalManual - totalCalculado) > 1;

  function setItem(i: number, patch: Partial<FacturaItem>) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }

  function confirmar() {
    const limpios = items.filter((it) => it.nombre.trim() !== "");
    if (proveedor.trim() === "" || limpios.length === 0) return;
    onConfirmar({
      proveedor: proveedor.trim(),
      fecha,
      rnc: rnc.trim() || undefined,
      ncf: ncf.trim() || undefined,
      items: limpios,
      itbis,
      total,
    });
    setProveedor("");
    setRnc("");
    setNcf("");
    setItems([filaVacia()]);
    setItbis(0);
    setTotalManual(null);
  }

  const ocrFieldStyle = preset ? { ...inputStyle, borderColor: OCR_BORDER } : inputStyle;

  return (
    <div style={formPanelStyle}>
      <FormHeader
        step="2"
        title="Confirmar y aplicar al inventario"
        hint={
          preset
            ? "Datos precargados por el escáner (borde ámbar). Revísalos y corrige antes de guardar."
            : "O cárgala a mano: a quién le compraste (suplidor) y qué compraste (ítems)."
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
        <label style={labelStyle}>
          Suplidor
          <input
            value={proveedor}
            onChange={(e) => setProveedor(e.target.value)}
            placeholder="Ej. Colmado El Buen Precio"
            style={ocrFieldStyle}
          />
        </label>
        <label style={labelStyle}>
          Fecha
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} style={ocrFieldStyle} />
        </label>
        <label style={labelStyle}>
          RNC
          <input
            value={rnc}
            onChange={(e) => setRnc(soloRnc(e.target.value))}
            placeholder="000-0000000-0"
            style={ocrFieldStyle}
          />
        </label>
        <label style={labelStyle}>
          NCF
          <input
            value={ncf}
            onChange={(e) => setNcf(soloNcf(e.target.value))}
            placeholder="B0100000000"
            style={ocrFieldStyle}
          />
        </label>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span style={labelStyle}>Ítems</span>

        <div
          className="factura-items-encabezado"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            padding: "0 8px",
            fontSize: 10.5,
            fontWeight: 800,
            color: colors.textFaint,
            textTransform: "uppercase",
            letterSpacing: 0.8,
          }}
        >
          <span style={{ flex: "2 1 160px" }}>Producto</span>
          <span style={{ flex: "1 1 72px" }}>Cant.</span>
          <span style={{ flex: "1 1 84px" }}>Unidad</span>
          <span style={{ flex: "1 1 90px" }}>Precio</span>
          <span style={{ flex: "1.4 1 150px" }}>Vincular</span>
          <span style={{ flexShrink: 0, width: 13 }} />
        </div>

        {items.map((it, i) => {
          const deOcr = Boolean(preset) && i < (preset?.items?.length ?? 0);
          return (
          <div
            key={i}
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              alignItems: "center",
              border: `1px solid ${deOcr ? OCR_BORDER : colors.border}`,
              background: deOcr ? OCR_BG : "transparent",
              borderRadius: 12,
              padding: 8,
            }}
          >
            <div className="factura-campo" style={{ flex: "2 1 160px" }}>
              <span className="factura-campo-etiqueta">Producto</span>
              <input
                aria-label="Producto"
                placeholder="Ej. Mantequilla en barra"
                value={it.nombre}
                onChange={(e) => setItem(i, { nombre: e.target.value })}
                style={{ ...inputStyle, fontSize: 13 }}
              />
            </div>
            <div className="factura-campo" style={{ flex: "1 1 72px" }}>
              <span className="factura-campo-etiqueta">Cant.</span>
              <NumberInput
                aria-label="Cantidad"
                value={it.cantidad}
                onChange={(cantidad) => setItem(i, { cantidad })}
                style={{ ...inputStyle, fontSize: 13, ...numeric }}
              />
            </div>
            <div className="factura-campo" style={{ flex: "1 1 84px" }}>
              <span className="factura-campo-etiqueta">Unidad</span>
              <Select
                value={it.unidad ?? ""}
                onChange={(v) => setItem(i, { unidad: (v || null) as Unit | null })}
                placeholder="u."
                options={[
                  { value: "", label: "u." },
                  { value: "lb", label: "lb" },
                  { value: "kg", label: "kg" },
                  { value: "L", label: "L" },
                  { value: "unidad", label: "unidad" },
                  { value: "paquete", label: "paquete" },
                  { value: "caja", label: "caja" },
                  { value: "saco", label: "saco" },
                ]}
              />
            </div>
            <div className="factura-campo" style={{ flex: "1 1 90px" }}>
              <span className="factura-campo-etiqueta">Precio</span>
              <NumberInput
                aria-label="Precio"
                value={it.precioUnitario}
                onChange={(precioUnitario) => setItem(i, { precioUnitario })}
                style={{ ...inputStyle, fontSize: 13, ...numeric }}
              />
            </div>
            <div className="factura-campo" style={{ flex: "1.4 1 150px" }}>
              <span className="factura-campo-etiqueta">Vincular</span>
              <Select
                value={it.ingredientId ?? ""}
                onChange={(v) => setItem(i, { ingredientId: v || undefined })}
                placeholder="— sin vincular —"
                options={[
                  { value: "", label: "— sin vincular —" },
                  ...inventario.map((ing) => ({ value: ing.id, label: ing.nombre })),
                ]}
              />
            </div>
            <button
              type="button"
              onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== i))}
              aria-label="Quitar ítem"
              style={{ border: "none", background: "transparent", color: colors.textFaint, cursor: "pointer", fontSize: 13, flexShrink: 0 }}
            >
              ✕
            </button>
          </div>
          );
        })}
        <button
          type="button"
          onClick={() => setItems((prev) => [...prev, filaVacia()])}
          style={{
            alignSelf: "flex-start",
            border: `1.5px dashed ${colors.borderStrong}`,
            background: "transparent",
            color: colors.textMuted,
            borderRadius: 999,
            padding: "7px 14px",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          + Agregar ítem
        </button>
        <p style={{ fontSize: 11, color: colors.textFaint, margin: 0 }}>
          Solo los ítems vinculados a un ingrediente suman al stock.
        </p>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 16,
          background: colors.surfaceAlt,
          border: `1px solid ${colors.border}`,
          borderRadius: radius.lg,
          padding: "12px 16px",
          fontSize: 13,
          fontWeight: 600,
          color: colors.textMuted,
          flexWrap: "wrap",
        }}
      >
        <span style={numeric}>Subtotal {formatMoney(subtotal)}</span>
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          ITBIS
          <NumberInput
            value={itbis}
            onChange={setItbis}
            style={{ ...inputStyle, width: 90, fontSize: 13, ...numeric }}
          />
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          Total
          <NumberInput
            value={total}
            onChange={setTotalManual}
            style={{
              ...inputStyle,
              width: 110,
              fontSize: 13,
              fontWeight: 700,
              ...numeric,
              color: colors.text,
              borderColor: descuadre ? colors.accent : colors.border,
            }}
          />
        </label>
      </div>

      {descuadre && (
        <p style={{ fontSize: 12, color: colors.accent, margin: 0, textAlign: "right" }}>
          El total no cuadra con subtotal + ITBIS ({formatMoney(totalCalculado)}). Revisa los ítems.
        </p>
      )}

      <button type="button" onClick={confirmar} style={{ ...buttonStyle, alignSelf: "flex-end" }}>
        Confirmar y aplicar al inventario
      </button>
    </div>
  );
}
