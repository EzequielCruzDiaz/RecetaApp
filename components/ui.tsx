import { colors, font, numeric, radius } from "@/lib/tokens";

export function formatMoney(n: number): string {
  return `RD$${n.toLocaleString("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function Money({ value, alert }: { value: number; alert?: boolean }) {
  return (
    <span style={{ ...numeric, color: alert ? colors.accent : colors.text, fontWeight: 700 }}>
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
        borderRadius: radius.lg,
        padding: 18,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header style={{ marginBottom: 26 }}>
      <h1 style={{ fontFamily: font.family, fontSize: 26, fontWeight: 700, margin: 0, color: colors.text }}>
        {title}
      </h1>
      {subtitle && (
        <p style={{ fontSize: 14, color: colors.textMuted, margin: "8px 0 0" }}>{subtitle}</p>
      )}
    </header>
  );
}

export function Eyebrow({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <div
      style={{
        fontSize: 11.5,
        fontWeight: 700,
        letterSpacing: 0.5,
        textTransform: "uppercase",
        color: color ?? colors.secondary,
        marginBottom: 8,
      }}
    >
      {children}
    </div>
  );
}

export function InitialChip({
  label,
  color,
  size = 34,
}: {
  label: string;
  color: string;
  size?: number;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.28),
        flexShrink: 0,
        background: `${color}22`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: font.family,
        fontWeight: 700,
        color,
        fontSize: Math.round(size * 0.38),
      }}
    >
      {label}
    </div>
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
        borderColor: "#D8C7A8",
        background: "#FFFDF8",
      }}
    >
      <p style={{ fontFamily: font.family, fontSize: 15, fontWeight: 600, margin: 0, color: colors.text }}>
        {title}
      </p>
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
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 0.3,
        textTransform: "uppercase",
        padding: "3px 9px",
        borderRadius: 999,
        color: c,
        background: `${c}1A`,
        whiteSpace: "nowrap",
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
  fontSize: 13.5,
  padding: "9px 11px",
  border: `1px solid ${colors.border}`,
  borderRadius: radius.sm + 2,
  background: colors.surface,
  color: colors.text,
  fontFamily: "inherit",
  width: "100%",
};

export const buttonStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  padding: "10px 18px",
  borderRadius: radius.sm + 3,
  border: "none",
  color: "#FFFFFF",
  background: colors.accent,
  cursor: "pointer",
  fontFamily: "inherit",
};

export const ghostButtonStyle: React.CSSProperties = {
  fontSize: 12.5,
  fontWeight: 600,
  padding: "6px 12px",
  borderRadius: radius.sm + 1,
  border: `1px solid ${colors.border}`,
  color: colors.textMuted,
  background: colors.bg,
  cursor: "pointer",
  fontFamily: "inherit",
};
