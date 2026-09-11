"use client";

import { InventarioForm } from "@/components/InventarioForm";
import { InventarioList } from "@/components/InventarioList";
import { EmptyState, PageTitle } from "@/components/ui";
import { useStore } from "@/components/StoreProvider";

function irAlForm() {
  document.getElementById("form-inventario")?.scrollIntoView({ behavior: "smooth", block: "center" });
}

export default function InventarioPage() {
  const { inventario, addIngrediente, updateIngrediente, removeIngrediente } = useStore();

  return (
    <>
      <PageTitle
        title="Inventario"
        subtitle='Ingredientes, precio de compra y stock. Cuando el stock actual llega al mínimo, se marca "Stock bajo".'
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {inventario.length === 0 ? (
          <EmptyState
            title="El inventario está vacío"
            hint="Cargá tus ingredientes con su unidad de compra, precio y stock. Después vas a poder costear recetas y registrar facturas contra ellos."
            actionLabel="Agregar el primer ingrediente"
            onAction={irAlForm}
          />
        ) : (
          <InventarioList
            inventario={inventario}
            onUpdate={updateIngrediente}
            onRemove={removeIngrediente}
          />
        )}
        <div id="form-inventario">
          <InventarioForm onSubmit={addIngrediente} />
        </div>
      </div>
    </>
  );
}
