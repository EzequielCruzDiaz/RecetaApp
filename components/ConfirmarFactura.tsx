"use client";

import { useState } from "react";
import type { BorradorFactura, FacturaItem, InventoryIngredient, Unit } from "@/lib/types";
import type { CamposFacturaOCR } from "@/lib/factura-ocr";
import { colors, font, numeric, radius } from "@/lib/tokens";
import { buttonStyle, formatMoney, inputStyle } from "./ui";

const OCR_BORDER = "#E2B98A";
const OCR_BG = "#FFF8EE";

interface ConfirmarFacturaProps {
  inventario: InventoryIngredient[];
  onConfirmar: (factura: BorradorFactura) => void;
  preset?: CamposFacturaOCR;
}

const hoy = () => new Date().toISOString().slice(0, 10);

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
    <div
      style={{
        background: "#FFFDF8",
        border: "1.5px dashed #D8C7A8",
        borderRadius: radius.xl,
        padding: 22,
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <div>
        <h3 style={{ fontFamily: font.family, fontSize: 16, fontWeight: 600, margin: 0, color: colors.text }}>
          Confirmar factura
        </h3>
        <p style={{ fontSize: 12, color: colors.textMuted, margin: "4px 0 0" }}>
          {preset
            ? "Datos precargados por OCR (borde ámbar) — revisá y corregí antes de guardar."
            : "O cargala a mano: proveedor, fecha e ítems comprados."}
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr", gap: 12 }}>
        <label style={{ fontSize: 11, color: colors.textMuted }}>
          Proveedor
          <input value={proveedor} onChange={(e) => setProveedor(e.target.value)} style={ocrFieldStyle} />
        </label>
        <label style={{ fontSize: 11, color: colors.textMuted }}>
          Fecha
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} style={ocrFieldStyle} />
        </label>
        <label style={{ fontSize: 11, color: colors.textMuted }}>
          RNC
          <input value={rnc} onChange={(e) => setRnc(e.target.value)} placeholder="000-0000000-0" style={ocrFieldStyle} />
        </label>
        <label style={{ fontSize: 11, color: colors.textMuted }}>
          NCF
          <input value={ncf} onChange={(e) => setNcf(e.target.value)} placeholder="B0100000000" style={ocrFieldStyle} />
        </label>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted }}>Ítems</span>
        {items.map((it, i) => {
          const deOcr = Boolean(preset) && i < (preset?.items?.length ?? 0);
          return (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: "1.4fr 0.6fr 0.7fr 0.8fr 1fr auto",
              gap: 8,
              alignItems: "center",
              border: `1px solid ${deOcr ? OCR_BORDER : colors.border}`,
              background: deOcr ? OCR_BG : "transparent",
              borderRadius: 8,
              padding: 8,
            }}
          >
            <input
              placeholder="Descripción"
              value={it.nombre}
              onChange={(e) => setItem(i, { nombre: e.target.value })}
              style={{ ...inputStyle, fontSize: 13 }}
            />
            <input
              type="number"
              value={it.cantidad}
              onChange={(e) => setItem(i, { cantidad: Number(e.target.value) })}
              style={{ ...inputStyle, fontSize: 13, ...numeric }}
            />
            <select
              value={it.unidad ?? ""}
              onChange={(e) => setItem(i, { unidad: (e.target.value || null) as Unit | null })}
              style={{ ...inputStyle, fontSize: 13 }}
            >
              <option value="">u.</option>
              <option value="lb">lb</option>
              <option value="kg">kg</option>
              <option value="L">L</option>
              <option value="unidad">unidad</option>
              <option value="paquete">paquete</option>
              <option value="caja">caja</option>
              <option value="saco">saco</option>
            </select>
            <input
              type="number"
              value={it.precioUnitario}
              onChange={(e) => setItem(i, { precioUnitario: Number(e.target.value) })}
              style={{ ...inputStyle, fontSize: 13, ...numeric }}
            />
            <select
              value={it.ingredientId ?? ""}
              onChange={(e) => setItem(i, { ingredientId: e.target.value || undefined })}
              style={{ ...inputStyle, fontSize: 13 }}
            >
              <option value="">— sin vincular —</option>
              {inventario.map((ing) => (
                <option key={ing.id} value={ing.id}>
                  {ing.nombre}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== i))}
              aria-label="Quitar ítem"
              style={{ border: "none", background: "transparent", color: colors.textFaint, cursor: "pointer", fontSize: 13 }}
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
            border: `1px dashed ${colors.border}`,
            background: "transparent",
            color: colors.textMuted,
            borderRadius: radius.sm,
            padding: "6px 12px",
            fontSize: 13,
            cursor: "pointer",
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
          borderTop: `1px solid ${colors.border}`,
          paddingTop: 12,
          fontSize: 13,
          color: colors.textMuted,
          flexWrap: "wrap",
        }}
      >
        <span style={numeric}>Subtotal {formatMoney(subtotal)}</span>
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          ITBIS
          <input
            type="number"
            value={itbis}
            onChange={(e) => setItbis(Number(e.target.value))}
            style={{ ...inputStyle, width: 90, fontSize: 13, ...numeric }}
          />
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          Total
          <input
            type="number"
            value={total}
            onChange={(e) => setTotalManual(e.target.value === "" ? null : Number(e.target.value))}
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
          El total no cuadra con subtotal + ITBIS ({formatMoney(totalCalculado)}). Revisá los ítems.
        </p>
      )}

      <button type="button" onClick={confirmar} style={{ ...buttonStyle, alignSelf: "flex-end" }}>
        Confirmar y aplicar al inventario
      </button>
    </div>
  );
}
