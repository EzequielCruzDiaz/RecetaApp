"use client";

import { useEffect, useState } from "react";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { getSupabase } from "@/lib/supabase/client";
import { colors, font, radius, shadow } from "@/lib/tokens";
import { CalderoIcon, Mosaico, buttonStyle, inputStyle, labelStyle } from "./ui";

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
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        background: colors.monte,
        fontFamily: font.family,
        padding: 24,
      }}
    >
      <Mosaico color={colors.mango} opacity={0.1} size={56} />
      <form
        onSubmit={entrar}
        style={{
          width: "100%",
          maxWidth: 360,
          position: "relative",
          background: colors.surface,
          borderTop: `5px solid ${colors.mango}`,
          borderRadius: radius.xl,
          boxShadow: shadow.raised,
          padding: 28,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <div>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 15,
              background: colors.monte,
              color: colors.mango,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 14,
              transform: "rotate(-4deg)",
            }}
          >
            <CalderoIcon size={25} strokeWidth={2} />
          </div>
          <h1 style={{ fontFamily: font.display, fontSize: 30, fontWeight: 600, letterSpacing: -0.6, margin: 0, color: colors.text }}>
            Cuadre
          </h1>
          <p style={{ fontSize: 14, color: colors.textMuted, margin: "4px 0 0" }}>
            Entra con tu cuenta para ver tu cocina.
          </p>
        </div>

        <label style={labelStyle}>
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

        <label style={labelStyle}>
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
