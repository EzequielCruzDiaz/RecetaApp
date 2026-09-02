"use client";

import { useState } from "react";
import { ConfirmarFactura } from "@/components/ConfirmarFactura";
import { EscanearFactura } from "@/components/EscanearFactura";
import { Card, Money, PageTitle } from "@/components/ui";
import { colors, numeric } from "@/lib/tokens";
import type { CamposFacturaOCR } from "@/lib/factura-ocr";
import { useStore } from "@/components/StoreProvider";

export default function FacturasPage() {
  const { facturas, inventario, addFactura } = useStore();
  const [preset, setPreset] = useState<CamposFacturaOCR | undefined>();
  const [formKey, setFormKey] = useState(0);

  return (
    <>
      <PageTitle
        title="Facturas"
        subtitle="Escaneá o cargá compras a proveedores. Al confirmar, los ítems vinculados suman al stock."
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
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
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted }}>Registradas</span>
            {facturas.map((f) => (
              <Card key={f.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: colors.text }}>{f.proveedor}</div>
                  <div style={{ fontSize: 12, color: colors.textMuted }}>
                    {f.fecha}
                    {f.ncf ? ` · NCF ${f.ncf}` : ""} · {f.items.length}{" "}
                    {f.items.length === 1 ? "ítem" : "ítems"}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={numeric}>
                    <Money value={f.total} />
                  </div>
                  <div style={{ fontSize: 11, color: colors.positive }}>Aplicada al inventario</div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
