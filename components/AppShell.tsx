"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { colors, font } from "@/lib/tokens";
import { InstallButton } from "./InstallButton";
import { SignOutButton } from "./SignOutButton";
import { StoreStatus } from "./StoreStatus";
import { useStore } from "./StoreProvider";

const NAV_INACTIVE = "#C9CFC4";

const NAV = [
  {
    href: "/",
    label: "Resumen",
    icon: (
      <path d="M3 10L10 3l7 7M5 9v8h10V9" />
    ),
  },
  {
    href: "/recetas",
    label: "Recetas",
    icon: (
      <path d="M10 5.5c-1.3-1-3.4-1.5-6-1.5v11c2.6 0 4.7.5 6 1.5m0-11c1.3-1 3.4-1.5 6-1.5v11c-2.6 0-4.7.5-6 1.5" />
    ),
  },
  {
    href: "/inventario",
    label: "Inventario",
    icon: (
      <path d="M3 6.5l7-3.5 7 3.5-7 3.5-7-3.5zm0 0v7l7 3.5 7-3.5v-7M10 10v7" />
    ),
  },
  {
    href: "/facturas",
    label: "Facturas",
    icon: (
      <path d="M5 3h10v14l-2-1-2 1-2-1-2 1-2-1V3zM7.3 7h5.4M7.3 10h5.4M7.3 13h3.4" />
    ),
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { origen } = useStore();

  return (
    <div
      className="app-shell"
      style={
        {
          background: colors.bg,
          color: colors.text,
          fontFamily: font.family,
          "--sidebar-bg": colors.sidebarBg,
        } as React.CSSProperties
      }
    >
      <aside className="app-sidebar" style={{ background: colors.sidebarBg }}>
        <div
          className="app-sidebar-blob"
          style={{
            position: "absolute",
            top: -60,
            right: -60,
            width: 180,
            height: 180,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${colors.secondary}55, transparent 70%)`,
            pointerEvents: "none",
          }}
        />

        <div className="app-sidebar-brand">
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 11,
              background: colors.secondary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg
              width="21"
              height="21"
              viewBox="0 0 24 24"
              fill="none"
              stroke={colors.sidebarBg}
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 10h16" />
              <path d="M5.6 10l1 8.1A2 2 0 0 0 8.6 20h6.8a2 2 0 0 0 2-1.9l1-8.1" />
              <path d="M4 10.2 2.5 8.7M20 10.2l1.5-1.5" />
              <path d="M10.5 4.3c0 1-1 1-1 2s1 1 1 2M14 3.8c0 1-1 1-1 2s1 1 1 2" />
            </svg>
          </div>
          <div style={{ fontFamily: font.family, fontSize: 19, fontWeight: 700, color: colors.sidebarText, lineHeight: 1 }}>
            Cuadre
          </div>
        </div>

        <nav className="app-nav">
          {NAV.map((n) => {
            const active = n.href === "/" ? path === "/" : path.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className="app-nav-link"
                style={{
                  fontWeight: active ? 700 : 500,
                  color: active ? colors.sidebarBg : NAV_INACTIVE,
                  background: active ? colors.secondary : "transparent",
                }}
              >
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {n.icon}
                </svg>
                <span className="app-nav-label">{n.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="app-sidebar-footer">
          <div className="app-sidebar-status" style={{ color: colors.sidebarMuted }}>
            {origen === "supabase" ? "Conectado a Supabase" : "Modo local · sin conexión"}
          </div>
          <InstallButton />
          <SignOutButton />
        </div>
      </aside>

      <main className="app-main">
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <StoreStatus />
          {children}
        </div>
      </main>
    </div>
  );
}
