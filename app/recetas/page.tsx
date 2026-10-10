"use client";

import { useState } from "react";
import { EscaladorReceta } from "@/components/EscaladorReceta";
import { ListaRecetas } from "@/components/ListaRecetas";
import { RecetaEditor } from "@/components/RecetaEditor";
import { EmptyState, PageTitle, buttonStyle } from "@/components/ui";
import { useStore } from "@/components/StoreProvider";

function irA(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function RecetasPage() {
  const { recetas, inventario, addReceta, removeReceta } = useStore();
  const [escalarId, setEscalarId] = useState<string | null>(null);

  const escalar = recetas.find((r) => r.id === escalarId) ?? null;
  const vacio = recetas.length === 0;


  function confirmarYBorrar(nombre: string, id: string) {
    if (confirm(`¿Borrar la receta "${nombre}"? Esta acción no se puede deshacer.`)) {
      removeReceta(id);
      if (id === escalarId) setEscalarId(null);
    }
  }

  function abrirEscalador(id: string) {
    const cerrar = id === escalarId;
    setEscalarId(cerrar ? null : id);
    if (!cerrar) requestAnimationFrame(() => irA("escalador"));
  }

  return (
    <>
      <PageTitle
        eyebrow="Recetario"
        title="Recetas"
        subtitle="Costea cada plato contra tu inventario y escala la producción a lo que vas a vender hoy."
        aside={
          !vacio && (
            <button type="button" onClick={() => irA("form-receta")} style={buttonStyle}>
              + Nueva receta
            </button>
          )
        }
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
        {vacio ? (
          <EmptyState
            title="Tu recetario está vacío"
            hint={
              inventario.length === 0
                ? "Primero carga algún ingrediente en Inventario; después arma tu primera receta aquí."
                : "Arma tu primera receta eligiendo ingredientes del inventario y sus cantidades."
            }
            actionLabel="Agregar la primera receta"
            onAction={() => irA("form-receta")}
          />
        ) : (
          <>
            {escalar && (
              <div id="escalador" style={{ scrollMarginTop: 90 }}>
                <EscaladorReceta
                  key={escalar.id}
                  receta={escalar}
                  inventario={inventario}
                  onCerrar={() => setEscalarId(null)}
                />
              </div>
            )}

            <ListaRecetas
              recetas={recetas}
              inventario={inventario}
              escalarId={escalarId}
              onEscalar={abrirEscalador}
              onBorrar={(r) => confirmarYBorrar(r.nombre, r.id)}
            />
          </>
        )}

        <div id="form-receta" style={{ scrollMarginTop: 90 }}>
          <RecetaEditor inventario={inventario} onGuardar={addReceta} />
        </div>
      </div>
    </>
  );
}
