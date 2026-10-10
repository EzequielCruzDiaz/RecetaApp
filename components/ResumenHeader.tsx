"use client";

import { useState } from "react";
import { colors, font } from "@/lib/tokens";
import { Eyebrow, inputStyle } from "./ui";

interface ResumenHeaderProps {
  nombreNegocio: string;
  onGuardarNombre: (nombre: string) => void;
}

export function ResumenHeader({ nombreNegocio, onGuardarNombre }: ResumenHeaderProps) {
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(nombreNegocio);

  function guardar(e: React.FormEvent) {
    e.preventDefault();
    onGuardarNombre(valor.trim());
    setEditando(false);
  }

  return (
    <header style={{ marginBottom: 28 }}>
      {editando ? (
        <form onSubmit={guardar} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <input
            autoFocus
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="Nombre de tu cocina"
            style={{ ...inputStyle, width: 220, fontSize: 13, padding: "5px 9px" }}
          />
          <button
            type="submit"
            style={{ border: "none", background: "none", color: colors.secondary, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
          >
            Guardar
          </button>
          <button
            type="button"
            onClick={() => setEditando(false)}
            style={{ border: "none", background: "none", color: colors.textFaint, fontSize: 12, cursor: "pointer" }}
          >
            Cancelar
          </button>
        </form>
      ) : (
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 6 }}>
          <Eyebrow>Buen día{nombreNegocio ? `, ${nombreNegocio}` : ""}</Eyebrow>
          <button
            type="button"
            onClick={() => {
              setValor(nombreNegocio);
              setEditando(true);
            }}
            style={{
              border: "none",
              background: "none",
              color: colors.textFaint,
              fontSize: 11,
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            {nombreNegocio ? "editar" : "agregar el nombre de tu cocina"}
          </button>
        </div>
      )}
      <h1 style={{ fontFamily: font.family, fontSize: 28, fontWeight: 700, margin: 0, color: colors.text }}>
        Resumen de la cocina
      </h1>
      <p style={{ fontSize: 14, color: colors.textMuted, margin: "8px 0 0" }}>
        Estado general de recetas e inventario.
      </p>
    </header>
  );
}
