"use client";

import { useState } from "react";
import type { BorradorFactura, FacturaItem, InventoryIngredient, Unit } from "@/lib/types";
import type { CamposFacturaOCR } from "@/lib/factura-ocr";
import { colors, font, numeric, radius } from "@/lib/tokens";
import { buttonStyle, formatMoney, inputStyle, NumberInput, Select } from "./ui";

const OCR_BORDER = "#E2B98A";
const OCR_BG = "#FFF8EE";

interface ConfirmarFacturaProps {
  inventario: InventoryIngredient[];
  onConfirmar: (factura: BorradorFactura) => void;
  preset?: CamposFacturaOCR;
}

const hoy = () => new Date().toISOString().slice(0, 10);

// RNC/NCF tienen formato fijo (dígitos+guiones / letra+dígitos) — filtrar lo
// que no corresponde en vez de dejar pasar cualquier caracter.
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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
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
          <input
            value={rnc}
            onChange={(e) => setRnc(soloRnc(e.target.value))}
            placeholder="000-0000000-0"
            style={ocrFieldStyle}
          />
        </label>
        <label style={{ fontSize: 11, color: colors.textMuted }}>
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
        <span style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted }}>Ítems</span>
        {/* Flex-wrap en vez de grid de 6 columnas fijas: en pantallas
            angostas los campos pasan a la línea siguiente en vez de
            aplastarse (y un grid forzaría overflow-y:auto en el contenedor,
            lo que recortaría el panel desplegable del Select). */}
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
              borderRadius: 8,
              padding: 8,
            }}
          >
            <input
              placeholder="Descripción"
              value={it.nombre}
              onChange={(e) => setItem(i, { nombre: e.target.value })}
              style={{ ...inputStyle, fontSize: 13, flex: "2 1 160px" }}
            />
            <NumberInput
              value={it.cantidad}
              onChange={(cantidad) => setItem(i, { cantidad })}
              style={{ ...inputStyle, fontSize: 13, ...numeric, flex: "1 1 72px" }}
            />
            <Select
              value={it.unidad ?? ""}
              onChange={(v) => setItem(i, { unidad: (v || null) as Unit | null })}
              placeholder="u."
              style={{ flex: "1 1 84px" }}
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
            <NumberInput
              value={it.precioUnitario}
              onChange={(precioUnitario) => setItem(i, { precioUnitario })}
              style={{ ...inputStyle, fontSize: 13, ...numeric, flex: "1 1 90px" }}
            />
            <Select
              value={it.ingredientId ?? ""}
              onChange={(v) => setItem(i, { ingredientId: v || undefined })}
              placeholder="— sin vincular —"
              style={{ flex: "1.4 1 150px" }}
              options={[
                { value: "", label: "— sin vincular —" },
                ...inventario.map((ing) => ({ value: ing.id, label: ing.nombre })),
              ]}
            />
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
          El total no cuadra con subtotal + ITBIS ({formatMoney(totalCalculado)}). Revisá los ítems.
        </p>
      )}

      <button type="button" onClick={confirmar} style={{ ...buttonStyle, alignSelf: "flex-end" }}>
        Confirmar y aplicar al inventario
      </button>
    </div>
  );
}
