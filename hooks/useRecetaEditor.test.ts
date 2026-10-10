import { describe, expect, it } from "vitest";
import type { InventoryIngredient } from "@/lib/types";
import { formatMoney } from "@/lib/format";
import { digitosOdometro } from "@/lib/odometer";
import { etiquetaPrecio, unidadesDisponibles } from "@/lib/units";
import { aReceta, calcularResumen, crearReducer, type EstadoEditor } from "./useRecetaEditor";

const inv: InventoryIngredient[] = [
  { id: "pollo", nombre: "Pollo entero", categoria: "peso", unidadCompra: "lb", precioCompra: 85, stock: 100, stockMinimo: 10 },
  {
    id: "ajo",
    nombre: "Ajo",
    categoria: "pieza",
    unidadCompra: "lb",
    precioCompra: 150,
    stock: 20,
    stockMinimo: 2,
    equivalencia: { unidadPieza: "diente", cantidad: 5, unidadBase: "g" },
  },
  { id: "cebolla", nombre: "Cebolla", categoria: "peso", unidadCompra: "lb", precioCompra: 40, stock: 20, stockMinimo: 2 },
  { id: "aceite", nombre: "Aceite vegetal", categoria: "volumen", unidadCompra: "L", precioCompra: 120, stock: 10, stockMinimo: 1 },
  {
    id: "tomate",
    nombre: "Tomate en lata",
    categoria: "pieza",
    unidadCompra: "lata",
    precioCompra: 65,
    stock: 30,
    stockMinimo: 3,
    equivalencia: { unidadPieza: "lata", cantidad: 400, unidadBase: "g" },
  },
  { id: "sal", nombre: "Sal", categoria: "peso", unidadCompra: "lb", precioCompra: 20, stock: 5, stockMinimo: 1 },
];

const red = crearReducer(inv);
const cerca = (a: number, b: number, tol = 0.005) => expect(Math.abs(a - b)).toBeLessThan(tol);

function estadoInicial(): EstadoEditor {
  return {
    nombre: "Pollo guisado",
    porciones: 8,
    limite: 35,
    nuevoId: null,
    guardada: false,
    items: [
      { ingredientId: "pollo", unidad: "lb", cantidad: 2, alGusto: false, estado: "activo" },
      { ingredientId: "ajo", unidad: "diente", cantidad: 3, alGusto: false, estado: "activo" },
      { ingredientId: "cebolla", unidad: "lb", cantidad: 0.5, alGusto: false, estado: "activo" },
      { ingredientId: "aceite", unidad: "L", cantidad: 0.25, alGusto: false, estado: "activo" },
      { ingredientId: "sal", unidad: "lb", cantidad: 0, alGusto: true, estado: "activo" },
    ],
  };
}

describe("useRecetaEditor: estado inicial", () => {
  it("suma el costo de los ingredientes activos, ignora el 'al gusto'", () => {
    const r = calcularResumen(estadoInicial(), inv);
    cerca(r.costoTotal, 224.96);
    cerca(r.costoPorPorcion, 28.12);
    expect(r.superaLimite).toBe(false);
    expect(r.items.find((i) => i.ingredientId === "sal")!.costo).toBeNull();
  });
});

describe("useRecetaEditor: acciones", () => {
  it("incrementar suma el step de la unidad actual", () => {
    const s = red(estadoInicial(), { tipo: "incrementar", ingredientId: "pollo" });
    expect(s.items[0].cantidad).toBe(2.5);
    cerca(calcularResumen(s, inv).costoTotal, 267.46);
  });

  it("cambiar de unidad reinicia a la cantidad por defecto; una unidad no convertible se ignora", () => {
    let s = red(estadoInicial(), { tipo: "unidad", ingredientId: "ajo", unidad: "g" });
    expect(s.items[1].unidad).toBe("g");
    expect(s.items[1].cantidad).toBe(100);
    cerca(calcularResumen(s, inv).items[1].costo!, 33.07);

    const antes = s;
    s = red(s, { tipo: "unidad", ingredientId: "ajo", unidad: "ml" });
    expect(s).toBe(antes);
  });

  it("agregar: unidad/cantidad por defecto, marca nuevoId, no duplica", () => {
    let s = red(estadoInicial(), { tipo: "agregar", ingredientId: "tomate" });
    expect(s.nuevoId).toBe("tomate");
    expect(s.items.at(-1)!.unidad).toBe("lata");
    expect(s.items.at(-1)!.cantidad).toBe(1);

    const n = s.items.length;
    s = red(s, { tipo: "agregar", ingredientId: "tomate" });
    expect(s.items.length).toBe(n);

    const r = calcularResumen(s, inv);
    expect(r.disponibles.some((d) => d.id === "tomate")).toBe(false);
  });

  it("limite: superaLimite reacciona al umbral", () => {
    let s = red(estadoInicial(), { tipo: "limite", valor: 20 });
    expect(calcularResumen(s, inv).superaLimite).toBe(true);
    s = red(s, { tipo: "limite", valor: 500 });
    expect(calcularResumen(s, inv).superaLimite).toBe(false);
  });

  it("quitar: tachar deja de sumar al instante; eliminar lo saca; guardada se apaga al editar", () => {
    let s = red(estadoInicial(), { tipo: "guardada" });
    expect(s.guardada).toBe(true);

    const totalAntes = calcularResumen(s, inv).costoTotal;
    s = red(s, { tipo: "tachar", ingredientId: "pollo" });
    expect(s.guardada).toBe(false);
    cerca(calcularResumen(s, inv).costoTotal, totalAntes - 2 * 85);
    expect(aReceta(s, "x").ingredientes.some((i) => i.ingredientId === "pollo")).toBe(false);

    s = red(s, { tipo: "colapsar", ingredientId: "pollo" });
    s = red(s, { tipo: "eliminar", ingredientId: "pollo" });
    expect(s.items.some((i) => i.ingredientId === "pollo")).toBe(false);
  });

  it("cantidad no baja de 0; porciones mínimo 1; 'al gusto' sale null en la receta", () => {
    let w = red(estadoInicial(), { tipo: "cantidad", ingredientId: "cebolla", valor: 0.2 });
    w = red(w, { tipo: "decrementar", ingredientId: "cebolla" });
    expect(w.items.find((i) => i.ingredientId === "cebolla")!.cantidad).toBe(0);
    expect(red(w, { tipo: "porciones", valor: 0 }).porciones).toBe(1);

    const sal = aReceta(estadoInicial(), "x").ingredientes.find((i) => i.ingredientId === "sal")!;
    expect([sal.cantidad, sal.unidad, sal.alGusto]).toEqual([null, null, true]);
  });

  it("unidad imposible: no rompe, devuelve error y no suma", () => {
    const roto: EstadoEditor = {
      ...estadoInicial(),
      items: [{ ingredientId: "pollo", unidad: "ml", cantidad: 100, alGusto: false, estado: "activo" }],
    };
    const r = calcularResumen(roto, inv);
    expect(r.costoTotal).toBe(0);
    expect(r.items[0].error).toBeTruthy();
  });
});

