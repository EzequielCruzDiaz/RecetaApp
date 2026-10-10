import { colors } from "@/lib/tokens";

export default function Loading() {
  return (
    <div style={{ padding: "48px 0", textAlign: "center", fontSize: 13, color: colors.textMuted }}>
      Cargando…
    </div>
  );
}
