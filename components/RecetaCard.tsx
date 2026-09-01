import { costoReceta } from "@/lib/conversion";
import { formatLineaReceta, formatMoneda } from "@/lib/tokens";
import type { InventoryIngredient, Receta } from "@/lib/types";

interface RecetaCardProps {
  receta: Receta;
  inventario: InventoryIngredient[];
  accion?: React.ReactNode;
}

export default function RecetaCard({
  receta,
  inventario,
  accion,
}: RecetaCardProps) {
  const costo = costoReceta(receta, inventario);
  const porId = new Map(inventario.map((i) => [i.id, i]));

  return (
    <article className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <header className="flex flex-col gap-1">
        <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          {receta.nombre}
        </h3>
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          {receta.porciones} {receta.porciones === 1 ? "porción" : "porciones"}
        </p>
      </header>

      <ul className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
        {receta.ingredientes.map((linea, i) => {
          const resultado = costo.lineas[i];
          return (
            <li
              key={i}
              className="flex items-baseline justify-between gap-3 border-b border-zinc-100 pb-1 last:border-0 dark:border-zinc-800"
            >
              <span>{formatLineaReceta(linea, porId.get(linea.ingredientId))}</span>
              <span className="shrink-0 tabular-nums text-zinc-500">
                {resultado.costo != null
                  ? formatMoneda(resultado.costo)
                  : resultado.alGusto
                    ? "a gusto"
                    : "—"}
              </span>
            </li>
          );
        })}
      </ul>

      <footer className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between border-t border-zinc-200 pt-2 text-sm dark:border-zinc-700">
          <span className="font-medium">Total</span>
          <span className="font-semibold tabular-nums">
            {formatMoneda(costo.total)}
          </span>
        </div>
        <div className="flex items-baseline justify-between text-sm text-zinc-600 dark:text-zinc-400">
          <span>Por porción</span>
          <span className="tabular-nums">{formatMoneda(costo.porPorcion)}</span>
        </div>
        {costo.sinCostear > 0 && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            {costo.sinCostear}{" "}
            {costo.sinCostear === 1
              ? "ingrediente sin costear"
              : "ingredientes sin costear"}{" "}
            (falta precio o equivalencia).
          </p>
        )}
        {accion && <div className="pt-1">{accion}</div>}
      </footer>
    </article>
  );
}
