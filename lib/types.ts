export type UnitCategory = "peso" | "volumen" | "pieza";

export type WeightUnit = "g" | "kg" | "lb" | "oz";
export type VolumeUnit = "ml" | "L" | "cdta" | "cda" | "taza" | "oz_liq" | "galon";
export type PieceUnit =
  | "unidad"
  | "docena"
  | "diente"
  | "atado"
  | "lata"
  | "paquete"
  | "saco"
  | "caja";

export type Unit = WeightUnit | VolumeUnit | PieceUnit;

export interface InventoryIngredient {
  id: string;
  nombre: string;
  categoria: UnitCategory;
  unidadCompra: Unit;
  precioCompra: number;
  equivalencia?: {
    unidadPieza: PieceUnit;
    cantidad: number;
    unidadBase: WeightUnit | VolumeUnit;
  };
}

export interface RecetaIngrediente {
  ingredientId: string;
  cantidad: number | null;
  unidad: Unit | null;
  alGusto: boolean;
}

export interface Receta {
  id: string;
  nombre: string;
  porciones: number;
  ingredientes: RecetaIngrediente[];
}

export type BorradorInventoryIngredient = Omit<InventoryIngredient, "id">;
export type BorradorReceta = Omit<Receta, "id">;
