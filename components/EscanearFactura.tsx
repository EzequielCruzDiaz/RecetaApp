"use client";

import { useRef, useState } from "react";
import { cuadreLectura, type LecturaFactura } from "@/lib/factura-lectura";
import { leerFactura } from "@/lib/leer-factura";
import { colors, font, numeric, radius, shadow } from "@/lib/tokens";
import { Card, Mosaico, formatMoney } from "./ui";

interface EscanearFacturaProps {
  lecturas: LecturaFactura[];
  onLeida: (lectura: LecturaFactura) => void;
  onQuitar: (lectura: LecturaFactura) => void;
}

const ESTADO_COLOR: Record<"idle" | "procesando" | "listo" | "error", string> = {
  idle: "#B7C6BC",
  procesando: "#B7C6BC",
  listo: "#8FBF8F",
  error: "#E8927A",
};

let siguienteId = 0;

export function EscanearFactura({ lecturas, onLeida, onQuitar }: EscanearFacturaProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [estado, setEstado] = useState<"idle" | "procesando" | "listo" | "error">("idle");
  const [fase, setFase] = useState<"ia" | "ocr">("ia");
  const [progreso, setProgreso] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [ultima, setUltima] = useState<{ leidos: number; motor: "ia" | "ocr"; avisoIA?: string } | null>(null);

  async function procesar(file: File) {
    setEstado("procesando");
    setProgreso(0);
    setError(null);
    try {
      const { motor, campos, avisoIA } = await leerFactura(file, (f, pct) => {
        setFase(f);
        setProgreso(pct);
      });
      onLeida({ id: `lectura-${Date.now()}-${siguienteId++}`, foto: URL.createObjectURL(file), motor, campos });
      setUltima({ leidos: campos.items.length, motor, avisoIA });
      setEstado("listo");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo leer la imagen.");
      setEstado("error");
    }
  }

  const otra = lecturas.length > 0;
  const mensaje =
    estado === "procesando"
      ? fase === "ia"
        ? "Leyendo la factura…"
        : `Leyendo la imagen con OCR… ${progreso}%`
      : estado === "error"
        ? error
        : estado === "listo" && ultima
          ? ultima.leidos > 0
            ? `Leí ${ultima.leidos} ${ultima.leidos === 1 ? "producto" : "productos"} ✓ Revísalos abajo antes de guardar.` +
              (ultima.motor === "ocr" && ultima.avisoIA ? ` (Sin IA: ${ultima.avisoIA.toLowerCase()}. Revisa con más cuidado.)` : "")
            : "No pude leer los productos. Toma la foto de frente, con buena luz y que salga la factura entera."
          : "Toma una foto y completamos suplidor, fecha, RNC, NCF e ítems automáticamente. Es opcional.";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          background: colors.monte,
          borderRadius: radius.xl,
          boxShadow: shadow.raised,
          padding: "22px 24px",
          display: "flex",
          alignItems: "center",
          gap: 20,
          color: colors.sidebarText,
          flexWrap: "wrap",
        }}
      >
        <Mosaico color={colors.mango} opacity={0.07} size={56} />
        <div
          style={{
            position: "relative",
            width: 54,
            height: 54,
            borderRadius: 18,
            transform: "rotate(-4deg)",
            background: colors.mango,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg width="24" height="24" viewBox="0 0 20 20" fill="none" stroke={colors.monte} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="14" height="11" rx="2" />
            <circle cx="10" cy="10.5" r="3" />
            <path d="M8 5l1-1.5h2L12 5" />
          </svg>
        </div>

        <div style={{ position: "relative", flex: 1, minWidth: 180 }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.4, textTransform: "uppercase", color: colors.mango }}>
            Paso 1 · opcional
          </div>
          <div style={{ fontFamily: font.display, fontSize: 22, fontWeight: 600, marginTop: 2 }}>Escanear factura</div>
          <div style={{ fontSize: 13.5, color: ESTADO_COLOR[estado], marginTop: 4, lineHeight: 1.45 }}>{mensaje}</div>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) procesar(f);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          disabled={estado === "procesando"}
          onClick={() => inputRef.current?.click()}
          style={{
            position: "relative",
            fontSize: 14,
            fontWeight: 800,
            padding: "11px 20px",
            borderRadius: 999,
            border: "none",
            color: "#FFFFFF",
            background: colors.accent,
            cursor: "pointer",
            fontFamily: "inherit",
            flexShrink: 0,
            minWidth: 130,
            opacity: estado === "procesando" ? 0.7 : 1,
          }}
        >
          {estado === "procesando"
            ? fase === "ia"
              ? "Leyendo…"
              : `Leyendo… ${progreso}%`
            : otra
              ? "Agregar otra factura"
              : "Elegir imagen"}
        </button>
      </div>

      {otra && (
        <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 4 }}>
          {lecturas.map((l, i) => (
            <FotoLeida key={l.id} lectura={l} numero={i + 1} onQuitar={() => onQuitar(l)} />
          ))}
        </div>
      )}
    </div>
  );
}

