import Link from "next/link";
import { EmptyState } from "@/components/ui";

export default function NotFound() {
  return (
    <EmptyState title="Página no encontrada" hint="La URL no corresponde a ninguna pantalla de Cuadre.">
      <Link href="/" style={{ fontSize: 13, color: "inherit" }}>
        Volver al Resumen
      </Link>
    </EmptyState>
  );
}
