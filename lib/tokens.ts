export const colors = {
  bg: "#F4ECDF",
  surface: "#FFFCF6",
  surfaceAlt: "#FBF5EA",
  text: "#2A1D17",
  textMuted: "#6E5F55",
  textFaint: "#9A8A7C",
  border: "#E6D8C3",
  borderStrong: "#D5C2A5",
  accent: "#B8471F",
  positive: "#3E7B4F",
  mango: "#F2B23E",
  caribe: "#1F6E86",
  monte: "#17332A",
  monteSoft: "#21443A",
  sidebarBg: "#17332A",
  sidebarText: "#F4ECDF",
  sidebarMuted: "#93A79B",
} as const;

export const font = {
  family: "var(--font-sans), 'Manrope', -apple-system, sans-serif",
  display: "var(--font-display), 'Fraunces', Georgia, serif",
  mono: "ui-monospace, 'SF Mono', Menlo, monospace",
} as const;

export const radius = { sm: 8, md: 12, lg: 16, xl: 22 } as const;

export const shadow = {
  card: "0 1px 0 rgba(42,29,23,0.04), 0 6px 18px -10px rgba(42,29,23,0.18)",
  raised: "0 2px 0 rgba(42,29,23,0.05), 0 18px 40px -18px rgba(42,29,23,0.35)",
} as const;

export const numeric = { fontVariantNumeric: "tabular-nums" } as const;
