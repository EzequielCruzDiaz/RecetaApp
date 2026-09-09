"use client";

import { supabaseConfigurado } from "../lib/supabase/config";
import { getSupabase } from "../lib/supabase/client";
import { ghostButtonStyle } from "./ui";

export function SignOutButton() {
  if (!supabaseConfigurado) return null;
  return (
    <button
      type="button"
      style={{ ...ghostButtonStyle, width: "100%" }}
      onClick={() => {
        void getSupabase().auth.signOut();
      }}
    >
      Cerrar sesión
    </button>
  );
}
