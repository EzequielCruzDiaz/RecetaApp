"use client";

import { useState } from "react";
import type { InventoryIngredient, Receta } from "@/lib/types";
import { colors, font, numeric, radius } from "@/lib/tokens";
import { etiquetaPrecio } from "@/lib/units";
import { TIEMPOS, useRecetaEditor, type EstadoEditor, type ItemResumen } from "@/hooks/useRecetaEditor";
import type { Odometro } from "@/lib/odometer";
import { buttonStyle, formatMoney, inputStyle, NumberInput, Select } from "./ui";

interface RecetaEditorProps {
  inventario: InventoryIngredient[];
  recetaInicial?: Receta;
  onGuardar: (receta: Receta) => void;
}

function estadoDesdeReceta(r: Receta, inventario: InventoryIngredient[]): Partial<EstadoEditor> {
  return {
    nombre: r.nombre,
    porciones: r.porciones,
    items: r.ingredientes.map((ri) => {
      const ing = inventario.find((i) => i.id === ri.ingredientId);
      return {
        ingredientId: ri.ingredientId,
        cantidad: ri.cantidad ?? 0,
        unidad: ri.unidad ?? ing?.unidadCompra ?? "unidad",
        alGusto: ri.alGusto,
        estado: "activo" as const,
      };
    }),
  };
}

/* ------------------------------------------------------------------ */
/* Odómetro                                                            */
/* ------------------------------------------------------------------ */

function DigitoColumna({ digito, tenue }: { digito: number; tenue: boolean }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: "1ch",
        height: "1em",
        overflow: "hidden",
        verticalAlign: "top",
      }}
    >
      <span
        style={{
          display: "block",
          transform: `translateY(${-digito}em)`,
          transition: "transform 480ms cubic-bezier(0.22, 0.9, 0.2, 1), opacity 480ms",
          opacity: tenue ? 0.32 : 1,
        }}
      >
        {Array.from({ length: 10 }, (_, n) => (
          <span key={n} style={{ display: "block", height: "1em", lineHeight: "1em" }}>
            {n}
          </span>
        ))}
      </span>
    </span>
  );
}

