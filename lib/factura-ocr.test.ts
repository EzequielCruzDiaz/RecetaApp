import { describe, expect, it } from "vitest";
import { parseFacturaTexto, parseMonto } from "./factura-ocr";

describe("parseMonto", () => {
  it("formato con coma de miles y punto decimal (1,234.56)", () => {
    expect(parseMonto("1,234.56")).toBeCloseTo(1234.56);
  });

  it("formato con punto de miles y coma decimal (1.234,56)", () => {
    expect(parseMonto("1.234,56")).toBeCloseTo(1234.56);
  });

  it("entero simple", () => {
    expect(parseMonto("1234")).toBe(1234);
  });

  it("ignora símbolos de moneda y espacios", () => {
    expect(parseMonto("RD$ 1,250.00")).toBeCloseTo(1250);
  });

  it("devuelve undefined para '-' o vacío", () => {
    expect(parseMonto("-")).toBeUndefined();
    expect(parseMonto("")).toBeUndefined();
  });

  it("una coma con 1 o 2 dígitos detrás es decimal", () => {
    expect(parseMonto("12,5")).toBeCloseTo(12.5);
    expect(parseMonto("350,00")).toBeCloseTo(350);
  });

  it("una coma con 3 dígitos detrás es separador de miles", () => {
    expect(parseMonto("1,250")).toBe(1250);
    expect(parseMonto("1,250,000")).toBe(1250000);
  });
});

describe("parseFacturaTexto", () => {
  const texto = [
    "Colmado El Buen Precio",
    "RNC: 130-1234567-8",
    "NCF: B0100000123",
    "Fecha: 15/03/2026",
    "",
    "5 x Arroz         350.00",
    "Habichuela 2lb     180.00",
    "",
    "ITBIS               95.40",
    "Total              625.40",
  ].join("\n");

  const campos = parseFacturaTexto(texto);

  it("extrae RNC y NCF", () => {
    expect(campos.rnc).toBe("130-1234567-8");
    expect(campos.ncf).toBe("B0100000123");
  });

  it("normaliza la fecha dd/mm/aaaa a ISO", () => {
    expect(campos.fecha).toBe("2026-03-15");
  });

  it("extrae ITBIS y total", () => {
    expect(campos.itbis).toBeCloseTo(95.4);
    expect(campos.total).toBeCloseTo(625.4);
  });

  it("toma como proveedor la línea anterior al RNC", () => {
    expect(campos.proveedor).toBe("Colmado El Buen Precio");
  });

  it("con prefijo de cantidad ('5 x Arroz 350.00') el monto es el importe: precio unitario = importe / cantidad", () => {
    const item = campos.items.find((i) => i.nombre === "Arroz");
    expect(item?.cantidad).toBe(5);
    expect(item?.precioUnitario).toBe(70);
  });

  it("sin prefijo de cantidad asume 1 (la unidad queda como parte del nombre)", () => {
    const item = campos.items.find((i) => i.nombre.startsWith("Habichuela"));
    expect(item?.cantidad).toBe(1);
    expect(item?.precioUnitario).toBe(180);
  });

  it("no confunde proveedor/RNC/NCF/fecha/ITBIS/total con ítems", () => {
    expect(campos.items).toHaveLength(2);
  });
});

describe("parseFacturaTexto: ítems con varias cifras", () => {
  const ticket = (...lineas: string[]) => parseFacturaTexto(["Supermercado La Cadena", ...lineas].join("\n"));

  it("cantidad, precio e importe en columnas", () => {
    const [item] = ticket("Arroz selecto   3   45.00   135.00").items;
    expect(item).toMatchObject({ nombre: "Arroz selecto", cantidad: 3, precioUnitario: 45 });
  });

  it("precio e importe: la cantidad sale de dividir", () => {
    const [item] = ticket("Aceite galón   620.00   1,240.00").items;
    expect(item).toMatchObject({ nombre: "Aceite galón", cantidad: 2, precioUnitario: 620 });
  });

  it("cantidad entera e importe", () => {
    const [item] = ticket("Platano verde  60  1,320.00").items;
    expect(item).toMatchObject({ nombre: "Platano verde", cantidad: 60, precioUnitario: 22 });
  });

  it("los ítems cuadran con el subtotal", () => {
    const { items } = ticket("2 x Salami   250.00", "Queso 1 180.00", "Leche 55.00 110.00");
    const subtotal = items.reduce((acc, it) => acc + it.cantidad * it.precioUnitario, 0);
    expect(subtotal).toBeCloseTo(540);
  });
});

describe("parseFacturaTexto: líneas que no son ítems ni total", () => {
  const texto = [
    "Distribuidora Del Cibao",
    "Calle Duarte No. 45",
    "Tel: 809-555-1234",
    "RNC: 1-01-12345-6",
    "Fecha: 05/10/2026",
    "Arroz selecto 125lb   4,500.00",
    "Subtotal   4,500.00",
    "ITBIS 18%     810.00",
    "TOTAL A PAGAR   5,310.00",
    "Total de artículos: 1",
    "Efectivo   6,000.00",
  ].join("\n");
  const campos = parseFacturaTexto(texto);

  it("la dirección y el teléfono del suplidor no se cuelan como ítems", () => {
    expect(campos.items.map((i) => i.nombre)).toEqual(["Arroz selecto 125lb"]);
  });

  it("'Total de artículos' no pisa el total a pagar", () => {
    expect(campos.total).toBeCloseTo(5310);
  });

  it("toma ITBIS aunque la línea traiga el porcentaje", () => {
    expect(campos.itbis).toBeCloseTo(810);
  });

  it("RNC de empresa (9 dígitos con guiones)", () => {
    expect(campos.rnc).toBe("1-01-12345-6");
  });
});

describe("parseFacturaTexto: total sin etiqueta explícita", () => {
  it("si hay 'Total' y luego 'Total ITBIS', se queda con el total", () => {
    const c = parseFacturaTexto(["Colmado Mi Barrio", "Pan 10 50.00", "Total 59.00", "Total ITBIS 9.00"].join("\n"));
    expect(c.total).toBeCloseTo(59);
  });
});
