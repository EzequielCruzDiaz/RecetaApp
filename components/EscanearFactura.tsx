"use client";

import { useRef, useState } from "react";
import { parseFacturaTexto, type CamposFacturaOCR } from "@/lib/factura-ocr";
import { TESSERACT_LANG, TESSERACT_OPTIONS } from "@/lib/ocr-config";
import { colors, font, radius, shadow } from "@/lib/tokens";
import { Card, Mosaico } from "./ui";

interface EscanearFacturaProps {
  onDetectado: (campos: CamposFacturaOCR) => void;
}

const ESTADO_COLOR: Record<"idle" | "procesando" | "listo" | "error", string> = {
  idle: "#B7C6BC",
  procesando: "#B7C6BC",
  listo: "#8FBF8F",
  error: "#E8927A",
};

export function EscanearFactura({ onDetectado }: EscanearFacturaProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [estado, setEstado] = useState<"idle" | "procesando" | "listo" | "error">("idle");
  const [progreso, setProgreso] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [texto, setTexto] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function procesar(file: File) {
    setEstado("procesando");
    setProgreso(0);
    setError(null);
    setTexto("");
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });

    try {
      const { default: Tesseract } = await import("tesseract.js");
      const { data } = await Tesseract.recognize(file, TESSERACT_LANG, {
        ...TESSERACT_OPTIONS,
        logger: (m: { status: string; progress: number }) => {
          if (m.status === "recognizing text") setProgreso(Math.round(m.progress * 100));
        },
      });
      setTexto(data.text);
      onDetectado(parseFacturaTexto(data.text));
      setEstado("listo");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo leer la imagen.");
      setEstado("error");
    }
  }

  const mensaje =
    estado === "listo"
      ? "Campos precargados ✓ Revísalos abajo antes de guardar."
      : estado === "procesando"
        ? `Leyendo la imagen con OCR… ${progreso}%`
        : estado === "error"
          ? error
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
          {estado === "procesando" ? `Leyendo… ${progreso}%` : "Elegir imagen"}
        </button>
      </div>

      {preview && (
        <Card style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Factura escaneada"
            style={{ maxWidth: 260, borderRadius: radius.sm, border: `1px solid ${colors.border}` }}
          />
          {texto && (
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
                {texto}
              </pre>
            </details>
          )}
        </Card>
      )}
    </div>
  );
}
