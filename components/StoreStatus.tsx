"use client";

import { useStore } from "./StoreProvider";
import { colors, radius } from "../lib/tokens";

export function StoreStatus() {
  const { origen, cargando, error } = useStore();
  if (origen !== "supabase") return null;

  if (error) {
    return (
      <div
        style={{
          marginBottom: 16,
          padding: "8px 12px",
          borderRadius: radius.sm,
          border: `1px solid ${colors.accent}`,
          color: colors.accent,
          fontSize: 13,
        }}
      >
        {error}
      </div>
    );
  }

  if (cargando) {
    return (
      <div style={{ marginBottom: 16, fontSize: 13, color: colors.textMuted }}>Cargando…</div>
    );
  }

  return null;
}
