// SOLO desarrollo local. La app se entrega VACÍA a cada cliente: sin recetas
// ni ingredientes precargados. La carga inicial de datos de un cliente nuevo
// es un paso operativo manual al momento de la venta, no una feature.
//
// StoreProvider usa estos datos únicamente cuando NODE_ENV === "development".

import type { InventoryIngredient, Receta } from "./types";

export const INVENTARIO_DEMO: InventoryIngredient[] = [
  {
    id: "pollo",
    nombre: "Pollo",
    categoria: "peso",
    unidadCompra: "lb",
    precioCompra: 85,
    stock: 40,
    stockMinimo: 15,
  },
  {
    id: "cebolla",
    nombre: "Cebolla",
    categoria: "pieza",
    unidadCompra: "lb",
    precioCompra: 35,
    stock: 8,
    stockMinimo: 5,
    equivalencia: { unidadPieza: "unidad", cantidad: 150, unidadBase: "g" },
  },
  {
    id: "ajo",
    nombre: "Ajo",
    categoria: "pieza",
    unidadCompra: "lb",
    precioCompra: 150,
    stock: 2,
    stockMinimo: 3,
    equivalencia: { unidadPieza: "diente", cantidad: 5, unidadBase: "g" },
  },
];

export const RECETAS_DEMO: Receta[] = [
  {
    id: "pollo-guisado",
    nombre: "Pollo guisado",
    categoria: "Carnes",
    porciones: 6,
    unidadRendimiento: "porciones",
    ingredientes: [
      { ingredientId: "pollo", cantidad: 1000, unidad: "g", alGusto: false },
      { ingredientId: "cebolla", cantidad: 1, unidad: "unidad", alGusto: false },
      { ingredientId: "ajo", cantidad: 3, unidad: "diente", alGusto: false },
    ],
  },
];
