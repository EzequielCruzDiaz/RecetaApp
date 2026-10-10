"use client";

import { useEffect, useId, useRef, useState } from "react";
import { colors, font, numeric, radius, shadow } from "@/lib/tokens";
import { formatMoney } from "@/lib/format";

export { formatMoney };

const SINGULARES: Record<string, string> = {
  porciones: "porción",
  unidades: "unidad",
  raciones: "ración",
  libras: "libra",
};

export function unidadSingular(unidad: string): string {
  const u = unidad.trim();
  return SINGULARES[u.toLowerCase()] ?? u.replace(/s$/, "");
}

export function Money({ value, alert, size }: { value: number; alert?: boolean; size?: number }) {
  return (
    <span
      style={{
        ...numeric,
        color: alert ? colors.accent : "inherit",
        fontWeight: 700,
        fontSize: size,
        whiteSpace: "nowrap",
      }}
    >
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
        boxShadow: shadow.card,
        padding: 20,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function PageTitle({
  eyebrow,
  title,
  subtitle,
  aside,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  aside?: React.ReactNode;
}) {
  return (
    <header className="page-title">
      <div style={{ minWidth: 0 }}>
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h1
          style={{
            fontFamily: font.display,
            fontSize: 38,
            fontWeight: 600,
            letterSpacing: -0.8,
            lineHeight: 1.05,
            margin: 0,
            color: colors.text,
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: 14.5, color: colors.textMuted, margin: "10px 0 0", maxWidth: 560, lineHeight: 1.5 }}>
            {subtitle}
          </p>
        )}
      </div>
      {aside}
    </header>
  );
}

export function Eyebrow({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: 1.4,
        textTransform: "uppercase",
        color: color ?? colors.textMuted,
        marginBottom: 10,
      }}
    >
      <span style={{ width: 18, height: 2, borderRadius: 2, background: colors.mango }} />
      {children}
    </div>
  );
}

export function SectionTitle({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
      <h2 style={{ fontFamily: font.display, fontSize: 21, fontWeight: 600, margin: 0, color: colors.text, letterSpacing: -0.3 }}>
        {children}
      </h2>
      {action}
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
        borderRadius: Math.round(size * 0.32),
        flexShrink: 0,
        background: `${color}1F`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: font.display,
        fontWeight: 700,
        color,
        fontSize: Math.round(size * 0.45),
      }}
    >
      {label}
    </div>
  );
}

export function Mosaico({
  color,
  opacity = 1,
  size = 44,
  style,
}: {
  color: string;
  opacity?: number;
  size?: number;
  style?: React.CSSProperties;
}) {
  const id = useId().replace(/:/g, "");
  const s = size;
  const h = s / 2;
  const q = s / 4;
  return (
    <svg
      aria-hidden
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", opacity, ...style }}
    >
      <defs>
        <pattern id={`mosaico-${id}`} width={s} height={s} patternUnits="userSpaceOnUse">
          <g fill="none" stroke={color} strokeWidth={1.2}>
            <path d={`M${h} 0 Q${h + q} ${q} ${h} ${h} Q${h - q} ${q} ${h} 0Z`} />
            <path d={`M${h} ${s} Q${h + q} ${s - q} ${h} ${h} Q${h - q} ${s - q} ${h} ${s}Z`} />
            <path d={`M0 ${h} Q${q} ${h - q} ${h} ${h} Q${q} ${h + q} 0 ${h}Z`} />
            <path d={`M${s} ${h} Q${s - q} ${h - q} ${h} ${h} Q${s - q} ${h + q} ${s} ${h}Z`} />
            <circle cx={0} cy={0} r={q * 0.7} />
            <circle cx={s} cy={0} r={q * 0.7} />
            <circle cx={0} cy={s} r={q * 0.7} />
            <circle cx={s} cy={s} r={q * 0.7} />
          </g>
          <rect x={h - 2.5} y={h - 2.5} width={5} height={5} fill={color} transform={`rotate(45 ${h} ${h})`} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#mosaico-${id})`} />
    </svg>
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
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        padding: "56px 24px",
        textAlign: "center",
        borderRadius: radius.xl,
        border: `1.5px dashed ${colors.borderStrong}`,
        background: colors.surfaceAlt,
      }}
    >
      <Mosaico color={colors.borderStrong} opacity={0.35} />
      <div
        style={{
          position: "relative",
          width: 56,
          height: 56,
          borderRadius: 18,
          background: colors.monte,
          color: colors.mango,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 4,
        }}
      >
        <CalderoIcon size={28} />
      </div>
      <p style={{ position: "relative", fontFamily: font.display, fontSize: 22, fontWeight: 600, margin: 0, color: colors.text }}>
        {title}
      </p>
      {hint && (
        <p style={{ position: "relative", fontSize: 14, color: colors.textMuted, margin: 0, maxWidth: 420, lineHeight: 1.5 }}>
          {hint}
        </p>
      )}
      {actionLabel && (
        <button type="button" onClick={onAction} style={{ ...buttonStyle, position: "relative", marginTop: 8 }}>
          {actionLabel}
        </button>
      )}
      {children && <div style={{ position: "relative" }}>{children}</div>}
    </div>
  );
}

