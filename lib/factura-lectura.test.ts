import { describe, expect, it } from "vitest";
import {
  agregarLectura,
  aItemFactura,
  completarEncabezado,
  cuadraTotal,
  cuadreLectura,
  encabezadoSin,
  necesitaRespaldo,
  normalizarLecturaIA,
  quitarLectura,
  totalesDe,
  type ItemBorrador,
  type LecturaFactura,
} from "./factura-lectura";
import type { CamposFacturaOCR } from "./factura-ocr";
import { NACIONAL_CORTO, NACIONAL_FOTOCOPIA } from "./factura-nacional.fixture";

const item = (nombre: string, cantidad: number, precioUnitario: number): ItemBorrador => ({
  nombre,
  cantidad,
  unidad: null,
  precioUnitario,
});

function lectura(id: string, campos: Partial<CamposFacturaOCR> = {}): LecturaFactura {
  return { id, foto: `blob:${id}`, motor: "ia", campos: { items: [], textoCrudo: "", ...campos } };
}

const vacio = { proveedor: "", fecha: "", rnc: "", ncf: "" };

describe("agregarLectura / quitarLectura", () => {
  it("cambia la fila vacía inicial por los productos leídos", () => {
    const l = lectura("a", { items: [item("Arroz", 2, 45), item("Aceite", 1, 380)] });
    const items = agregarLectura([item("", 1, 0)], l);
    expect(items.map((x) => x.nombre)).toEqual(["Arroz", "Aceite"]);
    expect(items.every((x) => x.origen === "a")).toBe(true);
  });

  it("agrega la segunda factura debajo de la primera y respeta lo escrito a mano", () => {
    const a = lectura("a", { items: [item("Arroz", 2, 45)] });
    const b = lectura("b", { items: [item("Pollo", 3, 95)] });
    let items = agregarLectura([item("", 1, 0)], a);
    items = [...items, item("Hielo", 1, 50)];
    items = agregarLectura(items, b);
    expect(items.map((x) => x.nombre)).toEqual(["Arroz", "Hielo", "Pollo"]);
  });

  it("al quitar una factura se van solo sus productos", () => {
    const a = lectura("a", { items: [item("Arroz", 2, 45), item("Sal", 1, 20)] });
    const b = lectura("b", { items: [item("Pollo", 3, 95)] });
    const items = [...agregarLectura(agregarLectura([], a), b), item("Hielo", 1, 50)];
    expect(quitarLectura(items, "a").map((x) => x.nombre)).toEqual(["Pollo", "Hielo"]);
  });

  it("marca los productos dudosos por posición", () => {
    const l = lectura("a", { items: [item("Arroz", 2, 45), item("Q??so", 1, 300)], itemsDudosos: [1] });
    const items = agregarLectura([], l);
    expect(items.map((x) => Boolean(x.dudoso))).toEqual([false, true]);
  });

  it("aItemFactura no guarda las marcas del formulario", () => {
    const guardado = aItemFactura({ ...item("Arroz", 2, 45), origen: "a", dudoso: true, ingredientId: "i1" });
    expect(guardado).not.toHaveProperty("origen");
    expect(guardado).not.toHaveProperty("dudoso");
    expect(guardado.ingredientId).toBe("i1");
  });
});

describe("encabezado", () => {
  it("completa solo lo vacío", () => {
    const sig = completarEncabezado(
      { ...vacio, proveedor: "Escrito a mano" },
      { proveedor: "Nacional", rnc: "101001577", items: [], textoCrudo: "" },
    );
    expect(sig).toEqual({ proveedor: "Escrito a mano", fecha: "", rnc: "101001577", ncf: "" });
  });

  it("al quitar la factura que llenó un campo, toma el de la siguiente", () => {
    const a = lectura("a", { proveedor: "Nacional", ncf: "E310000012345" });
    const b = lectura("b", { proveedor: "Bravo" });
    const sig = encabezadoSin(
      { proveedor: "Nacional", fecha: "2026-10-01", rnc: "", ncf: "E310000012345" },
      a,
      [b],
      "2026-10-10",
    );
    expect(sig).toEqual({ proveedor: "Bravo", fecha: "2026-10-01", rnc: "", ncf: "" });
  });

  it("si no queda otra factura, la fecha que vino de la foto vuelve a hoy", () => {
    const a = lectura("a", { fecha: "2026-10-01" });
    expect(encabezadoSin({ ...vacio, fecha: "2026-10-01" }, a, [], "2026-10-10").fecha).toBe("2026-10-10");
  });

  it("no toca lo que el usuario cambió a mano", () => {
    const a = lectura("a", { proveedor: "Nacinal" });
    const sig = encabezadoSin({ ...vacio, proveedor: "Supermercados Nacional" }, a, [], "2026-10-10");
    expect(sig.proveedor).toBe("Supermercados Nacional");
  });
});

