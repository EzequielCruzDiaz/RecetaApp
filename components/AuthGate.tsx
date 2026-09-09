"use client";

import { useEffect, useState } from "react";
import { supabaseConfigurado } from "../lib/supabase/config";
import { getSupabase } from "../lib/supabase/client";
import { colors, font, radius } from "../lib/tokens";
import { buttonStyle, inputStyle } from "./ui";

export function AuthGate({ children }: { children: React.ReactNode }) {
  if (!supabaseConfigurado) return <>{children}</>;
  return <Gate>{children}</Gate>;
}

function Gate({ children }: { children: React.ReactNode }) {
  const [estado, setEstado] = useState<"cargando" | "fuera" | "dentro">("cargando");

  useEffect(() => {
    let activo = true;
    const sb = getSupabase();

    sb.auth.getSession().then(({ data }) => {
      if (activo) setEstado(data.session ? "dentro" : "fuera");
    });

    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      if (activo) setEstado(session ? "dentro" : "fuera");
    });

    return () => {
      activo = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (estado === "cargando") return null;
  if (estado === "dentro") return <>{children}</>;
  return <LoginForm />;
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    const { error } = await getSupabase().auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setEnviando(false);
    }
    // Si funciona, onAuthStateChange en <Gate> cambia el estado a "dentro".
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: colors.bg,
        fontFamily: font.family,
        padding: 24,
      }}
    >
      <form
        onSubmit={entrar}
        style={{
          width: "100%",
          maxWidth: 340,
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: radius.md,
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: colors.text }}>RecetApp</h1>
          <p style={{ fontSize: 13, color: colors.textMuted, margin: "4px 0 0" }}>
            Ingresá con tu cuenta.
          </p>
        </div>

        <label style={{ fontSize: 12, color: colors.textMuted }}>
          Email
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={inputStyle}
          />
        </label>

        <label style={{ fontSize: 12, color: colors.textMuted }}>
          Contraseña
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={inputStyle}
          />
        </label>

        {error && (
          <p style={{ fontSize: 12, color: colors.accent, margin: 0 }}>{error}</p>
        )}

        <button type="submit" disabled={enviando} style={{ ...buttonStyle, opacity: enviando ? 0.6 : 1 }}>
          {enviando ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