export function CalderoIcon({ size = 22, strokeWidth = 1.8 }: { size?: number; strokeWidth?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3.5 10.5h17" />
      <path d="M5 10.5l1 7.6A2.2 2.2 0 0 0 8.2 20h7.6a2.2 2.2 0 0 0 2.2-1.9l1-7.6" />
      <path d="M3.5 10.5 2 12.5M20.5 10.5l1.5 2" />
      <path d="M9.5 3.5c0 1.1-1 1.1-1 2.2s1 1.1 1 2.2M14.5 3.5c0 1.1-1 1.1-1 2.2s1 1.1 1 2.2" />
    </svg>
  );
}

export function Badge({ label, color }: { label: string; color?: string }) {
  const c = color ?? colors.textMuted;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontSize: 10.5,
        fontWeight: 800,
        letterSpacing: 0.6,
        textTransform: "uppercase",
        padding: "4px 9px",
        borderRadius: 999,
        color: c,
        background: `${c}17`,
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: c }} />
      {label}
    </span>
  );
}

export function Chip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count?: number;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 13,
        fontWeight: 700,
        padding: "7px 13px",
        borderRadius: 999,
        border: `1px solid ${active ? colors.monte : colors.border}`,
        background: active ? colors.monte : colors.surface,
        color: active ? colors.sidebarText : colors.textMuted,
        cursor: "pointer",
        fontFamily: "inherit",
        whiteSpace: "nowrap",
      }}
    >
      {label}
      {count !== undefined && (
        <span style={{ ...numeric, fontSize: 11.5, opacity: 0.7 }}>{count}</span>
      )}
    </button>
  );
}

export function StockMeter({ stock, minimo }: { stock: number; minimo: number }) {
  const tope = Math.max(minimo * 2.5, stock, 1);
  const pct = Math.min(100, (stock / tope) * 100);
  const marca = Math.min(100, (minimo / tope) * 100);
  const bajo = stock <= minimo;
  return (
    <div style={{ position: "relative", height: 8, borderRadius: 99, background: `${colors.text}0F` }}>
      <div
        style={{
          position: "absolute",
          inset: "0 auto 0 0",
          width: `${pct}%`,
          borderRadius: 99,
          background: bajo ? colors.accent : colors.positive,
        }}
      />
      <div
        title={`Mínimo: ${minimo}`}
        style={{
          position: "absolute",
          top: -3,
          bottom: -3,
          left: `calc(${marca}% - 1px)`,
          width: 2,
          borderRadius: 2,
          background: colors.text,
          opacity: 0.55,
        }}
      />
    </div>
  );
}

