"use client";

import { useEffect, useRef, useState } from "react";
import type { BorradorFactura, Factura, FacturaItem, InventoryIngredient, Unit } from "@/lib/types";
import {
  agregarLectura,
  aItemFactura,
  completarEncabezado,
  cuadraTotal,
  encabezadoSin,
  quitarLectura,
  totalesDe,
  type CampoEncabezado,
  type Encabezado,
  type ItemBorrador,
  type LecturaFactura,
} from "@/lib/factura-lectura";
import {
  hayErrores,
  hoyLocal,
  itemVacio,
  prepararItems,
  sugerirIngrediente,
  validarFactura,
} from "@/lib/factura";
import { UNIT_INFO, unidadesDisponibles } from "@/lib/units";
import { colors, numeric, radius } from "@/lib/tokens";
import { EscanearFactura } from "./EscanearFactura";
import {
  FormHeader,
  MensajeCampo,
  NumberInput,
  Select,
  buttonStyle,
  conError,
  formPanelStyle,
  formatMoney,
  inputStyle,
  labelStyle,
} from "./ui";

const OCR_BORDER = colors.mango;
const OCR_BG = colors.mangoSoft;

interface ConfirmarFacturaProps {
  inventario: InventoryIngredient[];
  facturas: Factura[];
  onConfirmar: (factura: BorradorFactura) => void;
}

const soloRnc = (s: string) => s.replace(/[^0-9-]/g, "").slice(0, 13);
const soloNcf = (s: string) => s.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 13);

const UNIDADES_SUELTAS: Unit[] = ["lb", "kg", "L", "unidad", "paquete", "caja", "saco"];

const filaVacia = (): ItemBorrador => ({
  nombre: "",
  cantidad: 1,
  unidad: null,
  precioUnitario: 0,
  ingredientId: undefined,
});

function autoVincular(items: ItemBorrador[], inventario: InventoryIngredient[]): ItemBorrador[] {
  return items.map((it) => (it.ingredientId ? it : { ...it, ingredientId: sugerirIngrediente(it.nombre, inventario) }));
}

/** Unidades que tiene sentido elegir: las que convierten al ingrediente vinculado, o una lista corta. */
function opcionesUnidad(ing: InventoryIngredient | undefined, actual: Unit | null) {
  const unidades: Unit[] = ing ? unidadesDisponibles(ing).map((o) => o.unidad) : [...UNIDADES_SUELTAS];
  if (actual && !unidades.includes(actual)) unidades.push(actual);
  return [
    { value: "", label: ing ? UNIT_INFO[ing.unidadCompra].label : "u." },
    ...unidades.filter((u) => !ing || u !== ing.unidadCompra).map((u) => ({ value: u, label: UNIT_INFO[u].label })),
  ];
}

