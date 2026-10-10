"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { colors, font } from "@/lib/tokens";
import { InstallButton } from "./InstallButton";
import { SignOutButton } from "./SignOutButton";
import { StoreStatus } from "./StoreStatus";
import { useStore } from "./StoreProvider";
import { CalderoIcon, Mosaico } from "./ui";

const NAV = [
  {
    href: "/",
    label: "Resumen",
    icon: <path d="M3 10L10 3l7 7M5 9v8h10V9" />,
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
    icon: <path d="M3 6.5l7-3.5 7 3.5-7 3.5-7-3.5zm0 0v7l7 3.5 7-3.5v-7M10 10v7" />,
  },
  {
    href: "/facturas",
    label: "Facturas",
    icon: <path d="M5 3h10v14l-2-1-2 1-2-1-2 1-2-1V3zM7.3 7h5.4M7.3 10h5.4M7.3 13h3.4" />,
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { origen, config } = useStore();

  return (
    <div
      className="app-shell"
      style={
        {
          background: colors.bg,
          color: colors.text,
          fontFamily: font.family,
          "--sidebar-bg": colors.sidebarBg,
          "--text-faint": colors.textFaint,
        } as React.CSSProperties
      }
    >
      <aside className="app-sidebar" style={{ background: colors.sidebarBg }}>
        <div
          className="app-sidebar-pattern"
          style={{
            position: "absolute",
            inset: "auto 0 0 0",
            height: 320,
            WebkitMaskImage: "linear-gradient(to top, #000 10%, transparent)",
            maskImage: "linear-gradient(to top, #000 10%, transparent)",
          }}
        >
          <Mosaico color={colors.mango} opacity={0.14} size={48} />
        </div>

        <div className="app-sidebar-brand">
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 14,
              background: colors.mango,
              color: colors.monte,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transform: "rotate(-4deg)",
            }}
          >
            <CalderoIcon size={23} strokeWidth={2} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontFamily: font.display,
                fontSize: 25,
                fontWeight: 600,
                color: colors.sidebarText,
                lineHeight: 1,
                letterSpacing: -0.5,
              }}
            >
              Cuadre
            </div>
            <div
              className="app-sidebar-negocio"
              style={{
                fontSize: 11.5,
                color: colors.sidebarMuted,
                marginTop: 4,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {config.nombreNegocio || "Costeo de cocina"}
            </div>
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
                aria-current={active ? "page" : undefined}
                style={{
                  fontWeight: active ? 800 : 600,
                  color: active ? colors.monte : colors.sidebarMuted,
                  background: active ? colors.mango : "transparent",
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
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
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: origen === "supabase" ? "#7FC08F" : colors.mango,
                flexShrink: 0,
              }}
            />
            {origen === "supabase" ? "Sincronizado" : "Modo local"}
          </div>
          <InstallButton />
          <SignOutButton />
        </div>
      </aside>

      <main className="app-main">
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <StoreStatus />
          {children}
        </div>
      </main>
    </div>
  );
}
