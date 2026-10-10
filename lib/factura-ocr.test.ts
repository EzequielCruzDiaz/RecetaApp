import { describe, expect, it } from "vitest";
import { combinarLecturas, parseFacturaTexto, parseMonto } from "./factura-ocr";

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

// Texto tal cual lo devolvió Tesseract (spa) sobre fotos simuladas de celular
// (sombra, papel desteñido, desenfoque, inclinación), ya preparadas con
// lib/ocr-imagen.ts. PSM 6 = por filas; PSM 11 = bloques sueltos.
const OCR = {
  superFilas: "SUPERMERCADOS LA ECONOMIA\nAV. 27 DE FEBRERO $345\nSANTO DOMINGO, REP. DOM.\nTEL: 809-555-1234\nRNC: 1-01-23456.-7\nFACTURA PARA CONSUMIDOR FINAL\nNCF: BO200004521]\nFECHA: 08/10/2026   HORA: 14:32\nCAJA: 03  CAJERO: MARIA\nDESCRIPCION                        VALOR\nARROZ SELECTO 10LB\n2 X 395.00                     790.00\nACEITE CRISOL 1GL                 620.00 G\nPOLLO ENTERO LB\n4.52 X 85.00                   384.20\nCEBOLLA ROJA LB\n3 X 45.00                    135.00\nHABICHUELA ROJA 118               98.50\nSAL REFINADA 1KG                  35.00\nSUBTOTAL                        2,062.70\nITBIS 183                          111.60\nTOTAL                           2,174.30\nEFECTIVO                        2,200.90\nCAMBIO                              25.70\nARTICULOS: 6\nGRACIAS POR su COMPRA\n",
  superSueltos: "SUPERMERCADOS LA ECONOMIA\n\nAV. 27 DE FEBRERO $345\n\nSANTO DOMINGO\n\n» REP. DOM,\n\nTEL: 809-555-1234\n\nRNC: 1-01-23456.-7\n\nFACTURA PARA CONSUMI\n\nDOR FINAL\n\nNCF: BO200004521]\n\nFECHA: 08/10/2026\n\nHORA:\n\n14:32\n\nCAJA: 03  CAJERO: MA\n\nRIA\n\nÓN\n\nDESCRIPCION\n\nE\n\nVALOR\n\nÓN\n\nTorn\n\non...\n\nARROZ SELECTO 10LB\n\n2 X 395.00\n\n790.00\n\nACEITE CRISOL 1GL\n\nPOLLO ENTERO LB\n\n620.00 G\n\n4.52 X 85.00\n\nCEBOLLA ROJA LB\n\n384.20\n\n3 X 45.00\n\nHABICHUELA ROJA 118\n\n135.00\n\nSAL REFINADA 1KG\n\n98.50\n\nEN\n\no\n\n35.00\n\nSUBTOTAL\n\no.\n\nITBIS 183\n\nTOTAL\n\n2,062.70\n\n111.60\n\nEFECTIVO\n\n2,174.30\n\nCAMBIO\n\n2,200.00\n\nARTICULOS: 6\n\n25.70\n\nGRACIAS POR sy COMPRA\n",
  colmadoFilas: "COLMADO EL BUEN PRECIO\nC/ DUARTE NO. 12, VILLA MELLA\nRNC 131-2345678-9\nNCF B0100000123\nFECHA 09/10/2026\nCANT DESCRIPCION     PRECIO    IMPORTE\n5    PLATANO VERDE    22.00     110.00\n2    SALAMI INDUVECA 175.00     350.00\n1    QUESO DE FREIR  210.00     210.00\n12 HUEVOS           10.00     120.00\nSUB-TOTAL                        790.00\nITBIS                           142.20\nTOTAL A PAGAR                    932.20\n",
  colmadoSueltos: "COLMADO EL BUEN PRECIO\n\nC/ DUARTE NO. 12, VILLA MELLA\n\nRNC 131-2345678-9\n\nNCF B0100000123\n\nFECHA 09/10/2026\n\nTT\n\n\"rota... nooo.\n\nCANT DESCRIPCION\n\n5\n\nPRECIO\n\nIMPORTE\n\nPLATANO VERDE\n\n22.00\n\n110.00\n\n2\n\nSALAMI INDUVECA 175.00\n\n1\n\n350.00\n\n12\n\nQUESO DE FREIR  210.00\n\n210.00\n\nHUEVOS\n\n10.00\n\nTT\n\n120.00\n\nSUB-TOTAL\n\nPr... noo.\n\nooo\n\nITBIS\n\n790.00\n\nTOTAL A PAGAR\n\n142.20\n\n932.20\n",
  distribuidoraFilas: "DISTRIBUIDORA DEL CIBAO, SRL                                            FACTURA DE CREDITO O\nAv. Estrella Sadhalá No. 88, Santiago                                                                            td pe\nTel. 809-582-4410 - RNC 1-30-55432-1                                                                  Factura No. 004512\nCliente: COCINA DOÑA ANA RNC Cliente: 131-2345678-9\nCant.        Descripción                                                                      Precio           ITBIS             Importe\n2             Arroz selecto saco 125Ib                                                  4,500.00            0.00            9,000.00\n3                 Aceite vegetal galón                                                                            620.00            334.80               1,860.00\n10             Guandules verdes lata 150z                                                       68.00          122.40               680.00\n1              Fundas plásticas paquete                                                         180.00            32.40               180.00\nSubtotal: RD$11,720.00\nITBIS: RD$489.60\nTotal: RD$12,209.60\n",
  distribuidoraSueltos: "DISTRIBUIDORA DEL CIBAO, SRL\n\nFACTURA DE CRÉDITO FISCAL\n\nAv. Estrella Sadhalá No. 88, Santiago\n\nTel. 809-582-4410 - RNC 1-30-55432-1\n\nNCF: B0100009981\n\nFecha: 05/10/2026\n\nFactura No. 004512\n\nCliente: COCINA DOÑA ANA RNC Cliente: 131-2345678-9\n\nCant.\n\nDescripción\n\nPrecio\n\nITBIS\n\nImporte\n\nArroz selecto saco 125Ib\n\n4,500.00\n\nAceite vegetal galón\n\n0.00\n\n9,000.00\n\n10\n\nGuandules verdes lata 150z\n\n620.00\n\n334.80\n\n1,860.00\n\n68.00\n\n122.40\n\n680.00\n\nFundas plásticas paquete\n\n180.00\n\n32.40\n\n180.00\n\nSubtotal: RD$11,720.00\n\nITBIS: RD$489.60\n\nTotal: RD$12,209.60\n",
};

