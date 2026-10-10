"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { InventoryIngredient, Receta } from "@/lib/types";
import { computeIngredientCost } from "@/lib/conversion";
import { colors, font, numeric, radius, shadow } from "@/lib/tokens";
import { Mosaico, NumberInput, formatMoney, inputStyle, unidadSingular } from "./ui";

interface EscaladorRecetaProps {
  receta: Receta;
  inventario: InventoryIngredient[];
  /** Guarda la cantidad a producir de esta receta (`null` = la receta base). */
  onGuardarProduccion: (produccion: number | null) => void;
  onCerrar?: () => void;
}

/** Espera a que se termine de escribir antes de guardar. */
const ESPERA_GUARDADO_MS = 500;

export function EscaladorReceta({ receta, inventario, onGuardarProduccion, onCerrar }: EscaladorRecetaProps) {
  const rinde = receta.unidadRendimiento ?? "porciones";
  const [deseada, setDeseadaLocal] = useState(receta.produccion ?? receta.porciones);

  const pendiente = useRef<{ timer: ReturnType<typeof setTimeout>; guardar: () => void } | null>(null);
  // Si se cierra el escalador antes de que pase la espera, se guarda igual.
  useEffect(
    () => () => {
      if (!pendiente.current) return;
      clearTimeout(pendiente.current.timer);
      pendiente.current.guardar();
    },
    [],
  );

  function setDeseada(n: number) {
    setDeseadaLocal(n);
    if (pendiente.current) clearTimeout(pendiente.current.timer);
    const guardar = () => {
      pendiente.current = null;
      if (n > 0) onGuardarProduccion(n === receta.porciones ? null : n);
    };
    pendiente.current = { timer: setTimeout(guardar, ESPERA_GUARDADO_MS), guardar };
  }

  const inventarioMap = useMemo(
    () => Object.fromEntries(inventario.map((i) => [i.id, i])),
    [inventario],
  );

  const ratio = receta.porciones > 0 && deseada > 0 ? deseada / receta.porciones : 1;

  const filas = receta.ingredientes.map((ri) => {
    const ing = inventarioMap[ri.ingredientId];
    const nombre = ing?.nombre ?? ri.ingredientId;
    const alGusto = ri.alGusto || ri.cantidad === null || ri.unidad === null;
    const cantidad = alGusto ? null : (ri.cantidad as number) * ratio;

    let costo: number | null = null;
    if (!alGusto && ing && cantidad !== null && ri.unidad) {
      try {
        costo = computeIngredientCost(ing, cantidad, ri.unidad);
      } catch {
        costo = null;
      }
    }
    return { nombre, unidad: ri.unidad, cantidad, alGusto, costo };
  });

  const total = filas.reduce((acc, f) => acc + (f.costo ?? 0), 0);
  const porUnidad = deseada > 0 ? total / deseada : 0;

  const rindeSingular = unidadSingular(rinde);

  return (
    <section
      style={{
        position: "relative",
        overflow: "hidden",
        background: colors.monte,
        color: colors.sidebarText,
        borderRadius: radius.xl,
        boxShadow: shadow.raised,
        padding: "24px 26px",
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}
    >
      <Mosaico color={colors.mango} opacity={0.06} size={56} />

      <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.4, textTransform: "uppercase", color: colors.mango }}>
            Escalar producción
          </div>
          <h3 style={{ fontFamily: font.display, fontSize: 28, fontWeight: 600, letterSpacing: -0.5, margin: "6px 0 0" }}>
            {receta.nombre}
          </h3>
          <p style={{ fontSize: 13.5, color: colors.sidebarMuted, margin: "4px 0 0" }}>
            La receta base rinde <span style={numeric}>{receta.porciones}</span> {rinde}.
          </p>
        </div>
        {onCerrar && (
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar escalador"
            style={{
              border: "1px solid rgba(244,236,223,0.25)",
              background: "transparent",
              color: colors.sidebarText,
              borderRadius: 999,
              width: 34,
              height: 34,
              cursor: "pointer",
              fontSize: 14,
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        )}
      </div>

      <label
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          fontSize: 16,
          fontWeight: 600,
        }}
      >
        Quiero producir
        <NumberInput
          min={0}
          value={deseada}
          onChange={setDeseada}
          style={{
            ...inputStyle,
            width: 110,
            fontSize: 22,
            fontWeight: 800,
            textAlign: "center",
            background: colors.surface,
            borderWidth: 2,
            borderColor: colors.mango,
            ...numeric,
          }}
        />
        {rinde}
        <span
          style={{
            fontSize: 13,
            fontWeight: 800,
            color: colors.monte,
            background: colors.mango,
            borderRadius: 999,
            padding: "4px 10px",
            ...numeric,
          }}
        >
          ×{Number(ratio.toFixed(2))}
        </span>
      </label>

      <div
        style={{
          position: "relative",
          background: colors.surface,
          color: colors.text,
          borderRadius: radius.lg,
          padding: "8px 18px",
        }}
      >
        {filas.map((f, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 10,
              padding: "10px 0",
              borderTop: i === 0 ? "none" : `1px dashed ${colors.border}`,
              fontSize: 14,
            }}
          >
            <span style={{ fontWeight: 700 }}>{f.nombre}</span>
            <span style={{ ...numeric, color: colors.textMuted, fontWeight: 600 }}>
              {f.alGusto || f.cantidad === null ? "a gusto" : `${Number(f.cantidad.toFixed(2))} ${f.unidad}`}
            </span>
            <span className="lider" />
            <span style={{ ...numeric, fontWeight: 700, whiteSpace: "nowrap" }}>
              {f.costo === null ? "—" : formatMoney(f.costo)}
            </span>
          </div>
        ))}
      </div>

      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color: colors.sidebarMuted }}>
            Costo total de la tanda
          </div>
          <div style={{ fontFamily: font.display, fontSize: 26, fontWeight: 600, ...numeric }}>{formatMoney(total)}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color: colors.sidebarMuted }}>
            Por {rindeSingular}
          </div>
          <div style={{ fontFamily: font.display, fontSize: 34, fontWeight: 600, color: colors.mango, ...numeric }}>
            {formatMoney(porUnidad)}
          </div>
        </div>
      </div>
    </section>
  );
}