export function ConfirmarFactura({ inventario, facturas, onConfirmar }: ConfirmarFacturaProps) {
  const [lecturas, setLecturas] = useState<LecturaFactura[]>([]);
  const [enc, setEnc] = useState<Encabezado>({ proveedor: "", fecha: hoyLocal(), rnc: "", ncf: "" });
  const { proveedor, fecha, rnc, ncf } = enc;
  const [items, setItems] = useState<ItemBorrador[]>([filaVacia()]);
  const [itbis, setItbis] = useState(0);
  const [totalManual, setTotalManual] = useState<number | null>(null);
  const [intentado, setIntentado] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Las miniaturas son URLs locales: se liberan al guardar o salir de la pantalla.
  const fotos = useRef<string[]>([]);
  useEffect(() => () => fotos.current.forEach((u) => URL.revokeObjectURL(u)), []);

  const subtotal = items.reduce((acc, it) => acc + it.cantidad * it.precioUnitario, 0);
  const totalCalculado = subtotal + itbis;
  const total = totalManual ?? totalCalculado;
  const descuadre = totalManual != null && !cuadraTotal(subtotal, itbis, totalManual);

  const setCampo = (c: CampoEncabezado, v: string) => setEnc((prev) => ({ ...prev, [c]: v }));

  /** Campos que la IA no leyó con seguridad y que siguen con el valor leído. */
  const dudosos = new Set(
    lecturas.flatMap((l) => (l.campos.camposDudosos ?? []).filter((c) => c !== "total" && enc[c] === l.campos[c])),
  );

  function agregar(l: LecturaFactura) {
    fotos.current.push(l.foto);
    const siguientes = [...lecturas, l];
    setLecturas(siguientes);
    setItems((prev) => agregarLectura(prev, { ...l, campos: { ...l.campos, items: autoVincular(l.campos.items, inventario) } }));
    // La fecha arranca en hoy: la primera factura leída la reemplaza.
    const base = lecturas.length === 0 && enc.fecha === hoyLocal() ? { ...enc, fecha: "" } : enc;
    const completo = completarEncabezado(base, l.campos);
    setEnc({ ...completo, fecha: completo.fecha || hoyLocal() });
    const t = totalesDe(siguientes);
    setItbis(t.itbis);
    setTotalManual(t.total);
  }

  function quitar(l: LecturaFactura) {
    const cuantos = items.filter((it) => it.origen === l.id).length;
    if (cuantos > 0 && !confirm(`¿Quitar esta factura y sus ${cuantos} ${cuantos === 1 ? "producto" : "productos"}?`)) return;
    URL.revokeObjectURL(l.foto);
    fotos.current = fotos.current.filter((u) => u !== l.foto);
    const restantes = lecturas.filter((x) => x.id !== l.id);
    setLecturas(restantes);
    setItems((prev) => {
      const sig = quitarLectura(prev, l.id);
      return sig.length ? sig : [filaVacia()];
    });
    setEnc(encabezadoSin(enc, l, restantes, hoyLocal()));
    const t = totalesDe(restantes);
    setItbis(t.itbis);
    setTotalManual(t.total);
  }

  const errores = validarFactura({ proveedor, fecha, rnc, ncf, items }, inventario, facturas);
  const ver = intentado ? errores : { porItem: {} as typeof errores.porItem };

  function setItem(i: number, patch: Partial<FacturaItem>) {
    // Lo que se corrige a mano deja de estar en duda.
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch, dudoso: undefined } : it)));
  }

  function confirmar() {
    if (hayErrores(errores)) {
      setIntentado(true);
      requestAnimationFrame(() =>
        panelRef.current?.querySelector<HTMLElement>("[aria-invalid='true'], [data-invalido='true']")?.focus(),
      );
      return;
    }
    const conDatos: FacturaItem[] = items
      .filter((it) => !itemVacio(it))
      .map((it) => ({ ...aItemFactura(it), nombre: it.nombre.trim() }));
    onConfirmar({
      proveedor: proveedor.trim(),
      fecha,
      rnc: rnc.trim() || undefined,
      ncf: ncf.trim() || undefined,
      items: prepararItems(conDatos, inventario),
      itbis,
      total,
    });
  }

  const leida = lecturas.length > 0;
  const ocrFieldStyle = leida ? { ...inputStyle, borderColor: OCR_BORDER } : inputStyle;
  const campoStyle = (c: CampoEncabezado, error?: string) =>
    conError(ocrFieldStyle, error ?? (dudosos.has(c) ? "dudoso" : undefined));
  const avisoDuda = (c: CampoEncabezado, error?: string) =>
    error ?? (dudosos.has(c) ? "Revisa este dato: no se leía bien en la foto." : undefined);

  return (
    <>
    <EscanearFactura lecturas={lecturas} onLeida={agregar} onQuitar={quitar} />
    <div ref={panelRef} style={formPanelStyle}>
      <FormHeader
        step="2"
        title="Confirmar y aplicar al inventario"
        hint={
          leida
            ? "Datos precargados de la foto (borde ámbar). Revísalos y corrige antes de guardar."
            : "O cárgala a mano: a quién le compraste (suplidor) y qué compraste (ítems)."
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
        <label style={labelStyle}>
          Suplidor
          <input
            value={proveedor}
            onChange={(e) => setCampo("proveedor", e.target.value)}
            placeholder="Ej. Colmado El Buen Precio"
            aria-invalid={ver.proveedor ? true : undefined}
            style={campoStyle("proveedor", ver.proveedor)}
          />
          <MensajeCampo>{avisoDuda("proveedor", ver.proveedor)}</MensajeCampo>
        </label>
        <label style={labelStyle}>
          Fecha
          <input
            type="date"
            value={fecha}
            max={hoyLocal()}
            onChange={(e) => setCampo("fecha", e.target.value)}
            aria-invalid={ver.fecha ? true : undefined}
            style={campoStyle("fecha", ver.fecha)}
          />
          <MensajeCampo>{avisoDuda("fecha", ver.fecha)}</MensajeCampo>
        </label>
        <label style={labelStyle}>
          RNC
          <input
            value={rnc}
            onChange={(e) => setCampo("rnc", soloRnc(e.target.value))}
            placeholder="000-0000000-0"
            inputMode="numeric"
            aria-invalid={ver.rnc ? true : undefined}
            style={campoStyle("rnc", ver.rnc)}
          />
          <MensajeCampo>{avisoDuda("rnc", ver.rnc)}</MensajeCampo>
        </label>
        <label style={labelStyle}>
          NCF
          <input
            value={ncf}
            onChange={(e) => setCampo("ncf", soloNcf(e.target.value))}
            placeholder="B0100000000"
            aria-invalid={ver.ncf ? true : undefined}
            style={campoStyle("ncf", ver.ncf)}
          />
          <MensajeCampo>{avisoDuda("ncf", ver.ncf)}</MensajeCampo>
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
          const deOcr = Boolean(it.origen);
          const ing = it.ingredientId ? inventario.find((x) => x.id === it.ingredientId) : undefined;
          const ei = ver.porItem[i] ?? {};
          const conErrores = Object.keys(ei).length > 0 || Boolean(it.dudoso);
          return (
            <div
              key={i}
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                alignItems: "flex-start",
                border: `1px solid ${conErrores ? colors.accent : deOcr ? OCR_BORDER : colors.border}`,
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
                  aria-invalid={ei.nombre ? true : undefined}
                  style={conError({ ...inputStyle, fontSize: 13 }, ei.nombre)}
                />
                <MensajeCampo>{ei.nombre}</MensajeCampo>
              </div>
              <div className="factura-campo" style={{ flex: "1 1 72px" }}>
                <span className="factura-campo-etiqueta">Cant.</span>
                <NumberInput
                  aria-label="Cantidad"
                  value={it.cantidad}
                  onChange={(cantidad) => setItem(i, { cantidad })}
                  aria-invalid={ei.cantidad ? true : undefined}
                  style={conError({ ...inputStyle, fontSize: 13, ...numeric }, ei.cantidad)}
                />
                <MensajeCampo>{ei.cantidad}</MensajeCampo>
              </div>
              <div className="factura-campo" style={{ flex: "1 1 84px" }}>
                <span className="factura-campo-etiqueta">Unidad</span>
                <Select
                  ariaLabel="Unidad"
                  // La unidad de compra del ingrediente es la opción vacía.
                  value={ing && it.unidad === ing.unidadCompra ? "" : (it.unidad ?? "")}
                  onChange={(v) => setItem(i, { unidad: (v || null) as Unit | null })}
                  placeholder="u."
                  error={ei.unidad}
                  options={opcionesUnidad(ing, it.unidad)}
                />
              </div>
              <div className="factura-campo" style={{ flex: "1 1 90px" }}>
                <span className="factura-campo-etiqueta">Precio</span>
                <NumberInput
                  aria-label="Precio"
                  value={it.precioUnitario}
                  onChange={(precioUnitario) => setItem(i, { precioUnitario })}
                  aria-invalid={ei.precio ? true : undefined}
                  style={conError({ ...inputStyle, fontSize: 13, ...numeric }, ei.precio)}
                />
                <MensajeCampo>{ei.precio}</MensajeCampo>
              </div>
              <div className="factura-campo" style={{ flex: "1.4 1 150px" }}>
                <span className="factura-campo-etiqueta">Vincular</span>
                <Select
                  ariaLabel="Vincular a ingrediente"
                  value={it.ingredientId ?? ""}
                  onChange={(v) => setItem(i, { ingredientId: v || undefined })}
                  placeholder="— sin vincular —"
                  options={[
                    { value: "", label: "— sin vincular —" },
                    ...inventario.map((x) => ({ value: x.id, label: x.nombre })),
                  ]}
                />
              </div>
              <button
                type="button"
                onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== i))}
                aria-label="Quitar ítem"
                style={{
                  border: "none",
                  background: "transparent",
                  color: colors.textFaint,
                  cursor: "pointer",
                  fontSize: 13,
                  flexShrink: 0,
                  alignSelf: "center",
                }}
              >
                ✕
              </button>
              {(ei.unidad || it.dudoso) && (
                <div style={{ flexBasis: "100%" }}>
                  <MensajeCampo>{ei.unidad ?? "Revisa este producto: no se leía bien en la foto."}</MensajeCampo>
                </div>
              )}
            </div>
          );
        })}
        <MensajeCampo>{ver.items}</MensajeCampo>
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
          Solo los ítems vinculados a un ingrediente suman al stock, convertidos a la unidad en que lo compras.
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
          El total no cuadra con los productos ({formatMoney(subtotal)}, o {formatMoney(totalCalculado)} con ITBIS). Revisa
          los ítems.{" "}
          <button
            type="button"
            onClick={() => setTotalManual(null)}
            style={{
              border: "none",
              background: "transparent",
              color: colors.accent,
              fontWeight: 800,
              textDecoration: "underline",
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 12,
              padding: 0,
            }}
          >
            Usar {formatMoney(totalCalculado)}
          </button>
        </p>
      )}

      {intentado && hayErrores(errores) && (
        <p role="status" style={{ fontSize: 12.5, fontWeight: 700, color: colors.accent, margin: 0, textAlign: "right" }}>
          Revisa lo marcado antes de guardar.
        </p>
      )}

      <button type="button" onClick={confirmar} style={{ ...buttonStyle, alignSelf: "flex-end" }}>
        Confirmar y aplicar al inventario
      </button>
    </div>
    </>
  );
}
