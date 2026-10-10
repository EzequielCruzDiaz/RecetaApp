import { describe, expect, it } from "vitest";
import { claveNombre, sinErrores, validarIngrediente, validarReceta } from "./validacion";
import type { BorradorInventoryIngredient, InventoryIngredient, Receta } from "./types";

const borrador = (o: Partial<BorradorInventoryIngredient> = {}): BorradorInventoryIngredient => ({
  nombre: "Plátano verde",
  categoria: "pieza",
  unidadCompra: "unidad",
  precioCompra: 22,
  stock: 60,
  stockMinimo: 20,
  ...o,
});

const inventario: InventoryIngredient[] = [{ ...borrador({ nombre: "Ajo" }), id: "ajo" }];

describe("claveNombre", () => {
  it("ignora mayúsculas, tildes y espacios de más", () => {
    expect(claveNombre("  Plátano   VERDE ")).toBe(claveNombre("platano verde"));
  });
});

describe("validarIngrediente", () => {
  it("un ingrediente completo pasa", () => {
    expect(sinErrores(validarIngrediente(borrador(), inventario))).toBe(true);
  });

  it("pide nombre", () => {
    expect(validarIngrediente(borrador({ nombre: " " }), inventario).nombre).toBeDefined();
  });

  it("no deja repetir un nombre (aunque cambien tildes o mayúsculas)", () => {
    expect(validarIngrediente(borrador({ nombre: "AJO" }), inventario).nombre).toMatch(/Ya tienes/);
  });

  it("al editar, su propio nombre no cuenta como repetido", () => {
    expect(validarIngrediente(borrador({ nombre: "Ajo" }), inventario, "ajo").nombre).toBeUndefined();
  });

  it("pide precio mayor que 0, nombrando la unidad de compra", () => {
    expect(validarIngrediente(borrador({ precioCompra: 0, unidadCompra: "lb" }), inventario).precioCompra).toMatch(/lb/);
  });

  it("equivalencia sin cantidad", () => {
    const e = validarIngrediente(
      borrador({ unidadCompra: "lb", equivalencia: { unidadPieza: "unidad", cantidad: 0, unidadBase: "g" } }),
      inventario,
    );
    expect(e.equivalencia).toMatch(/cuántos g/);
  });

  it("equivalencia en volumen para algo que se compra por peso", () => {
    const e = validarIngrediente(
      borrador({ unidadCompra: "lb", equivalencia: { unidadPieza: "unidad", cantidad: 150, unidadBase: "ml" } }),
      inventario,
    );
    expect(e.equivalencia).toMatch(/peso/);
  });

  it("si se compra por pieza, la equivalencia tiene que ser de esa pieza", () => {
    const mal = borrador({ unidadCompra: "saco", equivalencia: { unidadPieza: "unidad", cantidad: 50, unidadBase: "kg" } });
    expect(validarIngrediente(mal, inventario).equivalencia).toMatch(/1 saco/);
    const bien = borrador({ unidadCompra: "saco", equivalencia: { unidadPieza: "saco", cantidad: 50, unidadBase: "kg" } });
    expect(validarIngrediente(bien, inventario).equivalencia).toBeUndefined();
  });

  it("la equivalencia típica (cebolla en lb, 1 unidad ≈ 150 g) pasa", () => {
    const e = validarIngrediente(
      borrador({ nombre: "Cebolla", unidadCompra: "lb", equivalencia: { unidadPieza: "unidad", cantidad: 150, unidadBase: "g" } }),
      inventario,
    );
    expect(sinErrores(e)).toBe(true);
  });
});

describe("validarReceta", () => {
  const recetas: Receta[] = [{ id: "r1", nombre: "Pollo guisado", porciones: 6, ingredientes: [] }];
  const item = (o: Partial<Parameters<typeof validarReceta>[0]["items"][number]> = {}) => ({
    ingredientId: "ajo",
    nombre: "Ajo",
    cantidad: 3,
    alGusto: false,
    error: null,
    ...o,
  });
  const valida = { nombre: "Moro de guandules", porciones: 12, items: [item()] };

  it("una receta completa pasa", () => {
    expect(sinErrores(validarReceta(valida, recetas))).toBe(true);
  });

  it("pide nombre y no deja repetirlo", () => {
    expect(validarReceta({ ...valida, nombre: "" }, recetas).nombre).toBeDefined();
    expect(validarReceta({ ...valida, nombre: "pollo  guisado" }, recetas).nombre).toMatch(/Ya tienes/);
    expect(validarReceta({ ...valida, nombre: "Pollo guisado" }, recetas, "r1").nombre).toBeUndefined();
  });

  it("pide al menos un ingrediente", () => {
    expect(validarReceta({ ...valida, items: [] }, recetas).ingredientes).toBeDefined();
  });

  it("un ingrediente en 0 se marca, salvo que sea al gusto", () => {
    expect(validarReceta({ ...valida, items: [item({ cantidad: 0 })] }, recetas).porItem.ajo).toBeDefined();
    expect(validarReceta({ ...valida, items: [item({ cantidad: 0, alGusto: true })] }, recetas).porItem.ajo).toBeUndefined();
  });

  it("un ingrediente con unidades que no convierten bloquea el guardado", () => {
    const e = validarReceta({ ...valida, items: [item({ error: "No se puede convertir" })] }, recetas);
    expect(sinErrores(e)).toBe(false);
  });

  it("rendimiento menor que 1", () => {
    expect(validarReceta({ ...valida, porciones: 0 }, recetas).porciones).toBeDefined();
  });
});
