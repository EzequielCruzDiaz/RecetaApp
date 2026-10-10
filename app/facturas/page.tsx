"use client";

import { useState } from "react";
import { ConfirmarFactura } from "@/components/ConfirmarFactura";
import { EscanearFactura } from "@/components/EscanearFactura";
import { Card, Eyebrow, Money, PageTitle, ghostButtonStyle } from "@/components/ui";
import { colors, numeric } from "@/lib/tokens";
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
        title="Facturas"
        subtitle="Escaneá o cargá compras a proveedores. Al confirmar, los ítems vinculados suman al stock."
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <Eyebrow>Paso 1 · Escanear (opcional)</Eyebrow>
          <EscanearFactura
            onDetectado={(campos) => {
              setPreset(campos);
              setFormKey((k) => k + 1);
            }}
          />
        </div>

        <div>
          <Eyebrow>Paso 2 · Confirmar y aplicar al inventario</Eyebrow>
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
        </div>

        {facturas.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted }}>Registradas</span>
            {facturas.map((f) => {
              const vinculados = f.items.filter((it) => it.ingredientId).length;
              return (
                <Card key={f.id} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: colors.text }}>{f.proveedor}</div>
                      <div style={{ fontSize: 12, color: colors.textMuted }}>
                        {f.fecha}
                        {f.ncf ? ` · NCF ${f.ncf}` : ""}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={numeric}>
                        <Money value={f.total} />
                      </div>
                      {vinculados > 0 ? (
                        <div style={{ fontSize: 11, color: colors.positive }}>
                          {vinculados === f.items.length
                            ? "Aplicada al inventario"
                            : `${vinculados}/${f.items.length} ítems aplicados al inventario`}
                        </div>
                      ) : (
                        <div style={{ fontSize: 11, color: colors.accent }}>Sin ítems vinculados — no tocó el stock</div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
                    {f.items.map((it, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: 11,
                          padding: "3px 9px",
                          borderRadius: 999,
                          background: it.ingredientId ? `${colors.positive}1A` : `${colors.textFaint}1A`,
                          color: it.ingredientId ? colors.positive : colors.textMuted,
                        }}
                        title={it.ingredientId ? "Sumó al stock" : "No vinculado — no sumó al stock"}
                      >
                        {it.nombre}
                        {it.cantidad ? ` · ${it.cantidad}${it.unidad ? ` ${it.unidad}` : ""}` : ""}
                      </span>
                    ))}
                    <button
                      type="button"
                      onClick={() => confirmarYBorrar(f)}
                      style={{ ...ghostButtonStyle, marginLeft: "auto", padding: "4px 10px", fontSize: 11 }}
                    >
                      Borrar
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
