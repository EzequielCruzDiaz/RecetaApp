import type { WeightUnit, VolumeUnit, Unit, InventoryIngredient, Receta } from "./types";

const WEIGHT_FACTORS: Record<WeightUnit, number> = {
  g: 1,
  kg: 1000,
  lb: 453.592,
  oz: 28.3495,
};

const VOLUME_FACTORS: Record<VolumeUnit, number> = {
  ml: 1,
  L: 1000,
  cdta: 4.92892,
  cda: 14.7868,
  taza: 236.588,
  oz_liq: 29.5735,
  galon: 3785.41,
};

const isWeightUnit = (u: Unit): u is WeightUnit => u in WEIGHT_FACTORS;
const isVolumeUnit = (u: Unit): u is VolumeUnit => u in VOLUME_FACTORS;

export function convertWeight(cantidad: number, de: WeightUnit, a: WeightUnit): number {
  return (cantidad * WEIGHT_FACTORS[de]) / WEIGHT_FACTORS[a];
}

export function convertVolume(cantidad: number, de: VolumeUnit, a: VolumeUnit): number {
  return (cantidad * VOLUME_FACTORS[de]) / VOLUME_FACTORS[a];
}

export function computeIngredientCost(
  ing: InventoryIngredient,
  cantidad: number,
  unidad: Unit
): number {
  if (unidad === ing.unidadCompra) {
    return cantidad * ing.precioCompra;
  }

  if (isWeightUnit(unidad) && isWeightUnit(ing.unidadCompra)) {
    return convertWeight(cantidad, unidad, ing.unidadCompra) * ing.precioCompra;
  }

  if (isVolumeUnit(unidad) && isVolumeUnit(ing.unidadCompra)) {
    return convertVolume(cantidad, unidad, ing.unidadCompra) * ing.precioCompra;
  }

  if (ing.equivalencia) {
    const eq = ing.equivalencia;

    if (unidad === eq.unidadPieza) {
      const cantidadEnBase = cantidad * eq.cantidad;
      const cantidadEnCompra = isWeightUnit(ing.unidadCompra)
        ? convertWeight(cantidadEnBase, eq.unidadBase as WeightUnit, ing.unidadCompra)
        : convertVolume(cantidadEnBase, eq.unidadBase as VolumeUnit, ing.unidadCompra as VolumeUnit);
      return cantidadEnCompra * ing.precioCompra;
    }

    if (ing.unidadCompra === eq.unidadPieza && (isWeightUnit(unidad) || isVolumeUnit(unidad))) {
      const cantidadEnBase = isWeightUnit(unidad)
        ? convertWeight(cantidad, unidad, eq.unidadBase as WeightUnit)
        : convertVolume(cantidad, unidad, eq.unidadBase as VolumeUnit);
      return (cantidadEnBase / eq.cantidad) * ing.precioCompra;
    }
  }

  throw new Error(
    `No se puede convertir "${unidad}" a la unidad de compra "${ing.unidadCompra}" para "${ing.nombre}". Falta definir una equivalencia.`
  );
}

export function computeRecipeCost(
  receta: Receta,
  inventario: Record<string, InventoryIngredient>
): { costoTotal: number; costoPorPorcion: number } {
  const costoTotal = receta.ingredientes.reduce((total, ri) => {
    if (ri.alGusto || ri.cantidad === null || ri.unidad === null) return total;
    const ing = inventario[ri.ingredientId];
    if (!ing) return total;
    return total + computeIngredientCost(ing, ri.cantidad, ri.unidad);
  }, 0);

  return {
    costoTotal,
    costoPorPorcion: receta.porciones > 0 ? costoTotal / receta.porciones : 0,
  };
}

export function scaleRecipe(receta: Receta, porcionesDestino: number): Receta {
  const factor = receta.porciones > 0 ? porcionesDestino / receta.porciones : 1;
  return {
    ...receta,
    porciones: porcionesDestino,
    ingredientes: receta.ingredientes.map((ri) =>
      ri.alGusto || ri.cantidad === null ? ri : { ...ri, cantidad: ri.cantidad * factor }
    ),
  };
}
