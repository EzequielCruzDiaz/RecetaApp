import { describe, expect, it } from "vitest";
import {
  aplicarAlStock,
  buscarDuplicada,
  cantidadParaStock,
  hoyLocal,
  prepararItems,
  hayErrores,
  sugerirIngrediente,
  validarFactura,
} from "./factura";
import type { Factura, FacturaItem, InventoryIngredient } from "./types";

function ing(overrides: Partial<InventoryIngredient> = {}): InventoryIngredient {
  return {
    id: "arroz",
    nombre: "Arroz selecto",
    categoria: "peso",
    unidadCompra: "lb",
    precioCompra: 38,
    stock: 100,
    stockMinimo: 20,
    ...overrides,
  };
}

function item(overrides: Partial<FacturaItem> = {}): FacturaItem {
  return { nombre: "Arroz", cantidad: 1, unidad: null, precioUnitario: 0, ...overrides };
}

function factura(overrides: Partial<Factura> = {}): Factura {
  return {
    id: "f1",
    proveedor: "Mercado Nuevo",
    fecha: "2026-10-08",
    items: [],
    itbis: 0,
    total: 0,
    aplicadaAlInventario: true,
    ...overrides,
  };
}

describe("hoyLocal", () => {
  it("usa la fecha local, no la UTC (a las 9 p.m. en RD sigue siendo hoy)", () => {
    // 10 oct 2026, 21:30 hora local: en UTC ya es 11 oct si el reloj está en UTC-4.
    expect(hoyLocal(new Date(2026, 9, 10, 21, 30))).toBe("2026-10-10");
  });

  it("rellena mes y día con cero", () => {
    expect(hoyLocal(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

describe("sugerirIngrediente", () => {
  const inventario = [
    ing({ id: "sal", nombre: "Sal" }),
    ing({ id: "salami", nombre: "Salami Induveca" }),
    ing({ id: "arroz", nombre: "Arroz selecto" }),
    ing({ id: "arroz-blanco", nombre: "Arroz" }),
    ing({ id: "platano", nombre: "Plátano verde" }),
  ];

  it("un nombre vacío no se vincula a nada", () => {
    expect(sugerirIngrediente("", inventario)).toBeUndefined();
    expect(sugerirIngrediente("   ", inventario)).toBeUndefined();
  });

  it("'Salami Induveca' no se confunde con 'Sal'", () => {
    expect(sugerirIngrediente("Salami Induveca 1lb", inventario)).toBe("salami");
  });

  it("'Sal' no se vincula a 'Salami'", () => {
    expect(sugerirIngrediente("Sal refinada", inventario)).toBe("sal");
  });

  it("gana el ingrediente más específico", () => {
    expect(sugerirIngrediente("Arroz selecto 125lb", inventario)).toBe("arroz");
  });

  it("ignora tildes y mayúsculas", () => {
    expect(sugerirIngrediente("PLATANO VERDE", inventario)).toBe("platano");
  });
});

describe("cantidadParaStock", () => {
  it("sin unidad asume la de compra", () => {
    expect(cantidadParaStock({ cantidad: 5, unidad: null }, ing())).toBe(5);
  });

  it("convierte kg a lb antes de sumar", () => {
    expect(cantidadParaStock({ cantidad: 2, unidad: "kg" }, ing())).toBeCloseTo(4.409, 3);
  });

  it("usa la equivalencia de piezas (1 unidad ≈ 150 g)", () => {
    const cebolla = ing({
      nombre: "Cebolla",
      unidadCompra: "lb",
      equivalencia: { unidadPieza: "unidad", cantidad: 150, unidadBase: "g" },
    });
    expect(cantidadParaStock({ cantidad: 10, unidad: "unidad" }, cebolla)).toBeCloseTo(3.307, 3);
  });

  it("devuelve null si no hay forma de convertir (saco → lb sin equivalencia)", () => {
    expect(cantidadParaStock({ cantidad: 1, unidad: "saco" }, ing())).toBeNull();
  });

  it("no mezcla peso con volumen", () => {
    expect(cantidadParaStock({ cantidad: 1, unidad: "L" }, ing())).toBeNull();
  });
});

describe("aplicarAlStock", () => {
  const inventario = [ing({ stock: 100 }), ing({ id: "aceite", nombre: "Aceite", unidadCompra: "L", stock: 4 })];

  it("suma en la unidad de compra: 2 kg de arroz son ~4.41 lb, no 2", () => {
    const items = prepararItems([item({ cantidad: 2, unidad: "kg", ingredientId: "arroz" })], inventario);
    const nuevo = aplicarAlStock(inventario, items, 1);
    expect(nuevo[0].stock).toBeCloseTo(104.409, 3);
  });

  it("al borrar resta exactamente lo que había sumado", () => {
    const items = prepararItems(
      [
        item({ cantidad: 2, unidad: "kg", ingredientId: "arroz" }),
        item({ nombre: "Aceite", cantidad: 500, unidad: "ml", ingredientId: "aceite" }),
      ],
      inventario,
    );
    const despues = aplicarAlStock(aplicarAlStock(inventario, items, 1), items, -1);
    expect(despues.map((i) => i.stock)).toEqual([100, 4]);
  });

  it("los ítems sin vincular no tocan el stock", () => {
    const items = prepararItems([item({ cantidad: 9 })], inventario);
    expect(aplicarAlStock(inventario, items, 1)).toEqual(inventario);
  });

  it("facturas guardadas antes del arreglo (sin cantidadStock) revierten su cantidad original", () => {
    const viejo = [item({ cantidad: 3, ingredientId: "arroz" })];
    expect(aplicarAlStock(inventario, viejo, -1)[0].stock).toBe(97);
  });
});

describe("buscarDuplicada", () => {
  const registradas = [factura({ id: "f1", ncf: "B0100004512", rnc: "131-2345678-9" })];

  it("mismo NCF y RNC es la misma factura", () => {
    expect(buscarDuplicada({ ncf: "b01 0000 4512", rnc: "13123456789", proveedor: "Otro nombre" }, registradas)?.id).toBe("f1");
  });

  it("mismo NCF de otro suplidor no es duplicada", () => {
    expect(buscarDuplicada({ ncf: "B0100004512", rnc: "101-1234567-1", proveedor: "Mercado Nuevo" }, registradas)).toBeUndefined();
  });

  it("sin RNC compara por nombre del suplidor", () => {
    const sinRnc = [factura({ ncf: "B0100000001" })];
    expect(buscarDuplicada({ ncf: "B0100000001", proveedor: " mercado nuevo " }, sinRnc)).toBeDefined();
  });

  it("sin NCF no se puede saber: nunca la marca como duplicada", () => {
    expect(buscarDuplicada({ proveedor: "Mercado Nuevo" }, [factura()])).toBeUndefined();
  });
});

describe("validarFactura", () => {
  const inventario = [ing()];
  const valida = {
    proveedor: "Mercado Nuevo",
    fecha: "2026-10-08",
    rnc: "",
    ncf: "",
    items: [item({ nombre: "Arroz", cantidad: 10, precioUnitario: 38, ingredientId: "arroz" })],
  };
  const validar = (cambios: Partial<typeof valida>, facturas: Factura[] = []) =>
    validarFactura({ ...valida, ...cambios }, inventario, facturas, "2026-10-10");

  it("una factura completa no tiene errores", () => {
    expect(hayErrores(validar({}))).toBe(false);
  });

  it("pide suplidor", () => {
    expect(validar({ proveedor: "  " }).proveedor).toBeDefined();
  });

  it("no acepta fecha vacía ni futura", () => {
    expect(validar({ fecha: "" }).fecha).toBeDefined();
    expect(validar({ fecha: "2026-10-11" }).fecha).toMatch(/después de hoy/);
  });

  it("RNC: 9 u 11 dígitos", () => {
    expect(validar({ rnc: "1-01-12345-6" }).rnc).toBeUndefined();
    expect(validar({ rnc: "131-2345678-9" }).rnc).toBeUndefined();
    expect(validar({ rnc: "131-234" }).rnc).toBeDefined();
  });

  it("NCF: B + 10 dígitos o E + 12 (e-CF)", () => {
    expect(validar({ ncf: "B0100004512" }).ncf).toBeUndefined();
    expect(validar({ ncf: "E310000000123" }).ncf).toBeUndefined();
    expect(validar({ ncf: "B01000" }).ncf).toBeDefined();
  });

  it("marca la factura repetida en el NCF", () => {
    const ya = [factura({ ncf: "B0100004512" })];
    expect(validar({ ncf: "B0100004512" }, ya).ncf).toMatch(/Ya registraste/);
  });

  it("sin ítems con datos no se guarda", () => {
    expect(validar({ items: [item({ nombre: "", precioUnitario: 0 })] }).items).toBeDefined();
  });

  it("las filas vacías se ignoran si hay otras con datos", () => {
    const e = validar({ items: [...valida.items, item({ nombre: "", precioUnitario: 0 })] });
    expect(hayErrores(e)).toBe(false);
  });

  it("una fila con precio pero sin nombre se marca (antes se descartaba callada)", () => {
    const e = validar({ items: [item({ nombre: "", cantidad: 2, precioUnitario: 50 })] });
    expect(e.porItem[0].nombre).toBeDefined();
  });

  it("marca cantidad y precio en 0", () => {
    const e = validar({ items: [item({ nombre: "Arroz", cantidad: 0, precioUnitario: 0 })] });
    expect(e.porItem[0]).toMatchObject({ cantidad: expect.any(String) });
    const e2 = validar({ items: [item({ nombre: "Arroz", cantidad: 1, precioUnitario: 0 })] });
    expect(e2.porItem[0].precio).toBeDefined();
  });

  it("no deja vincular con una unidad que no se puede convertir", () => {
    const e = validar({ items: [item({ nombre: "Arroz", cantidad: 1, unidad: "saco", precioUnitario: 4500, ingredientId: "arroz" })] });
    expect(e.porItem[0].unidad).toMatch(/lb.*saco/);
  });
});