const leer = (filas: string, sueltos: string) => combinarLecturas(parseFacturaTexto(filas), parseFacturaTexto(sueltos));
const resumen = (items: { nombre: string; cantidad: number; precioUnitario: number }[]) =>
  items.map((i) => `${i.nombre} | ${i.cantidad} × ${i.precioUnitario}`);

describe("OCR real: recibo térmico de supermercado", () => {
  const c = leer(OCR.superFilas, OCR.superSueltos);

  it("suplidor, RNC (con '.' de ruido), NCF (con O por 0) y fecha", () => {
    expect(c).toMatchObject({
      proveedor: "SUPERMERCADOS LA ECONOMIA",
      rnc: "1-01-23456-7",
      ncf: "B0200004521",
      fecha: "2026-10-08",
    });
  });

  it("ítems en dos líneas (descripción arriba, 'cant X precio importe' abajo) y código de ITBIS al final", () => {
    expect(resumen(c.items)).toEqual([
      "ARROZ SELECTO 10LB | 2 × 395",
      "ACEITE CRISOL 1GL | 1 × 620",
      "POLLO ENTERO LB | 4.52 × 85",
      "CEBOLLA ROJA LB | 3 × 45",
      "HABICHUELA ROJA 118 | 1 × 98.5",
      "SAL REFINADA 1KG | 1 × 35",
    ]);
  });

  it("los ítems suman el subtotal impreso", () => {
    expect(c.items.reduce((a, i) => a + i.cantidad * i.precioUnitario, 0)).toBeCloseTo(2062.7);
    expect(c.itbis).toBeCloseTo(111.6);
    expect(c.total).toBeCloseTo(2174.3);
  });
});

describe("OCR real: colmado", () => {
  const c = leer(OCR.colmadoFilas, OCR.colmadoSueltos);

  it("lee encabezado e ítems con columnas cant/precio/importe", () => {
    expect(c).toMatchObject({ proveedor: "COLMADO EL BUEN PRECIO", rnc: "131-2345678-9", ncf: "B0100000123" });
    expect(resumen(c.items)).toEqual([
      "PLATANO VERDE | 5 × 22",
      "SALAMI INDUVECA | 2 × 175",
      "QUESO DE FREIR | 1 × 210",
      "HUEVOS | 12 × 10",
    ]);
    expect(c.total).toBeCloseTo(932.2);
  });
});

describe("OCR real: factura de crédito fiscal de distribuidora (carta, encabezado a dos columnas)", () => {
  const c = leer(OCR.distribuidoraFilas, OCR.distribuidoraSueltos);

  it("el NCF y la fecha de la columna derecha salen de la lectura por bloques", () => {
    expect(parseFacturaTexto(OCR.distribuidoraFilas).ncf).toBeUndefined();
    expect(c.ncf).toBe("B0100009981");
    expect(c.fecha).toBe("2026-10-05");
  });

  it("usa el RNC del suplidor, no el del cliente", () => {
    expect(c.rnc).toBe("1-30-55432-1");
  });

  it("el suplidor no se mezcla con 'FACTURA DE CRÉDITO FISCAL'", () => {
    expect(c.proveedor).toBe("DISTRIBUIDORA DEL CIBAO, SRL");
  });

  it("columnas cant / precio / ITBIS / importe", () => {
    expect(resumen(c.items)).toEqual([
      "Arroz selecto saco 125Ib | 2 × 4500",
      "Aceite vegetal galón | 3 × 620",
      "Guandules verdes lata 150z | 10 × 68",
      "Fundas plásticas paquete | 1 × 180",
    ]);
    expect(c.itbis).toBeCloseTo(489.6);
    expect(c.total).toBeCloseTo(12209.6);
  });
});

describe("combinarLecturas", () => {
  it("si la lectura por filas no trae ítems, usa los de la otra", () => {
    const vacia = parseFacturaTexto("");
    const otra = parseFacturaTexto("Colmado X\nPan 2 50.00");
    expect(combinarLecturas(vacia, otra).items).toHaveLength(1);
  });
});
