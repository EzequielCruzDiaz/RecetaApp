import { colors, numeric, radius } from "@/lib/tokens";

export function formatMoney(n: number): string {
  return `RD$${n.toLocaleString("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function Money({ value, alert }: { value: number; alert?: boolean }) {
  return (
    <span style={{ ...numeric, color: alert ? colors.accent : colors.text, fontWeight: 600 }}>
      {formatMoney(value)}
    </span>
  );
}

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: radius.md,
        padding: 16,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header style={{ marginBottom: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: colors.text }}>{title}</h1>
      {subtitle && (
        <p style={{ fontSize: 14, color: colors.textMuted, margin: "6px 0 0" }}>{subtitle}</p>
      )}
    </header>
  );
}

export function EmptyState({
  title,
  hint,
  actionLabel,
  onAction,
  children,
}: {
  title: string;
  hint?: string;
  actionLabel?: string;
  onAction?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <Card
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        padding: "48px 24px",
        textAlign: "center",
        borderStyle: "dashed",
      }}
    >
      <p style={{ fontSize: 15, fontWeight: 600, margin: 0, color: colors.text }}>{title}</p>
      {hint && <p style={{ fontSize: 13, color: colors.textMuted, margin: 0, maxWidth: 380 }}>{hint}</p>}
      {actionLabel && (
        <button type="button" onClick={onAction} style={{ ...buttonStyle, marginTop: 6 }}>
          {actionLabel}
        </button>
      )}
      {children}
    </Card>
  );
}

export function Badge({ label, color }: { label: string; color?: string }) {
  const c = color ?? colors.textMuted;
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: 0.3,
        textTransform: "uppercase",
        padding: "3px 8px",
        borderRadius: 999,
        color: c,
        background: `${c}1A`,
      }}
    >
      {label}
    </span>
  );
}

const CATEGORIA_COLOR: Record<string, string> = {
  Desayuno: "#B8471F",
  Entradas: "#4C6B4F",
  Acompañantes: "#8A6A3A",
  Salsas: "#7A4E8A",
  Carnes: "#9A3B2E",
  Postres: "#B06A2E",
  Ensaladas: "#4C6B4F",
  Arroces: "#8A6A3A",
};

export function categoriaColor(categoria?: string): string {
  return (categoria && CATEGORIA_COLOR[categoria]) || colors.textMuted;
}

export const inputStyle: React.CSSProperties = {
  fontSize: 14,
  padding: "8px 10px",
  border: `1px solid ${colors.border}`,
  borderRadius: radius.sm,
  background: colors.surface,
  color: colors.text,
  fontFamily: "inherit",
  width: "100%",
};

export const buttonStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  padding: "9px 16px",
  borderRadius: radius.sm,
  border: `2px solid ${colors.accent}`,
  color: colors.accent,
  background: "transparent",
  cursor: "pointer",
  fontFamily: "inherit",
};

export const ghostButtonStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  padding: "6px 12px",
  borderRadius: radius.sm,
  border: `1px solid ${colors.border}`,
  color: colors.textMuted,
  background: colors.surface,
  cursor: "pointer",
  fontFamily: "inherit",
};
