import type {
  BorradorReceta,
  InventoryIngredient,
  Receta,
  RecetaIngrediente,
  Unit,
  UnitCategory,
  VolumeUnit,
  WeightUnit,
} from "./types";

const PESO = ["g", "kg", "lb", "oz"] as const;
const VOLUMEN = ["ml", "L", "cdta", "cda", "taza", "oz_liq", "galon"] as const;
const PIEZA = [
  "unidad",
  "docena",
  "diente",
  "atado",
  "lata",
  "paquete",
  "saco",
  "caja",
] as const;

const FACTOR_PESO: Record<WeightUnit, number> = {
  g: 1,
  kg: 1000,
  lb: 453.59237,
  oz: 28.349523125,
};

const FACTOR_VOLUMEN: Record<VolumeUnit, number> = {
  ml: 1,
  L: 1000,
  cdta: 5,
  cda: 15,
  taza: 240,
  oz_liq: 29.5735295625,
  galon: 3785.411784,
};

const FACTOR_PIEZA_SIMPLE: Partial<Record<(typeof PIEZA)[number], number>> = {
  unidad: 1,
  docena: 12,
};

export interface UnidadMeta {
  id: Unit;
  nombre: string;
  plural: string;
  abreviatura: string;
  categoria: UnitCategory;
}

export const UNIDADES: Record<Unit, UnidadMeta> = {
  g: { id: "g", nombre: "gramo", plural: "gramos", abreviatura: "g", categoria: "peso" },
  kg: { id: "kg", nombre: "kilo", plural: "kilos", abreviatura: "kg", categoria: "peso" },
  lb: { id: "lb", nombre: "libra", plural: "libras", abreviatura: "lb", categoria: "peso" },
  oz: { id: "oz", nombre: "onza", plural: "onzas", abreviatura: "oz", categoria: "peso" },
  ml: { id: "ml", nombre: "mililitro", plural: "mililitros", abreviatura: "ml", categoria: "volumen" },
  L: { id: "L", nombre: "litro", plural: "litros", abreviatura: "L", categoria: "volumen" },
  cdta: { id: "cdta", nombre: "cucharadita", plural: "cucharaditas", abreviatura: "cdta", categoria: "volumen" },
  cda: { id: "cda", nombre: "cucharada", plural: "cucharadas", abreviatura: "cda", categoria: "volumen" },
  taza: { id: "taza", nombre: "taza", plural: "tazas", abreviatura: "tz", categoria: "volumen" },
  oz_liq: { id: "oz_liq", nombre: "onza líquida", plural: "onzas líquidas", abreviatura: "oz líq", categoria: "volumen" },
  galon: { id: "galon", nombre: "galón", plural: "galones", abreviatura: "gal", categoria: "volumen" },
  unidad: { id: "unidad", nombre: "unidad", plural: "unidades", abreviatura: "u", categoria: "pieza" },
  docena: { id: "docena", nombre: "docena", plural: "docenas", abreviatura: "doc", categoria: "pieza" },
  diente: { id: "diente", nombre: "diente", plural: "dientes", abreviatura: "diente", categoria: "pieza" },
  atado: { id: "atado", nombre: "atado", plural: "atados", abreviatura: "atado", categoria: "pieza" },
  lata: { id: "lata", nombre: "lata", plural: "latas", abreviatura: "lata", categoria: "pieza" },
  paquete: { id: "paquete", nombre: "paquete", plural: "paquetes", abreviatura: "paq", categoria: "pieza" },
  saco: { id: "saco", nombre: "saco", plural: "sacos", abreviatura: "saco", categoria: "pieza" },
  caja: { id: "caja", nombre: "caja", plural: "cajas", abreviatura: "caja", categoria: "pieza" },
};

export const UNIDADES_POR_CATEGORIA: Record<UnitCategory, UnidadMeta[]> = {
  peso: PESO.map((u) => UNIDADES[u]),
  volumen: VOLUMEN.map((u) => UNIDADES[u]),
  pieza: PIEZA.map((u) => UNIDADES[u]),
};

export function categoriaDeUnidad(u: Unit): UnitCategory {
  if ((PESO as readonly string[]).includes(u)) return "peso";
  if ((VOLUMEN as readonly string[]).includes(u)) return "volumen";
  return "pieza";
}

