"use client";

import { useState } from "react";
import type { InventoryIngredient, Receta } from "@/lib/types";
import { colors } from "@/lib/tokens";
import { RecetaCard } from "./RecetaCard";
import { Chip, ghostButtonStyle, inputStyle, secondaryButtonStyle } from "./ui";

interface ListaRecetasProps {
  recetas: Receta[];
  inventario: InventoryIngredient[];
  escalarId: string | null;
  onEscalar: (id: string) => void;
  onBorrar: (receta: Receta) => void;
}

export function ListaRecetas({ recetas, inventario, escalarId, onEscalar, onBorrar }: ListaRecetasProps) {
  const [categoria, setCategoria] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");

  const categorias = [...new Set(recetas.map((r) => r.categoria).filter((c): c is string => Boolean(c)))].sort();
  const q = busqueda.trim().toLowerCase();
  const visibles = recetas.filter(
    (r) => (!categoria || r.categoria === categoria) && (!q || r.nombre.toLowerCase().includes(q)),
  );

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar receta…"
          aria-label="Buscar receta"
          style={{ ...inputStyle, maxWidth: 360, borderRadius: 999, padding: "10px 16px" }}
        />
        {categorias.length > 1 && (
          <div className="chips">
            <Chip label="Todas" count={recetas.length} active={!categoria} onClick={() => setCategoria(null)} />
            {categorias.map((c) => (
              <Chip
                key={c}
                label={c}
                count={recetas.filter((r) => r.categoria === c).length}
                active={categoria === c}
                onClick={() => setCategoria(categoria === c ? null : c)}
              />
            ))}
          </div>
        )}
      </div>

      {visibles.length === 0 ? (
        <p style={{ fontSize: 14, color: colors.textMuted, margin: 0 }}>
          Ninguna receta coincide con el filtro.
        </p>
      ) : (
        <div className="grid-recetas">
          {visibles.map((receta) => (
            <RecetaCard
              key={receta.id}
              receta={receta}
              inventario={inventario}
              activa={receta.id === escalarId}
              accion={
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => onEscalar(receta.id)}
                    style={{ ...secondaryButtonStyle, flex: 1 }}
                  >
                    {receta.id === escalarId ? "Cerrar escalador" : "Escalar producción"}
                  </button>
                  <button
                    type="button"
                    onClick={() => onBorrar(receta)}
                    style={ghostButtonStyle}
                  >
                    Borrar
                  </button>
                </div>
              }
            />
          ))}
        </div>
      )}
    </>
  );
}
