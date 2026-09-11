"use client";

import Link from "next/link";
import { Dashboard } from "@/components/Dashboard";
import { ResumenHeader } from "@/components/ResumenHeader";
import { EmptyState } from "@/components/ui";
import { useStore } from "@/components/StoreProvider";

export default function ResumenPage() {
  const { recetas, inventario, config, updateNombreNegocio } = useStore();
  const sinDatos = recetas.length === 0 && inventario.length === 0;

  return (
    <>
      <ResumenHeader nombreNegocio={config.nombreNegocio} onGuardarNombre={updateNombreNegocio} />
      {sinDatos ? (
        <EmptyState
          title="Bienvenido a RecetApp"
          hint="Empezá cargando tu inventario de ingredientes. Con eso vas a poder costear recetas, escalar producción y registrar facturas."
        >
          <Link href="/inventario" style={{ fontSize: 13, color: "inherit" }}>
            Ir a Inventario →
          </Link>
        </EmptyState>
      ) : (
        <Dashboard recetas={recetas} inventario={inventario} />
      )}
    </>
  );
}