export function convertirSimple(
  cantidad: number,
  desde: Unit,
  hasta: Unit,
): number | null {
  if (desde === hasta) return cantidad;

  const cd = categoriaDeUnidad(desde);
  const ch = categoriaDeUnidad(hasta);
  if (cd !== ch) return null;

  if (cd === "peso") {
    return (cantidad * FACTOR_PESO[desde as WeightUnit]) / FACTOR_PESO[hasta as WeightUnit];
  }
  if (cd === "volumen") {
    return (
      (cantidad * FACTOR_VOLUMEN[desde as VolumeUnit]) / FACTOR_VOLUMEN[hasta as VolumeUnit]
    );
  }

  const fd = FACTOR_PIEZA_SIMPLE[desde as (typeof PIEZA)[number]];
  const fh = FACTOR_PIEZA_SIMPLE[hasta as (typeof PIEZA)[number]];
  if (fd != null && fh != null) return (cantidad * fd) / fh;
  return null;
}

export function convertirParaIngrediente(
  cantidad: number,
  desde: Unit,
  hasta: Unit,
  ing: InventoryIngredient,
): number | null {
  const directo = convertirSimple(cantidad, desde, hasta);
  if (directo != null) return directo;

  const equiv = ing.equivalencia;
  if (!equiv) return null;

  const catBase = categoriaDeUnidad(equiv.unidadBase);

  if (desde === equiv.unidadPieza && categoriaDeUnidad(hasta) === catBase) {
    return convertirSimple(cantidad * equiv.cantidad, equiv.unidadBase, hasta);
  }

  if (hasta === equiv.unidadPieza && categoriaDeUnidad(desde) === catBase) {
    const enBase = convertirSimple(cantidad, desde, equiv.unidadBase);
    if (enBase == null) return null;
    return enBase / equiv.cantidad;
  }

  return null;
}

export interface CostoLinea {
  costo: number | null;
  alGusto: boolean;
  motivo?: string;
}

export interface CostoReceta {
  total: number;
  porPorcion: number;
  lineas: CostoLinea[];
  sinCostear: number;
  aGusto: number;
}

export function costoLinea(
  linea: RecetaIngrediente,
  ing: InventoryIngredient | undefined,
): CostoLinea {
  if (linea.alGusto || linea.cantidad == null || linea.unidad == null) {
    return { costo: null, alGusto: true, motivo: "Cantidad a gusto" };
  }
  if (!ing) {
    return { costo: null, alGusto: false, motivo: "Ingrediente fuera del inventario" };
  }
  const enCompra = convertirParaIngrediente(
    linea.cantidad,
    linea.unidad,
    ing.unidadCompra,
    ing,
  );
  if (enCompra == null) {
    return {
      costo: null,
      alGusto: false,
      motivo: `No hay forma de pasar de ${UNIDADES[linea.unidad].plural} a ${
        UNIDADES[ing.unidadCompra].plural
      } (falta equivalencia)`,
    };
  }
  return { costo: enCompra * ing.precioCompra, alGusto: false };
}

export function costoReceta(
  receta: Receta | BorradorReceta,
  inventario: InventoryIngredient[],
): CostoReceta {
  const porId = new Map(inventario.map((i) => [i.id, i]));

  let total = 0;
  let sinCostear = 0;
  let aGusto = 0;

  const lineas = receta.ingredientes.map((linea) => {
    const resultado = costoLinea(linea, porId.get(linea.ingredientId));
    if (resultado.costo != null) total += resultado.costo;
    else if (resultado.alGusto) aGusto += 1;
    else sinCostear += 1;
    return resultado;
  });

  const porPorcion = receta.porciones > 0 ? total / receta.porciones : total;
  return { total, porPorcion, lineas, sinCostear, aGusto };
}

export function factorEscala(porcionesBase: number, porcionesDestino: number): number {
  if (porcionesBase <= 0) return 1;
  return porcionesDestino / porcionesBase;
}

export function escalarReceta(receta: Receta, porcionesDestino: number): Receta {
  const factor = factorEscala(receta.porciones, porcionesDestino);
  return {
    ...receta,
    porciones: porcionesDestino,
    ingredientes: receta.ingredientes.map((linea) =>
      linea.alGusto || linea.cantidad == null
        ? linea
        : { ...linea, cantidad: linea.cantidad * factor },
    ),
  };
}

export function mejorUnidad(
  cantidad: number,
  unidad: Unit,
): { cantidad: number; unidad: Unit } {
  if (unidad === "g" || unidad === "kg") {
    const enG = convertirSimple(cantidad, unidad, "g")!;
    return enG >= 1000 ? { cantidad: enG / 1000, unidad: "kg" } : { cantidad: enG, unidad: "g" };
  }
  if (unidad === "ml" || unidad === "L") {
    const enMl = convertirSimple(cantidad, unidad, "ml")!;
    return enMl >= 1000 ? { cantidad: enMl / 1000, unidad: "L" } : { cantidad: enMl, unidad: "ml" };
  }
  return { cantidad, unidad };
}
