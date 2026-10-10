import { describe, expect, it } from "vitest";
import { computeIngredientCost, computeRecipeCost, convertVolume, convertWeight, scaleRecipe } from "./conversion";
import type { InventoryIngredient, Receta } from "./types";

function ingrediente(overrides: Partial<InventoryIngredient> = {}): InventoryIngredient {
  return {
    id: "ing-1",
    nombre: "Harina",
    categoria: "peso",
    unidadCompra: "kg",
    precioCompra: 50,
    stock: 10,
    stockMinimo: 2,
    ...overrides,
  };
}

function receta(overrides: Partial<Receta> = {}): Receta {
  return {
    id: "r1",
    nombre: "Receta test",
    porciones: 4,
    ingredientes: [],
    ...overrides,
  };
}

describe("convertWeight / convertVolume", () => {
  it("convierte kg a g", () => {
    expect(convertWeight(2, "kg", "g")).toBeCloseTo(2000);
  });

  it("convierte lb a kg", () => {
    expect(convertWeight(1, "lb", "kg")).toBeCloseTo(0.453592, 5);
  });

  it("convierte L a ml", () => {
    expect(convertVolume(1.5, "L", "ml")).toBeCloseTo(1500);
  });
});

describe("computeIngredientCost", () => {
  it("misma unidad: cantidad * precio", () => {
    expect(computeIngredientCost(ingrediente(), 3, "kg")).toBe(150);
  });

  it("convierte entre unidades de peso", () => {
    expect(computeIngredientCost(ingrediente({ precioCompra: 50 }), 500, "g")).toBeCloseTo(25);
  });

  it("convierte entre unidades de volumen", () => {
    const ing = ingrediente({ categoria: "volumen", unidadCompra: "L", precioCompra: 80 });
    expect(computeIngredientCost(ing, 250, "ml")).toBeCloseTo(20);
  });

  it("usa la equivalencia pieza->peso (se compra por kg, la receta pide dientes)", () => {
    const ing = ingrediente({
      unidadCompra: "kg",
      precioCompra: 100,
      equivalencia: { unidadPieza: "diente", cantidad: 5, unidadBase: "g" },
    });
    expect(computeIngredientCost(ing, 4, "diente")).toBeCloseTo(2);
  });

  it("usa la equivalencia peso->pieza (se compra por docena, la receta pide gramos)", () => {
    const ing = ingrediente({
      categoria: "pieza",
      unidadCompra: "docena",
      precioCompra: 120,
      equivalencia: { unidadPieza: "docena", cantidad: 600, unidadBase: "g" },
    });
    expect(computeIngredientCost(ing, 300, "g")).toBeCloseTo(60);
  });

  it("lanza un error si no hay equivalencia para convertir", () => {
    const ing = ingrediente({ categoria: "pieza", unidadCompra: "unidad" });
    expect(() => computeIngredientCost(ing, 2, "kg")).toThrow(/No se puede convertir/);
  });
});

describe("computeRecipeCost", () => {
  it("suma el costo de los ingredientes y divide por porciones", () => {
    const inventario = { "ing-1": ingrediente({ precioCompra: 50 }) };
    const r = receta({
      porciones: 4,
      ingredientes: [{ ingredientId: "ing-1", cantidad: 2, unidad: "kg", alGusto: false }],
    });
    const { costoTotal, costoPorPorcion } = computeRecipeCost(r, inventario);
    expect(costoTotal).toBe(100);
    expect(costoPorPorcion).toBe(25);
  });

  it("ignora ingredientes 'al gusto' y los que no están en inventario", () => {
    const inventario = { "ing-1": ingrediente() };
    const r = receta({
      ingredientes: [
        { ingredientId: "ing-1", cantidad: null, unidad: null, alGusto: true },
        { ingredientId: "no-existe", cantidad: 1, unidad: "kg", alGusto: false },
      ],
    });
    expect(computeRecipeCost(r, inventario).costoTotal).toBe(0);
  });

  it("no divide por cero si las porciones son 0", () => {
    expect(computeRecipeCost(receta({ porciones: 0 }), {}).costoPorPorcion).toBe(0);
  });
});

describe("scaleRecipe", () => {
  it("escala las cantidades proporcionalmente al rendimiento nuevo", () => {
    const r = receta({
      porciones: 4,
      ingredientes: [{ ingredientId: "ing-1", cantidad: 2, unidad: "kg", alGusto: false }],
    });
    const escalada = scaleRecipe(r, 8);
    expect(escalada.porciones).toBe(8);
    expect(escalada.ingredientes[0].cantidad).toBe(4);
  });

  it("no toca los ingredientes 'al gusto'", () => {
    const r = receta({
      ingredientes: [{ ingredientId: "ing-1", cantidad: null, unidad: null, alGusto: true }],
    });
    expect(scaleRecipe(r, 8).ingredientes[0].cantidad).toBeNull();
  });
});