function Odometro({ valor, size = 20, color }: { valor: Odometro; size?: number; color: string }) {
  return (
    <span
      style={{
        ...numeric,
        fontFamily: font.family,
        fontWeight: 700,
        fontSize: size,
        color,
        display: "inline-flex",
      }}
    >
      {valor.entero.map((d, i) => (
        <DigitoColumna key={`e${i}`} {...d} />
      ))}
      <span>.</span>
      {valor.decimal.map((d, i) => (
        <DigitoColumna key={`d${i}`} {...d} />
      ))}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Fila de ingrediente                                                 */
/* ------------------------------------------------------------------ */

function FilaIngrediente({
  item,
  esNuevo,
  onIncrementar,
  onDecrementar,
  onCantidad,
  onUnidad,
  onAlGusto,
  onQuitar,
}: {
  item: ItemResumen;
  esNuevo: boolean;
  onIncrementar: () => void;
  onDecrementar: () => void;
  onCantidad: (v: number) => void;
  onUnidad: (u: ItemResumen["unidad"]) => void;
  onAlGusto: (v: boolean) => void;
  onQuitar: () => void;
}) {
  const saliendo = item.estado === "saliendo";
  const tachando = item.estado !== "activo";

  return (
    <div
      style={{
        // Colapso: la fila se achica a 0 mientras se desvanece.
        maxHeight: saliendo ? 0 : 400,
        opacity: saliendo ? 0 : 1,
        marginBottom: saliendo ? 0 : 10,
        overflow: "hidden",
        transition: `max-height ${TIEMPOS.eliminar - TIEMPOS.colapsar}ms ease, opacity ${
          TIEMPOS.eliminar - TIEMPOS.colapsar
        }ms ease, margin-bottom ${TIEMPOS.eliminar - TIEMPOS.colapsar}ms ease`,
      }}
    >
      <div
        style={{
          border: `1px solid ${item.error ? colors.accent : colors.border}`,
          borderRadius: radius.lg,
          padding: 14,
          background: colors.surface,
          animation: esNuevo ? "recetaItemEntra 420ms cubic-bezier(0.2,0.9,0.2,1)" : undefined,
          opacity: tachando ? 0.55 : 1,
          transition: "opacity 200ms ease",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                fontSize: 14,
                fontWeight: 600,
                margin: 0,
                color: colors.text,
                fontFamily: font.family,
                textDecorationLine: tachando ? "line-through" : "none",
                textDecorationColor: colors.accent,
                transition: "text-decoration-color 150ms",
              }}
            >
              {item.nombre}
            </p>
          </div>
          <button
            type="button"
            onClick={onQuitar}
            aria-label={`Quitar ${item.nombre}`}
            disabled={tachando}
            style={{
              border: "none",
              background: "transparent",
              color: colors.textFaint,
              cursor: tachando ? "default" : "pointer",
              fontSize: 14,
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: colors.textMuted, marginBottom: 10 }}>
          <input
            type="checkbox"
            checked={item.alGusto}
            onChange={(e) => onAlGusto(e.target.checked)}
            style={{ accentColor: colors.accent }}
          />
          Al gusto (sin costo cuantificado)
        </label>

        {!item.alGusto && (
          <>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
              {item.opciones.map((o) => {
                const activa = o.unidad === item.unidad;
                return (
                  <button
                    key={o.unidad}
                    type="button"
                    onClick={() => onUnidad(o.unidad)}
                    title={o.caption}
                    style={{
                      border: `1px solid ${activa ? colors.secondary : colors.border}`,
                      background: activa ? `${colors.secondary}1f` : "transparent",
                      color: activa ? colors.text : colors.textMuted,
                      fontWeight: activa ? 700 : 500,
                      borderRadius: 999,
                      padding: "4px 10px",
                      fontSize: 12,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button type="button" onClick={onDecrementar} style={pasoBotonStyle}>
                −
              </button>
              <NumberInput
                value={item.cantidad}
                onChange={onCantidad}
                style={{ ...inputStyle, ...numeric, width: 80, textAlign: "center" }}
              />
              <button type="button" onClick={onIncrementar} style={pasoBotonStyle}>
                +
              </button>

              <span style={{ marginLeft: "auto", fontSize: 13, ...numeric, fontWeight: 700, color: colors.text }}>
                {item.error ? "—" : item.costo !== null ? formatMoney(item.costo) : "—"}
              </span>
            </div>

            {item.error && (
              <p style={{ fontSize: 11.5, color: colors.accent, margin: "8px 0 0" }}>{item.error}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const pasoBotonStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 8,
  border: `1px solid ${colors.border}`,
  background: colors.bg,
  color: colors.text,
  fontSize: 16,
  fontWeight: 700,
  cursor: "pointer",
  flexShrink: 0,
};

/* ------------------------------------------------------------------ */
/* Editor                                                               */
/* ------------------------------------------------------------------ */

export function RecetaEditor({ inventario, recetaInicial, onGuardar }: RecetaEditorProps) {
  const [categoria, setCategoria] = useState(recetaInicial?.categoria ?? "");
  const [unidadRendimiento, setUnidadRendimiento] = useState(
    recetaInicial?.unidadRendimiento ?? "porciones",
  );

  const { estado, resumen, acciones } = useRecetaEditor(inventario, {
    inicial: recetaInicial ? estadoDesdeReceta(recetaInicial, inventario) : undefined,
    onGuardar: (receta) => {
      onGuardar({
        ...receta,
        categoria: categoria.trim() || undefined,
        unidadRendimiento: unidadRendimiento.trim() || "porciones",
      });
      if (!recetaInicial) {
        setCategoria("");
        setUnidadRendimiento("porciones");
      }
    },
  });

  function guardar() {
    if (estado.nombre.trim() === "" || resumen.items.length === 0) return;
    acciones.guardar();
  }

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
          {recetaInicial ? "Editar receta" : "Agregar una receta"}
        </h3>
        {!recetaInicial && (
          <p style={{ fontSize: 12, color: colors.textMuted, margin: "4px 0 0" }}>
            Elegí ingredientes del inventario y cuánto usa esta receta de cada uno — el costo se calcula solo.
          </p>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
        <label style={{ fontSize: 12, color: colors.textMuted }}>
          Nombre
          <input value={estado.nombre} onChange={(e) => acciones.setNombre(e.target.value)} style={inputStyle} />
        </label>
        <label style={{ fontSize: 12, color: colors.textMuted }}>
          Categoría
          <input
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            placeholder="Acompañantes"
            style={inputStyle}
          />
        </label>
        <label style={{ fontSize: 12, color: colors.textMuted }}>
          Rendimiento
          <NumberInput
            min={1}
            value={estado.porciones}
            onChange={acciones.setPorciones}
            style={{ ...inputStyle, ...numeric }}
          />
        </label>
        <label style={{ fontSize: 12, color: colors.textMuted }}>
          Unidad de rendimiento
          <input
            value={unidadRendimiento}
            onChange={(e) => setUnidadRendimiento(e.target.value)}
            placeholder="porciones / lb / unidades"
            style={inputStyle}
          />
        </label>
      </div>

      <label style={{ fontSize: 12, color: colors.textMuted, display: "flex", alignItems: "center", gap: 8 }}>
        Avisarme si el costo por porción supera
        <NumberInput
          min={0}
          value={estado.limite}
          onChange={acciones.setLimite}
          style={{ ...inputStyle, ...numeric, width: 90 }}
        />
        <span style={numeric}>{formatMoney(estado.limite)}</span>
      </label>

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted }}>Ingredientes</span>

        {resumen.items.map((item) => (
          <FilaIngrediente
            key={item.ingredientId}
            item={item}
            esNuevo={item.ingredientId === estado.nuevoId}
            onIncrementar={() => acciones.incrementar(item.ingredientId)}
            onDecrementar={() => acciones.decrementar(item.ingredientId)}
            onCantidad={(v) => acciones.setCantidad(item.ingredientId, v)}
            onUnidad={(u) => acciones.setUnidad(item.ingredientId, u)}
            onAlGusto={(v) => acciones.setAlGusto(item.ingredientId, v)}
            onQuitar={() => acciones.quitar(item.ingredientId)}
          />
        ))}

        {resumen.disponibles.length > 0 && (
          <Select
            value=""
            onChange={(v) => v && acciones.agregar(v)}
            placeholder="+ Agregar ingrediente"
            options={resumen.disponibles.map((i) => ({ value: i.id, label: `${i.nombre} — ${etiquetaPrecio(i)}` }))}
            style={{ marginTop: 6 }}
          />
        )}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 10,
          borderTop: `1px solid ${colors.border}`,
          paddingTop: 12,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div style={{ fontSize: 11, color: colors.textMuted }}>
            Total <Odometro valor={resumen.odometroTotal} size={13} color={colors.textMuted} />
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 11,
              color: colors.textMuted,
            }}
          >
            Por {(unidadRendimiento || "porción").replace(/s$/, "")}{" "}
            <Odometro
              valor={resumen.odometroPorcion}
              size={18}
              color={resumen.superaLimite ? colors.accent : colors.text}
            />
            {resumen.superaLimite && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 0.3,
                  textTransform: "uppercase",
                  color: colors.accent,
                  border: `1px solid ${colors.accent}`,
                  borderRadius: 999,
                  padding: "2px 8px",
                }}
              >
                Supera el límite
              </span>
            )}
          </div>
        </div>
        <button type="button" onClick={guardar} style={buttonStyle}>
          {recetaInicial ? "Guardar cambios" : "Guardar receta"}
        </button>
      </div>
    </div>
  );
}
