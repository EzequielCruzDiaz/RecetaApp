"use client";

import { supabaseConfigurado } from "@/lib/supabase/config";
import { getSupabase } from "@/lib/supabase/client";
import { colors } from "@/lib/tokens";

const sidebarButtonStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  padding: "9px 12px",
  borderRadius: 9,
  border: "none",
  color: colors.sidebarMuted,
  background: "transparent",
  cursor: "pointer",
  fontFamily: "inherit",
};

export function SignOutButton() {
  if (!supabaseConfigurado) return null;
  return (
    <button
      type="button"
      style={{ ...sidebarButtonStyle, width: "100%" }}
      onClick={() => {
        void getSupabase().auth.signOut();
      }}
    >
      Cerrar sesión
    </button>
  );
}
