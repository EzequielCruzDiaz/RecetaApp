"use client";

import { useEffect, useRef, useState } from "react";
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

/**
 * Input numérico controlado que no pisa lo que el usuario está escribiendo.
 *
 * El problema de `<input type="number" value={n} onChange={...Number(e.target.value)}>`:
 * como `value` siempre es un número, el campo nunca puede quedar vacío — al
 * borrar el único dígito, `Number("")` da 0, el estado vuelve a 0 y el "0"
 * reaparece solo. El usuario termina sin poder borrar el cero inicial y
 * tipeando "encima" (ej. "0231" en vez de "231").
 *
 * Acá el valor mostrado es un string local que se sincroniza con `value`
 * solo cuando cambia desde afuera (no en cada tecleo), así el campo puede
 * quedar vacío mientras se edita y recién se corrige (vuelve al último
 * válido) al perder el foco.
 */
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

  // Resincronizar durante el render (no en un efecto) cuando `value` cambia
  // desde afuera y no coincide con lo que el usuario está tecleando — patrón
  // recomendado por React para "ajustar estado cuando cambia una prop".
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
        const raw = e.target.value;
        setTexto(raw);
        if (raw === "" || raw === "-") return;
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

/**
 * Reemplazo de `<select>` nativo.
 *
 * El `<select>` nativo delega el listado de opciones al SO/navegador: no se
 * puede controlar dónde abre, su tamaño ni la transparencia del fondo. En
 * Windows/Chromium eso puede resultar en un panel gigante que tapa media
 * pantalla en vez de un desplegable chico debajo del campo. Este componente
 * es un listbox propio (botón + panel posicionado con CSS) que sí controla
 * todo eso.
 */
export function Select({
  value,
  onChange,
  options,
  placeholder,
  disabled,
  style,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
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
        style={{
          ...inputStyle,
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
            background: "rgba(255,253,248,0.97)",
            border: `1px solid ${colors.border}`,
            borderRadius: radius.sm + 2,
            boxShadow: "0 10px 28px rgba(30,42,31,0.16)",
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
                    background: opt.value === value ? `${colors.secondary}22` : "transparent",
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