function FotoLeida({ lectura, numero, onQuitar }: { lectura: LecturaFactura; numero: number; onQuitar: () => void }) {
  const { campos } = lectura;
  const cuadre = cuadreLectura(campos);
  const n = campos.items.length;
  return (
    <Card style={{ display: "flex", flexDirection: "column", gap: 8, width: 230, flexShrink: 0, padding: 12 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={lectura.foto}
        alt={`Factura ${numero}`}
        style={{
          width: "100%",
          height: 150,
          objectFit: "cover",
          objectPosition: "top",
          borderRadius: radius.sm,
          border: `1px solid ${colors.border}`,
        }}
      />
      <div style={{ fontSize: 13, fontWeight: 700, color: colors.text }}>
        Factura {numero}
        {campos.proveedor ? ` · ${campos.proveedor}` : ""}
      </div>
      <div style={{ fontSize: 12, color: colors.textMuted, ...numeric }}>
        {n} {n === 1 ? "producto" : "productos"} · {lectura.motor === "ia" ? "leída con IA" : "leída con OCR"}
      </div>
      {cuadre.cuadra === true && (
        <div style={{ fontSize: 12, fontWeight: 600, color: colors.positive, ...numeric }}>
          Cuadra con el total ({formatMoney(cuadre.total!)}) ✓
        </div>
      )}
      {cuadre.cuadra === false && (
        <div role="alert" style={{ fontSize: 12, fontWeight: 600, color: colors.accent, lineHeight: 1.35, ...numeric }}>
          Los productos suman {formatMoney(cuadre.suma)} y la factura dice {formatMoney(cuadre.total!)}. Revisa los marcados.
        </div>
      )}
      {campos.dudas?.map((d) => (
        <div key={d} style={{ fontSize: 11.5, color: colors.textMuted, lineHeight: 1.35 }}>
          • {d}
        </div>
      ))}
      {lectura.motor === "ocr" && campos.textoCrudo && (
        <details style={{ fontSize: 12, color: colors.textMuted }}>
          <summary style={{ cursor: "pointer" }}>Ver texto reconocido</summary>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              fontFamily: "inherit",
              marginTop: 8,
              maxHeight: 220,
              overflow: "auto",
              background: colors.bg,
              padding: 10,
              borderRadius: radius.sm,
            }}
          >
            {campos.textoCrudo}
          </pre>
        </details>
      )}
      <button
        type="button"
        onClick={onQuitar}
        style={{
          alignSelf: "flex-start",
          border: "none",
          background: "transparent",
          color: colors.accent,
          fontSize: 12.5,
          fontWeight: 800,
          cursor: "pointer",
          fontFamily: "inherit",
          padding: 0,
          textDecoration: "underline",
        }}
      >
        Quitar factura y sus productos
      </button>
    </Card>
  );
}