const CATEGORIA_COLOR: Record<string, string> = {
  Desayuno: "#C7861A",
  Entradas: "#3E7B4F",
  Acompañantes: "#8A6A3A",
  Salsas: "#7A4E8A",
  Carnes: "#9A3B2E",
  Postres: "#B5577A",
  Ensaladas: "#3E7B4F",
  Arroces: "#1F6E86",
  Sopas: "#A0612A",
  Bebidas: "#2F7F7A",
};

const PALETA_EXTRA = ["#1F6E86", "#8A6A3A", "#7A4E8A", "#3E7B4F", "#A0612A", "#2F7F7A"];

export function categoriaColor(categoria?: string): string {
  if (!categoria) return colors.textMuted;
  if (CATEGORIA_COLOR[categoria]) return CATEGORIA_COLOR[categoria];
  let h = 0;
  for (const ch of categoria) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETA_EXTRA[h % PALETA_EXTRA.length];
}

export const labelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  fontSize: 12,
  fontWeight: 700,
  color: colors.textMuted,
};

export const inputStyle: React.CSSProperties = {
  fontSize: 14,
  padding: "10px 12px",
  // Por separado: los campos con error o leídos de una foto cambian solo el
  // color, y React se queja si se mezcla `border` con `borderColor`.
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: colors.border,
  borderRadius: radius.sm + 2,
  background: colors.surface,
  color: colors.text,
  fontFamily: "inherit",
  fontWeight: 500,
  width: "100%",
};

/** Borde de alerta para un campo con error. */
export function conError(style: React.CSSProperties, error?: string): React.CSSProperties {
  return error ? { ...style, borderColor: colors.accent, boxShadow: `0 0 0 3px ${colors.accent}1A` } : style;
}

/** Mensaje corto debajo de un campo que no se puede guardar así. */
export function MensajeCampo({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <span
      role="alert"
      style={{ fontSize: 11.5, fontWeight: 600, color: colors.accent, lineHeight: 1.35, textTransform: "none", letterSpacing: 0 }}
    >
      {children}
    </span>
  );
}

export const buttonStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 800,
  padding: "11px 20px",
  borderRadius: 999,
  border: "none",
  color: "#FFFFFF",
  background: colors.accent,
  boxShadow: `0 6px 16px -8px ${colors.accent}`,
  cursor: "pointer",
  fontFamily: "inherit",
};

export const secondaryButtonStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 800,
  padding: "8px 14px",
  borderRadius: 999,
  border: `1.5px solid ${colors.accent}`,
  color: colors.accent,
  background: "transparent",
  cursor: "pointer",
  fontFamily: "inherit",
};

export const ghostButtonStyle: React.CSSProperties = {
  fontSize: 12.5,
  fontWeight: 700,
  padding: "7px 12px",
  borderRadius: 999,
  border: `1px solid ${colors.border}`,
  color: colors.textMuted,
  background: "transparent",
  cursor: "pointer",
  fontFamily: "inherit",
};

export const formPanelStyle: React.CSSProperties = {
  position: "relative",
  background: colors.surface,
  border: `1px solid ${colors.border}`,
  borderTop: `4px solid ${colors.monte}`,
  borderRadius: radius.xl,
  boxShadow: shadow.card,
  padding: 24,
  display: "flex",
  flexDirection: "column",
  gap: 16,
};

export function FormHeader({ title, hint, step }: { title: string; hint?: string; step?: string }) {
  return (
    <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
      {step && (
        <span
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: colors.mango,
            color: colors.monte,
            fontFamily: font.display,
            fontWeight: 700,
            fontSize: 17,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {step}
        </span>
      )}
      <div>
        <h3 style={{ fontFamily: font.display, fontSize: 21, fontWeight: 600, margin: 0, color: colors.text, letterSpacing: -0.3 }}>
          {title}
        </h3>
        {hint && <p style={{ fontSize: 13, color: colors.textMuted, margin: "5px 0 0", lineHeight: 1.5 }}>{hint}</p>}
      </div>
    </div>
  );
}

