"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { colors, font, radius } from "../lib/tokens";

const NAV = [
  { href: "/", label: "Resumen" },
  { href: "/recetas", label: "Recetas" },
  { href: "/inventario", label: "Inventario" },
  { href: "/facturas", label: "Facturas" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: colors.bg,
        color: colors.text,
        fontFamily: font.family,
      }}
    >
      <aside
        style={{
          width: 220,
          flexShrink: 0,
          borderRight: `1px solid ${colors.border}`,
          background: colors.surface,
          padding: "24px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 4,
          position: "sticky",
          top: 0,
          height: "100vh",
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 700, padding: "0 12px 20px" }}>RecetApp</div>
        {NAV.map((n) => {
          const active = n.href === "/" ? path === "/" : path.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              style={{
                padding: "10px 12px",
                borderRadius: radius.sm,
                fontSize: 14,
                fontWeight: active ? 600 : 500,
                textDecoration: "none",
                color: active ? colors.surface : colors.textMuted,
                background: active ? colors.text : "transparent",
              }}
            >
              {n.label}
            </Link>
          );
        })}
      </aside>

      <main style={{ flex: 1, minWidth: 0, padding: "32px 40px" }}>
        <div style={{ maxWidth: 1040, margin: "0 auto" }}>{children}</div>
      </main>
    </div>
  );
}