describe("totales y cuadre", () => {
  it("suma ITBIS y total de todas las facturas", () => {
    expect(totalesDe([lectura("a", { itbis: 18, total: 118 }), lectura("b", { itbis: 9, total: 59 })])).toMatchObject({
      itbis: 27,
      total: 177,
    });
  });

  it("sin total en alguna factura, el total se calcula", () => {
    expect(totalesDe([lectura("a", { total: 118 }), lectura("b")]).total).toBeNull();
    expect(totalesDe([])).toEqual({ itbis: 0, descuento: 0, total: null });
  });

  it("cuadra con el ITBIS incluido (súper) o sumado aparte (colmado)", () => {
    expect(cuadraTotal(1180, 180, 1180)).toBe(true);
    expect(cuadraTotal(1000, 180, 1180)).toBe(true);
    expect(cuadraTotal(1000, 180, 1300)).toBe(false);
  });

  it("tolera centavos de redondeo en facturas largas", () => {
    expect(cuadraTotal(12_499.6, 0, 12_500)).toBe(true);
    expect(cuadraTotal(12_000, 0, 12_500)).toBe(false);
  });

  it("cuadreLectura sin total no opina", () => {
    expect(cuadreLectura({ items: [item("Arroz", 2, 45)], textoCrudo: "" })).toEqual({ suma: 90, cuadra: null });
    expect(cuadreLectura({ items: [item("Arroz", 2, 45)], total: 90, textoCrudo: "" }).cuadra).toBe(true);
    expect(cuadreLectura({ items: [item("Arroz", 2, 45)], total: 150, textoCrudo: "" }).cuadra).toBe(false);
  });
});

describe("normalizarLecturaIA", () => {
  // Lo que devuelve el modelo para un recibo de supermercado con e-CF.
  const nacional = {
    proveedor: "Supermercados Nacional",
    rnc: "1-01-00157-7",
    ncf: "E310004567891",
    fecha: "2026-10-08",
    items: [
      { nombre: "Arroz Selecto 10 lb", cantidad: 1, unidad: null, precioUnitario: 495, importe: 495, dudoso: false },
      { nombre: "Pechuga de pollo", cantidad: 2.35, unidad: "lb", precioUnitario: 125, importe: 293.75, dudoso: false },
      { nombre: "Aceite Mazola 1 gl", cantidad: 2, unidad: null, precioUnitario: 1270, importe: 1270, dudoso: false },
      { nombre: "Cebolla roja", cantidad: 1.5, unidad: "lb", precioUnitario: 60, importe: 95, dudoso: false },
    ],
    itbis: 145.2,
    total: 1948.75,
    camposDudosos: ["fecha"],
    dudas: ["La fecha está borrosa."],
  };

  it("pasa los campos del recibo al formulario", () => {
    const c = normalizarLecturaIA(nacional);
    expect(c.proveedor).toBe("Supermercados Nacional");
    expect(c.rnc).toBe("101001577");
    expect(c.ncf).toBe("E310004567891");
    expect(c.fecha).toBe("2026-10-08");
    expect(c.items).toHaveLength(4);
    expect(c.items[1]).toEqual({ nombre: "Pechuga de pollo", cantidad: 2.35, unidad: "lb", precioUnitario: 125 });
    expect(c.camposDudosos).toEqual(["fecha"]);
    expect(c.dudas).toEqual(["La fecha está borrosa."]);
  });

  it("si puso el importe como precio, lo divide entre la cantidad", () => {
    const c = normalizarLecturaIA(nacional);
    expect(c.items[2]).toMatchObject({ cantidad: 2, precioUnitario: 635 });
  });

  it("marca el producto cuya cantidad × precio no da el importe", () => {
    const c = normalizarLecturaIA(nacional);
    expect(c.itemsDudosos).toEqual([3]);
  });

  it("descarta lo que no tiene sentido sin romperse", () => {
    const c = normalizarLecturaIA({
      proveedor: "  ",
      rnc: "12345",
      ncf: "B01-123",
      fecha: "08/10/2026",
      items: [
        { nombre: "", cantidad: 1, precioUnitario: 10 },
        { nombre: "Sin precio", cantidad: 1, precioUnitario: 0, importe: null },
        { nombre: "Solo importe", cantidad: 0, precioUnitario: 0, importe: 80 },
        { nombre: "Unidad rara", cantidad: 1, unidad: "barril", precioUnitario: 5 },
        "basura",
      ],
      total: -3,
      camposDudosos: ["proveedor", "otra cosa"],
      dudas: [1, "  Ojo  "],
    });
    expect(c.proveedor).toBeUndefined();
    expect(c.rnc).toBeUndefined();
    expect(c.ncf).toBeUndefined();
    expect(c.fecha).toBeUndefined();
    expect(c.total).toBeUndefined();
    expect(c.items).toEqual([
      { nombre: "Solo importe", cantidad: 1, unidad: null, precioUnitario: 80 },
      { nombre: "Unidad rara", cantidad: 1, unidad: null, precioUnitario: 5 },
    ]);
    expect(c.camposDudosos).toEqual(["proveedor"]);
    expect(c.dudas).toEqual(["Ojo"]);
  });

  it("aguanta una respuesta vacía", () => {
    expect(normalizarLecturaIA(null)).toMatchObject({ items: [], dudas: [], camposDudosos: [] });
  });
});