function limpiarNumero(raw: string): string {
  const soloDigitosYPunto = raw.replace(/[^0-9.]/g, "");
  const i = soloDigitosYPunto.indexOf(".");
  if (i === -1) return soloDigitosYPunto;
  return soloDigitosYPunto.slice(0, i + 1) + soloDigitosYPunto.slice(i + 1).replace(/\./g, "");
}

export function NumberInput({
  value,
  onChange,
  style,
  ...rest
}: {
  value: number;
  onChange: (value: number) => void;
  style?: React.CSSProperties;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type" | "style">) {
  const [texto, setTexto] = useState(String(value));
  const [valorPrevio, setValorPrevio] = useState(value);

  if (value !== valorPrevio) {
    setValorPrevio(value);
    if (Number(texto) !== value) setTexto(String(value));
  }

  return (
    <input
      {...rest}
      type="number"
      inputMode="decimal"
      value={texto}
      onFocus={(e) => {
        e.currentTarget.select();
        rest.onFocus?.(e);
      }}
      onChange={(e) => {
        const raw = limpiarNumero(e.target.value);
        setTexto(raw);
        if (raw === "" || raw === ".") return;
        const n = Number(raw);
        if (!Number.isNaN(n)) onChange(n);
      }}
      onBlur={(e) => {
        if (texto.trim() === "" || Number.isNaN(Number(texto))) setTexto(String(value));
        rest.onBlur?.(e);
      }}
      style={style}
    />
  );
}

export interface SelectOption {
  value: string;
  label: string;
  group?: string;
}

export function Select({
  value,
  onChange,
  options,
  placeholder,
  disabled,
  style,
  error,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
  /** Si viene, el botón se marca como inválido. */
  error?: string;
  ariaLabel?: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    function onFuera(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false);
    }
    function onTecla(e: KeyboardEvent) {
      if (e.key === "Escape") setAbierto(false);
    }
    document.addEventListener("mousedown", onFuera);
    document.addEventListener("keydown", onTecla);
    return () => {
      document.removeEventListener("mousedown", onFuera);
      document.removeEventListener("keydown", onTecla);
    };
  }, [abierto]);

  const actual = options.find((o) => o.value === value);

  const grupos: { nombre: string | null; items: SelectOption[] }[] = [];
  for (const opt of options) {
    const clave = opt.group ?? null;
    let g = grupos.find((g) => g.nombre === clave);
    if (!g) {
      g = { nombre: clave, items: [] };
      grupos.push(g);
    }
    g.items.push(opt);
  }

  return (
    <div ref={ref} style={{ position: "relative", ...style }}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setAbierto((a) => !a)}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        data-invalido={error ? "true" : undefined}
        aria-label={ariaLabel}
        style={{
          ...conError(inputStyle, error),
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 6,
          cursor: disabled ? "default" : "pointer",
          opacity: disabled ? 0.6 : 1,
          color: actual ? colors.text : colors.textFaint,
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {actual?.label ?? placeholder ?? ""}
        </span>
        <span style={{ fontSize: 10, color: colors.textFaint, flexShrink: 0 }}>▾</span>
      </button>

      {abierto && (
        <div
          role="listbox"
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            maxHeight: 240,
            overflowY: "auto",
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.sm + 2,
            boxShadow: "0 10px 28px rgba(42,29,23,0.18)",
            padding: 4,
            zIndex: 40,
          }}
        >
          {grupos.map((g, gi) => (
            <div key={gi}>
              {g.nombre && (
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: 0.3,
                    textTransform: "uppercase",
                    color: colors.textFaint,
                    padding: "6px 8px 2px",
                  }}
                >
                  {g.nombre}
                </div>
              )}
              {g.items.map((opt) => (
                <div
                  key={opt.value}
                  role="option"
                  aria-selected={opt.value === value}
                  onClick={() => {
                    onChange(opt.value);
                    setAbierto(false);
                  }}
                  style={{
                    padding: "7px 8px",
                    borderRadius: radius.sm,
                    fontSize: 13,
                    cursor: "pointer",
                    color: colors.text,
                    background: opt.value === value ? `${colors.mango}33` : "transparent",
                  }}
                >
                  {opt.label}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
