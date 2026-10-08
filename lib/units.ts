import type {
  InventoryIngredient,
  PieceUnit,
  Unit,
  VolumeUnit,
  WeightUnit,
} from "./types";
import { formatMoney } from "./format";

export interface UnitInfo {
  label: string;
  caption: string;
  step: number;
  def: number;
}

export const UNIT_INFO: Record<Unit, UnitInfo> = {
  g: { label: "g", caption: "gramo", step: 50, def: 100 },
  kg: { label: "kg", caption: "kilo", step: 0.25, def: 1 },
  lb: { label: "lb", caption: "libra", step: 0.5, def: 1 },
  oz: { label: "oz", caption: "onza", step: 1, def: 4 },
  ml: { label: "ml", caption: "mililitro", step: 50, def: 250 },
  L: { label: "L", caption: "litro", step: 0.25, def: 1 },
  cdta: { label: "cdta", caption: "cucharadita", step: 1, def: 1 },
  cda: { label: "cda", caption: "cucharada", step: 1, def: 2 },
  taza: { label: "taza", caption: "taza", step: 0.25, def: 1 },
  oz_liq: { label: "oz líq.", caption: "onza líquida", step: 1, def: 4 },
  galon: { label: "galón", caption: "galón", step: 0.25, def: 1 },
  unidad: { label: "unidad", caption: "", step: 1, def: 1 },
  docena: { label: "docena", caption: "", step: 1, def: 1 },
  diente: { label: "diente", caption: "", step: 1, def: 3 },
  atado: { label: "atado", caption: "", step: 0.5, def: 1 },
  lata: { label: "lata", caption: "", step: 0.5, def: 1 },
  paquete: { label: "paquete", caption: "", step: 1, def: 1 },
  saco: { label: "saco", caption: "", step: 0.5, def: 1 },
  caja: { label: "caja", caption: "", step: 1, def: 1 },
};

const PESO: WeightUnit[] = ["lb", "kg", "g", "oz"];
const VOLUMEN: VolumeUnit[] = ["L", "ml", "cda", "cdta", "taza", "oz_liq", "galon"];

export const esPeso = (u: Unit): u is WeightUnit => (PESO as string[]).includes(u);
export const esVolumen = (u: Unit): u is VolumeUnit => (VOLUMEN as string[]).includes(u);
export const esPieza = (u: Unit): u is PieceUnit => !esPeso(u) && !esVolumen(u);

export interface UnidadOpcion {
  unidad: Unit;
  label: string;
  caption: string;
  step: number;
  def: number;
}

/**
 * Unidades que el usuario puede elegir para un ingrediente en una receta.
 * Solo se ofrecen las que el sistema SÍ sabe convertir — nunca se mezcla
 * peso con volumen.
 */
export function unidadesDisponibles(ing: InventoryIngredient): UnidadOpcion[] {
  const orden: Unit[] = [];
  const agregar = (u: Unit) => {
    if (!orden.includes(u)) orden.push(u);
  };

  const comp = ing.unidadCompra;
  agregar(comp);

  const eq = ing.equivalencia;
  if (eq) agregar(eq.unidadPieza);

  const grupoDe = (u: Unit): Unit[] => (esPeso(u) ? PESO : esVolumen(u) ? VOLUMEN : []);
  grupoDe(comp).forEach(agregar);
  if (eq && esPieza(comp)) grupoDe(eq.unidadBase).forEach(agregar);

  return orden.map((unidad) => {
    const info = UNIT_INFO[unidad];
    const esLaPiezaDeLaEquivalencia = eq && unidad === eq.unidadPieza;
    const caption = esLaPiezaDeLaEquivalencia
      ? `≈ ${eq.cantidad} ${UNIT_INFO[eq.unidadBase].label}`
      : info.caption;
    return { unidad, label: info.label, caption, step: info.step, def: info.def };
  });
}

/** Texto de precio de inventario, ej. "RD$150.00 / lb · 1 diente ≈ 5 g" */
export function etiquetaPrecio(ing: InventoryIngredient): string {
  const base = `${formatMoney(ing.precioCompra)} / ${UNIT_INFO[ing.unidadCompra].label}`;
  const eq = ing.equivalencia;
  if (!eq) return base;
  return `${base} · 1 ${UNIT_INFO[eq.unidadPieza].label} ≈ ${eq.cantidad} ${UNIT_INFO[eq.unidadBase].label}`;
}
