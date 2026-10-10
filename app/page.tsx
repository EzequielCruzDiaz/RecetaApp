"use client";

import Link from "next/link";
import { Dashboard } from "@/components/Dashboard";
import { ResumenHeader } from "@/components/ResumenHeader";
import { EmptyState, buttonStyle } from "@/components/ui";
import { useStore } from "@/components/StoreProvider";

export default function ResumenPage() {
  const { recetas, inventario, facturas, config, updateNombreNegocio } = useStore();
  const sinDatos = recetas.length === 0 && inventario.length === 0;

  return (
    <>
      <ResumenHeader
        nombreNegocio={config.nombreNegocio}
        onGuardarNombre={updateNombreNegocio}
      />
      {sinDatos ? (
        <EmptyState
          title="Bienvenido a Cuadre"
          hint="Empieza cargando tu inventario de ingredientes. Con eso vas a poder costear recetas, escalar la producción y registrar facturas."
        >
          <Link href="/inventario" style={{ ...buttonStyle, display: "inline-block", textDecoration: "none", marginTop: 8 }}>
            Cargar inventario
          </Link>
        </EmptyState>
      ) : (
        <Dashboard recetas={recetas} inventario={inventario} facturas={facturas} />
      )}
    </>
  );
}
