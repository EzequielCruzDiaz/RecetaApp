"use client";

import { supabaseConfigurado } from "@/lib/supabase/config";
import { getSupabase } from "@/lib/supabase/client";
import { colors } from "@/lib/tokens";

const sidebarButtonStyle: React.CSSProperties = {
  fontWeight: 500,
  border: "none",
  color: colors.sidebarMuted,
  background: "transparent",
};

export function SignOutButton() {
  if (!supabaseConfigurado) return null;
  return (
    <button
      type="button"
      className="app-sidebar-action"
      style={sidebarButtonStyle}
      onClick={() => {
        void getSupabase().auth.signOut();
      }}
    >
      Cerrar sesión
    </button>
  );
}
