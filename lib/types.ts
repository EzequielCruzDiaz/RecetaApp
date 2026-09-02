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
  stock: number;
  stockMinimo: number;
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
  categoria?: string;
  porciones: number;
  unidadRendimiento?: string;
  ingredientes: RecetaIngrediente[];
}

export interface FacturaItem {
  nombre: string;
  cantidad: number;
  unidad: Unit | null;
  precioUnitario: number;
  ingredientId?: string;
}

export interface Factura {
  id: string;
  proveedor: string;
  fecha: string;
  rnc?: string;
  ncf?: string;
  items: FacturaItem[];
  itbis: number;
  total: number;
  aplicadaAlInventario: boolean;
}

export type BorradorInventoryIngredient = Omit<InventoryIngredient, "id">;
export type BorradorReceta = Omit<Receta, "id">;
export type BorradorFactura = Omit<Factura, "id" | "aplicadaAlInventario">;
