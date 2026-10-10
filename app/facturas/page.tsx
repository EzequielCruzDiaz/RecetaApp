"use client";

import { useState } from "react";
import { ConfirmarFactura } from "@/components/ConfirmarFactura";
import { EscanearFactura } from "@/components/EscanearFactura";
import { ReciboFactura } from "@/components/ReciboFactura";
import { PageTitle, SectionTitle } from "@/components/ui";
import type { CamposFacturaOCR } from "@/lib/factura-ocr";
import type { Factura } from "@/lib/types";
import { useStore } from "@/components/StoreProvider";

export default function FacturasPage() {
  const { facturas, inventario, addFactura, removeFactura } = useStore();
  const [preset, setPreset] = useState<CamposFacturaOCR | undefined>();
  const [formKey, setFormKey] = useState(0);

  function confirmarYBorrar(f: Factura) {
    const vinculados = f.items.some((it) => it.ingredientId);
    const mensaje = vinculados
      ? `¿Borrar la factura de "${f.proveedor}"? También se revierte el stock que sumó.`
      : `¿Borrar la factura de "${f.proveedor}"?`;
    if (confirm(mensaje)) removeFactura(f.id);
  }

  return (
    <>
      <PageTitle
        eyebrow="Compras"
        title="Facturas"
        subtitle="Escanea o carga las compras a tus suplidores. Al confirmar, los ítems vinculados suman al stock."
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        <EscanearFactura
          onDetectado={(campos) => {
            setPreset(campos);
            setFormKey((k) => k + 1);
          }}
        />

        <ConfirmarFactura
          key={formKey}
          inventario={inventario}
          preset={preset}
          onConfirmar={(f) => {
            addFactura(f);
            setPreset(undefined);
            setFormKey((k) => k + 1);
          }}
        />

        {facturas.length > 0 && (
          <section style={{ marginTop: 12 }}>
            <SectionTitle>Registradas</SectionTitle>
            <div className="grid-recibos">
              {facturas.map((f) => (
                <ReciboFactura key={f.id} factura={f} onBorrar={() => confirmarYBorrar(f)} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