describe("necesitaRespaldo", () => {
  const base = { items: [item("Arroz", 2, 45), item("Sal", 1, 20)], textoCrudo: "" };
  it("no, si cuadra con el total o no hay total", () => {
    expect(necesitaRespaldo({ ...base, total: 110 })).toBe(false);
    expect(necesitaRespaldo(base)).toBe(false);
  });
  it("sí, si no cuadra, no leyó productos o muchos son dudosos", () => {
    expect(necesitaRespaldo({ ...base, total: 400 })).toBe(true);
    expect(necesitaRespaldo({ items: [], textoCrudo: "" })).toBe(true);
    expect(necesitaRespaldo({ ...base, itemsDudosos: [0] })).toBe(true);
  });
});

describe("tickets reales de Supermercado Nacional", () => {
  it("ticket corto: 10 productos, RNC del suplidor y cuadra con el total después de descuentos", () => {
    const c = normalizarLecturaIA(NACIONAL_CORTO);
    expect(c.items).toHaveLength(10);
    expect(c.rnc).toBe("101019921");
    expect(c.items[4]).toEqual({ nombre: "PLATANO MADURO", cantidad: 3, unidad: null, precioUnitario: 20 });
    expect(c.itemsDudosos).toEqual([]);
    expect(cuadreLectura(c)).toMatchObject({ contra: "total", cuadra: true });
    expect(necesitaRespaldo(c)).toBe(false);
  });

  it("sin el descuento, el ticket corto no cuadraría (y se pediría el respaldo)", () => {
    const c = normalizarLecturaIA({ ...NACIONAL_CORTO, descuento: null });
    expect(cuadreLectura(c).cuadra).toBe(false);
    expect(necesitaRespaldo(c)).toBe(true);
  });

  it("fotocopia cortada: 62 productos, los pesados en libras y cuadra con el subtotal", () => {
    const c = normalizarLecturaIA(NACIONAL_FOTOCOPIA);
    expect(c.items).toHaveLength(62);
    expect(c.items[4]).toEqual({ nombre: "COSTILLA AHUMA", cantidad: 0.94, unidad: "lb", precioUnitario: 178.95 });
    expect(c.total).toBeUndefined();
    expect(cuadreLectura(c)).toMatchObject({ contra: "subtotal", cuadra: true });
    expect(necesitaRespaldo(c)).toBe(false);
  });

  it("si la fotocopia se lee con las líneas repetidas dos veces, no cuadra", () => {
    const repetidas = NACIONAL_FOTOCOPIA.items.slice(23, 25);
    const c = normalizarLecturaIA({ ...NACIONAL_FOTOCOPIA, items: [...NACIONAL_FOTOCOPIA.items, ...repetidas] });
    expect(cuadreLectura(c).cuadra).toBe(false);
  });

  it("la compra toma el total pagado, o subtotal menos descuento si el ticket está cortado", () => {
    const a = lectura("a", normalizarLecturaIA(NACIONAL_CORTO));
    const b = lectura("b", normalizarLecturaIA(NACIONAL_FOTOCOPIA));
    expect(totalesDe([a])).toEqual({ itbis: 223.81, descuento: 546.09, total: 10375.61 });
    expect(totalesDe([a, b]).total).toBe(10375.61 + 26096.94 - 154.48);
  });

  it("con descuento, el formulario acepta el total del ticket", () => {
    expect(cuadraTotal(10921.7, 223.81, 10375.61, 546.09)).toBe(true);
    expect(cuadraTotal(10921.7, 223.81, 10375.61)).toBe(false);
  });
});
