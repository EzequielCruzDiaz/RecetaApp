"use client";

import { useState } from "react";
import { EscaladorReceta } from "@/components/EscaladorReceta";
import { RecetaCard } from "@/components/RecetaCard";
import { RecipeForm } from "@/components/RecipeForm";
import { EmptyState, PageTitle, ghostButtonStyle } from "@/components/ui";
import { useStore } from "@/components/StoreProvider";

function irAlForm() {
  document.getElementById("form-receta")?.scrollIntoView({ behavior: "smooth", block: "center" });
}

export default function RecetasPage() {
  const { recetas, inventario, addReceta, removeReceta } = useStore();
  const [escalarId, setEscalarId] = useState<string | null>(null);

  const escalar = recetas.find((r) => r.id === escalarId) ?? null;
  const vacio = recetas.length === 0;

  return (
    <>
      <PageTitle title="Recetas" subtitle="Costeá recetas contra el inventario y escalá la producción." />

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {vacio ? (
          <EmptyState
            title="Todavía no cargaste recetas"
            hint={
              inventario.length === 0
                ? "Primero cargá algún ingrediente en Inventario; después armá tu primera receta acá."
                : "Armá tu primera receta seleccionando ingredientes del inventario y sus cantidades."
            }
            actionLabel="Agregar la primera receta"
            onAction={irAlForm}
          />
        ) : (
          <>
            {escalar && <EscaladorReceta receta={escalar} inventario={inventario} />}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
              {recetas.map((receta) => (
                <RecetaCard
                  key={receta.id}
                  receta={receta}
                  inventario={inventario}
                  accion={
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => setEscalarId(receta.id === escalarId ? null : receta.id)}
                        style={ghostButtonStyle}
                      >
                        {receta.id === escalarId ? "Cerrar escalador" : "Escalar"}
                      </button>
                      <button type="button" onClick={() => removeReceta(receta.id)} style={ghostButtonStyle}>
                        Borrar
                      </button>
                    </div>
                  }
                />
              ))}
            </div>
          </>
        )}

        <div id="form-receta">
          <RecipeForm inventario={inventario} onGuardar={addReceta} />
        </div>
      </div>
    </>
  );
}
