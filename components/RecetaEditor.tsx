"use client";

import { useRef, useState } from "react";
import type { InventoryIngredient, Receta } from "@/lib/types";
import { colors, font, numeric, radius } from "@/lib/tokens";
import { etiquetaPrecio } from "@/lib/units";
import { TIEMPOS, useRecetaEditor, type EstadoEditor, type ItemResumen } from "@/hooks/useRecetaEditor";
import type { Odometro } from "@/lib/odometer";
import { sinErrores, validarReceta } from "@/lib/validacion";
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
  unidadSingular,
} from "./ui";

interface RecetaEditorProps {
  inventario: InventoryIngredient[];
  /** Para avisar si el nombre ya existe. */
  recetas: Receta[];
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
        fontFamily: font.display,
        fontWeight: 600,
        fontSize: size,
        color,
        display: "inline-flex",
      }}
    >
      <span>RD$</span>
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
  aviso,
}: {
  item: ItemResumen;
  esNuevo: boolean;
  /** Lo que falta para poder guardar (cantidad en 0, unidades que no convierten). */
  aviso?: string;
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
          border: `1px solid ${item.error || aviso ? colors.accent : colors.border}`,
          borderLeft: `4px solid ${item.error || aviso ? colors.accent : colors.mango}`,
          borderRadius: radius.md,
          padding: "14px 16px",
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
                fontSize: 15,
                fontWeight: 700,
                margin: 0,
                color: colors.text,
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

        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 10 }}>
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
                      border: `1px solid ${activa ? colors.monte : colors.border}`,
                      background: activa ? colors.monte : "transparent",
                      color: activa ? colors.sidebarText : colors.textMuted,
                      fontWeight: 700,
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
                aria-label={`Cantidad de ${item.nombre}`}
                aria-invalid={aviso && !item.error ? true : undefined}
                style={conError({ ...inputStyle, ...numeric, width: 80, textAlign: "center" }, aviso && !item.error ? aviso : undefined)}
              />
              <button type="button" onClick={onIncrementar} style={pasoBotonStyle}>
                +
              </button>

              <span style={{ marginLeft: "auto", fontSize: 15, ...numeric, fontWeight: 800, color: colors.text }}>
                {item.error ? "—" : item.costo !== null ? formatMoney(item.costo) : "—"}
              </span>
            </div>

            {item.error ? (
              <p style={{ fontSize: 11.5, color: colors.accent, margin: "8px 0 0" }}>{item.error}</p>
            ) : (
              aviso && (
                <p style={{ margin: "8px 0 0" }}>
                  <MensajeCampo>{aviso}</MensajeCampo>
                </p>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}

const pasoBotonStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 999,
  border: `1px solid ${colors.border}`,
  background: colors.surfaceAlt,
  color: colors.text,
  fontSize: 16,
  fontWeight: 700,
  cursor: "pointer",
  flexShrink: 0,
};

/* ------------------------------------------------------------------ */
/* Editor                                                               */
/* ------------------------------------------------------------------ */

export function RecetaEditor({ inventario, recetas, recetaInicial, onGuardar }: RecetaEditorProps) {
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

  const [intentado, setIntentado] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const activos = resumen.items.filter((it) => it.estado === "activo");
  const errores = validarReceta(
    { nombre: estado.nombre, porciones: estado.porciones, items: activos },
    recetas,
    recetaInicial?.id,
  );
  const ver = intentado ? errores : { porItem: {} as Record<string, string> };

  function guardar() {
    if (!sinErrores(errores)) {
      setIntentado(true);
      requestAnimationFrame(() =>
        panelRef.current?.querySelector<HTMLElement>("[aria-invalid='true'], [data-invalido='true']")?.focus(),
      );
      return;
    }
    acciones.guardar();
  }

  return (
    <div ref={panelRef} style={formPanelStyle}>
      <FormHeader
        title={recetaInicial ? "Editar receta" : "Nueva receta"}
        hint={
          recetaInicial
            ? undefined
            : "Elige ingredientes del inventario y cuánto lleva de cada uno. El costo se calcula solo."
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
        <label style={labelStyle}>
          Nombre
          <input
            value={estado.nombre}
            onChange={(e) => acciones.setNombre(e.target.value)}
            placeholder="Moro de guandules"
            aria-invalid={ver.nombre ? true : undefined}
            style={conError(inputStyle, ver.nombre)}
          />
          <MensajeCampo>{ver.nombre}</MensajeCampo>
        </label>
        <label style={labelStyle}>
          Categoría
          <input
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            placeholder="Acompañantes"
            style={inputStyle}
          />
        </label>
        <label style={labelStyle}>
          Rendimiento
          <NumberInput
            min={1}
            value={estado.porciones}
            onChange={acciones.setPorciones}
            aria-invalid={ver.porciones ? true : undefined}
            style={conError({ ...inputStyle, ...numeric }, ver.porciones)}
          />
          <MensajeCampo>{ver.porciones}</MensajeCampo>
        </label>
        <label style={labelStyle}>
          Unidad de rendimiento
          <input
            value={unidadRendimiento}
            onChange={(e) => setUnidadRendimiento(e.target.value)}
            placeholder="porciones / lb / unidades"
            style={inputStyle}
          />
        </label>
      </div>

      <label style={{ fontSize: 13, fontWeight: 600, color: colors.textMuted, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
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
        <span style={{ ...labelStyle, marginBottom: 4 }}>Ingredientes</span>

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
            aviso={ver.porItem[item.ingredientId]}
          />
        ))}

        {resumen.disponibles.length > 0 && (
          <Select
            value=""
            onChange={(v) => v && acciones.agregar(v)}
            placeholder="+ Agregar ingrediente"
            options={resumen.disponibles.map((i) => ({ value: i.id, label: `${i.nombre} — ${etiquetaPrecio(i)}` }))}
            error={ver.ingredientes}
            style={{ marginTop: 6 }}
          />
        )}
        <MensajeCampo>
          {ver.ingredientes && resumen.disponibles.length === 0
            ? "Primero agrega ingredientes en Inventario."
            : ver.ingredientes}
        </MensajeCampo>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          background: colors.surfaceAlt,
          border: `1px solid ${colors.border}`,
          borderRadius: radius.lg,
          padding: "12px 12px 12px 18px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: colors.textMuted }}>
            La tanda <Odometro valor={resumen.odometroTotal} size={14} color={colors.text} />
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12.5,
              fontWeight: 600,
              color: colors.textMuted,
            }}
          >
            Por {unidadSingular(unidadRendimiento || "porciones")}{" "}
            <Odometro
              valor={resumen.odometroPorcion}
              size={24}
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
