export const colors = {
  bg: "#FBF3E7",
  surface: "#FFFFFF",
  text: "#1E2A1F",
  textMuted: "#6B7A6C",
  textFaint: "#8A8878",
  border: "#EADFC7",
  // accionable / alerta — nunca decorativo (ver AGENTS.md)
  accent: "#B8471F",
  // papaya — acento decorativo (sidebar activo, hero, eyebrows)
  secondary: "#E2793A",
  positive: "#4C6B4F",
  sidebarBg: "#1E2A1F",
  sidebarText: "#FBF3E7",
  sidebarMuted: "#8A9A88",
} as const;

export const font = {
  family: "var(--font-poppins), 'Poppins', -apple-system, sans-serif",
} as const;

export const radius = { sm: 6, md: 10, lg: 14, xl: 18 } as const;

export const numeric = { fontVariantNumeric: "tabular-nums" } as const;