describe("useRecetaEditor: los 3 ejemplos validados a mano", () => {
  it("pollo 1000 g = RD$187.39", () => {
    let t = red({ ...estadoInicial(), items: [] }, { tipo: "agregar", ingredientId: "pollo" });
    t = red(t, { tipo: "unidad", ingredientId: "pollo", unidad: "g" });
    t = red(t, { tipo: "cantidad", ingredientId: "pollo", valor: 1000 });
    cerca(calcularResumen(t, inv).costoTotal, 187.39);
  });

  it("ajo 3 dientes = RD$4.96", () => {
    let u = red({ ...estadoInicial(), items: [] }, { tipo: "agregar", ingredientId: "ajo" });
    u = red(u, { tipo: "unidad", ingredientId: "ajo", unidad: "diente" });
    cerca(calcularResumen(u, inv).costoTotal, 4.96);
  });

  it("tomate en lata 100 g = RD$16.25", () => {
    let v = red({ ...estadoInicial(), items: [] }, { tipo: "agregar", ingredientId: "tomate" });
    v = red(v, { tipo: "unidad", ingredientId: "tomate", unidad: "g" });
    v = red(v, { tipo: "cantidad", ingredientId: "tomate", valor: 100 });
    cerca(calcularResumen(v, inv).costoTotal, 16.25);
  });
});

describe("units: fichas de unidad", () => {
  it("ajo ofrece su unidad de compra, la de equivalencia, y el resto de su categoría", () => {
    const ajo = unidadesDisponibles(inv[1]);
    expect(ajo.map((o) => o.unidad)).toEqual(["lb", "diente", "kg", "g", "oz"]);
    expect(ajo[1].caption).toBe("≈ 5 g");
  });

  it("tomate en lata: igual, con su propia equivalencia", () => {
    const tom = unidadesDisponibles(inv[4]);
    expect(tom.map((o) => o.unidad)).toEqual(["lata", "lb", "kg", "g", "oz"]);
  });

  it("nunca mezcla peso con volumen", () => {
    expect(unidadesDisponibles(inv[0]).some((o) => o.unidad === "ml")).toBe(false);
  });

  it("etiquetaPrecio usa formatMoney (RD$, es-DO)", () => {
    expect(etiquetaPrecio(inv[1])).toBe("RD$150.00 / lb · 1 diente ≈ 5 g");
    expect(formatMoney(1234.5)).toBe("RD$1,234.50");
  });
});

describe("odometer: digitosOdometro", () => {
  it("descompone el monto en columnas enteras y decimales", () => {
    const o = digitosOdometro(224.96);
    expect(o.entero.map((d) => d.digito)).toEqual([0, 2, 2, 4]);
    expect(o.decimal.map((d) => d.digito)).toEqual([9, 6]);
    expect(o.entero.map((d) => d.tenue)).toEqual([true, false, false, false]);
  });

  it("RD$0.00 no se ve vacío: el último entero nunca es tenue", () => {
    expect(digitosOdometro(0).entero.map((d) => d.tenue)).toEqual([true, true, true, false]);
  });

  it("negativos y NaN se muestran como 0.00", () => {
    expect(digitosOdometro(-5).entero.map((d) => d.digito)).toEqual([0, 0, 0, 0]);
    expect(digitosOdometro(NaN).entero.map((d) => d.digito)).toEqual([0, 0, 0, 0]);
  });

  it("montos de 5 cifras o más agregan columnas en vez de recortarse a 9999.99", () => {
    const o = digitosOdometro(12500.75);
    expect(o.entero.map((d) => d.digito)).toEqual([1, 2, 5, 0, 0]);
    expect(o.decimal.map((d) => d.digito)).toEqual([7, 5]);
    expect(o.entero.every((d) => !d.tenue)).toBe(true);
  });
});
