"use client";

import { useState } from "react";
import { colors, font } from "@/lib/tokens";
import { Eyebrow, MensajeCampo, conError, inputStyle } from "./ui";

interface EncabezadoResumenProps {
  nombreNegocio: string;
  onGuardarNombre: (nombre: string) => void;
}

function saludo(hora: number): string {
  if (hora < 12) return "Buen día";
  if (hora < 19) return "Buenas tardes";
  return "Buenas noches";
}

function fechaLarga(d: Date): string {
  const s = d.toLocaleDateString("es-DO", { weekday: "long", day: "numeric", month: "long" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function EncabezadoResumen({ nombreNegocio, onGuardarNombre }: EncabezadoResumenProps) {
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(nombreNegocio);
  const [error, setError] = useState<string>();
  const ahora = new Date();

  function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!valor.trim()) {
      setError("Escribe el nombre de tu cocina.");
      return;
    }
    setError(undefined);
    onGuardarNombre(valor.trim());
    setEditando(false);
  }

  return (
    <header style={{ marginBottom: 30 }}>
      <Eyebrow>
        <span suppressHydrationWarning>{fechaLarga(ahora)}</span>
      </Eyebrow>

      {editando ? (
        <form onSubmit={guardar} style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <input
            autoFocus
            value={valor}
            onChange={(e) => {
              setValor(e.target.value);
              if (e.target.value.trim()) setError(undefined);
            }}
            placeholder="Nombre de tu cocina"
            aria-invalid={error ? true : undefined}
            style={conError({ ...inputStyle, width: 300, maxWidth: "100%", fontSize: 18, fontFamily: font.display }, error)}
          />
          <button
            type="submit"
            style={{ border: "none", background: "none", color: colors.accent, fontSize: 13, fontWeight: 800, cursor: "pointer" }}
          >
            Guardar
          </button>
          <button
            type="button"
            onClick={() => setEditando(false)}
            style={{ border: "none", background: "none", color: colors.textFaint, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
          >
            Cancelar
          </button>
          {error && (
            <div style={{ flexBasis: "100%" }}>
              <MensajeCampo>{error}</MensajeCampo>
            </div>
          )}
        </form>
      ) : (
        <h1
          style={{
            fontFamily: font.display,
            fontSize: 40,
            fontWeight: 600,
            letterSpacing: -1,
            lineHeight: 1.08,
            margin: 0,
            color: colors.text,
          }}
        >
          <span suppressHydrationWarning>{saludo(ahora.getHours())}</span>
          {nombreNegocio ? "," : ""}{" "}
          {nombreNegocio && <em style={{ fontStyle: "italic", fontWeight: 500, color: colors.monteSoft }}>{nombreNegocio}</em>}
          <button
            type="button"
            onClick={() => {
              setValor(nombreNegocio);
              setEditando(true);
            }}
            style={{
              marginLeft: 12,
              verticalAlign: "middle",
              border: `1px solid ${colors.border}`,
              borderRadius: 999,
              background: colors.surface,
              color: colors.textMuted,
              fontFamily: font.family,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 0,
              padding: "5px 11px",
              cursor: "pointer",
            }}
          >
            {nombreNegocio ? "Editar" : "Ponle nombre a tu cocina"}
          </button>
        </h1>
      )}
      <p style={{ fontSize: 15, color: colors.textMuted, margin: "10px 0 0" }}>
        Así va tu cocina hoy: costos, inventario y compras en un vistazo.
      </p>
    </header>
  );
}
