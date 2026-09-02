"use client";

import { useRef, useState } from "react";
import { parseFacturaTexto, type CamposFacturaOCR } from "../lib/factura-ocr";
import { colors, radius } from "../lib/tokens";
import { buttonStyle } from "./ui";

interface EscanearFacturaProps {
  onDetectado: (campos: CamposFacturaOCR) => void;
}

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
      const { data } = await Tesseract.recognize(file, "spa", {
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

  return (
    <div
      style={{
        border: `1px dashed ${colors.border}`,
        borderRadius: radius.md,
        padding: 20,
        background: colors.surface,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div>
        <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0, color: colors.text }}>Escanear factura</h3>
        <p style={{ fontSize: 12, color: colors.textFaint, margin: "4px 0 0" }}>
          Subí una foto o escaneo. Se lee con OCR y precarga el formulario de abajo — revisá todo antes de guardar.
        </p>
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

      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <button
          type="button"
          style={{ ...buttonStyle, opacity: estado === "procesando" ? 0.6 : 1 }}
          disabled={estado === "procesando"}
          onClick={() => inputRef.current?.click()}
        >
          {estado === "procesando" ? `Leyendo… ${progreso}%` : "Elegir imagen"}
        </button>
        {estado === "listo" && (
          <span style={{ fontSize: 13, color: colors.positive }}>Campos precargados ✓ — revisalos abajo</span>
        )}
        {estado === "error" && <span style={{ fontSize: 13, color: colors.accent }}>{error}</span>}
      </div>

      {preview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt="Factura escaneada"
          style={{ maxWidth: 260, borderRadius: radius.sm, border: `1px solid ${colors.border}` }}
        />
      )}

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
    </div>
  );
}
