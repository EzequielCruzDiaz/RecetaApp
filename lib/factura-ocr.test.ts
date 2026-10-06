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

  it("una coma con un solo decimal se trata como separador de miles (comportamiento actual)", () => {
    expect(parseMonto("12,5")).toBe(125);
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
    "ITBIS              216.00",
    "Total             1696.00",
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
    expect(campos.itbis).toBe(216);
    expect(campos.total).toBe(1696);
  });

  it("toma como proveedor la línea anterior al RNC", () => {
    expect(campos.proveedor).toBe("Colmado El Buen Precio");
  });

  it("con prefijo de cantidad ('5 x Arroz') separa cantidad y nombre", () => {
    const item = campos.items.find((i) => i.nombre === "Arroz");
    expect(item?.cantidad).toBe(5);
    expect(item?.precioUnitario).toBe(350);
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
