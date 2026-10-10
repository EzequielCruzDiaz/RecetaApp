"use client";

import { FormularioInventario } from "@/components/FormularioInventario";
import { ListaInventario } from "@/components/ListaInventario";
import { EmptyState, PageTitle, buttonStyle } from "@/components/ui";
import { useStore } from "@/components/StoreProvider";

function irAlForm() {
  document.getElementById("form-inventario")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function InventarioPage() {
  const { inventario, addIngrediente, updateIngrediente, removeIngrediente } = useStore();

  function confirmarYQuitar(id: string) {
    const ing = inventario.find((i) => i.id === id);
    const nombre = ing?.nombre ?? "este ingrediente";
    if (confirm(`¿Quitar "${nombre}" del inventario? Esta acción no se puede deshacer.`)) {
      removeIngrediente(id);
    }
  }

  return (
    <>
      <PageTitle
        eyebrow="Almacén"
        title="Inventario"
        subtitle="Ingredientes, precio de compra y lo que hay en el almacén. Cuando algo llega a su mínimo, te avisamos para reponer."
        aside={
          inventario.length > 0 && (
            <button type="button" onClick={irAlForm} style={buttonStyle}>
              + Agregar ingrediente
            </button>
          )
        }
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {inventario.length === 0 ? (
          <EmptyState
            title="El inventario está vacío"
            hint="Carga tus ingredientes con su unidad de compra, precio y stock. Después vas a poder costear recetas y registrar facturas contra ellos."
            actionLabel="Agregar el primer ingrediente"
            onAction={irAlForm}
          />
        ) : (
          <ListaInventario
            inventario={inventario}
            onUpdate={updateIngrediente}
            onRemove={confirmarYQuitar}
          />
        )}
        <div id="form-inventario" style={{ scrollMarginTop: 90 }}>
          <FormularioInventario onSubmit={addIngrediente} />
        </div>
      </div>
    </>
  );
}
