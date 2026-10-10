"use client";

import Link from "next/link";
import { PanelResumen } from "@/components/PanelResumen";
import { EncabezadoResumen } from "@/components/EncabezadoResumen";
import { EmptyState, buttonStyle } from "@/components/ui";
import { useStore } from "@/components/StoreProvider";

export default function ResumenPage() {
  const { recetas, inventario, facturas, config, updateNombreNegocio } = useStore();
  const sinDatos = recetas.length === 0 && inventario.length === 0;

  return (
    <>
      <EncabezadoResumen
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
        <PanelResumen recetas={recetas} inventario={inventario} facturas={facturas} />
      )}
    </>
  );
}
