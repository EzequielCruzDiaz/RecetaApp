import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const create = vi.fn();
vi.mock("@anthropic-ai/sdk", () => {
  class APIError extends Error {
    status = 500;
  }
  class Anthropic {
    static APIError = APIError;
    messages = { create };
  }
  return { default: Anthropic };
});

const { atenderLectura, explicarErrorApi } = await import("./factura-vision");
const { default: AnthropicFalso } = (await import("@anthropic-ai/sdk")) as unknown as {
  default: { APIError: new (m: string) => Error & { status: number } };
};

function peticion(...fotos: Blob[]) {
  const cuerpo = new FormData();
  fotos.forEach((f, i) => cuerpo.append("foto", f, `factura-${i}.jpg`));
  return new Request("http://localhost/api/facturas/leer", { method: "POST", body: cuerpo });
}

const jpg = () => new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])], { type: "image/jpeg" });

const respuesta = (json: unknown, stop_reason = "end_turn") => ({
  stop_reason,
  content: [{ type: "text", text: JSON.stringify(json) }],
});

describe("POST /api/facturas/leer", () => {
  beforeEach(() => {
    vi.stubEnv("ANTHROPIC_API_KEY", "sk-ant-prueba");
    create.mockReset();
  });
  afterEach(() => vi.unstubAllEnvs());

  it("sin clave responde 503 para que el navegador use Tesseract", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    const res = await atenderLectura(peticion(jpg()));
    expect(res.status).toBe(503);
    expect(await res.json()).toMatchObject({ codigo: "sin-clave" });
    expect(create).not.toHaveBeenCalled();
  });

  it("rechaza peticiones sin foto o con otro tipo de archivo", async () => {
    expect((await atenderLectura(peticion())).status).toBe(400);
    expect((await atenderLectura(peticion(new Blob(["hola"], { type: "text/plain" })))).status).toBe(415);
  });

  it("manda la imagen con salida estructurada y devuelve los campos normalizados", async () => {
    create.mockResolvedValue(
      respuesta({
        proveedor: "Supermercados Nacional",
        rnc: "101001577",
        ncf: "E310004567891",
        fecha: "2026-10-08",
        items: [{ nombre: "Arroz", cantidad: 2, unidad: null, precioUnitario: 45, importe: 90, dudoso: false }],
        itbis: null,
        total: 90,
        camposDudosos: [],
        dudas: [],
      }),
    );
    const res = await atenderLectura(peticion(jpg()));
    expect(res.status).toBe(200);
    const { campos } = await res.json();
    expect(campos).toMatchObject({ proveedor: "Supermercados Nacional", total: 90, items: [{ nombre: "Arroz" }] });

    const params = create.mock.calls[0][0];
    expect(params.output_config.format.type).toBe("json_schema");
    expect(params.messages[0].content[0]).toMatchObject({
      type: "image",
      source: { type: "base64", media_type: "image/jpeg" },
    });
  });

  it("si el modelo se niega, responde error y no inventa datos", async () => {
    create.mockResolvedValue({ stop_reason: "refusal", content: [] });
    const res = await atenderLectura(peticion(jpg()));
    expect(res.status).toBe(422);
  });

  const cuadra = {
    proveedor: "Colmado",
    rnc: null,
    ncf: null,
    fecha: null,
    items: [{ nombre: "Arroz", cantidad: 2, unidad: null, precioUnitario: 45, importe: 90, dudoso: false }],
    itbis: null,
    total: 90,
    camposDudosos: [],
    dudas: [],
  };
  const noCuadra = { ...cuadra, total: 500 };

  it("lee con Haiku y no gasta en Sonnet si cuadra", async () => {
    create.mockResolvedValue(respuesta(cuadra));
    expect((await atenderLectura(peticion(jpg()))).status).toBe(200);
    expect(create.mock.calls.map((c) => c[0].model)).toEqual(["claude-haiku-5-5"]);
  });

  it("si no cuadra con el total, vuelve a leer una sola vez con Sonnet", async () => {
    create.mockResolvedValueOnce(respuesta(noCuadra)).mockResolvedValueOnce(respuesta({ ...noCuadra, items: [
      { nombre: "Arroz", cantidad: 2, unidad: null, precioUnitario: 45, importe: 90, dudoso: false },
      { nombre: "Aceite", cantidad: 1, unidad: null, precioUnitario: 410, importe: 410, dudoso: false },
    ] }));
    const { campos } = await (await atenderLectura(peticion(jpg()))).json();
    expect(create.mock.calls.map((c) => c[0].model)).toEqual(["claude-haiku-5-5", "claude-sonnet-5-5"]);
    expect(campos.items).toHaveLength(2);
  });

  it("si Sonnet falla, se queda con lo que leyó Haiku", async () => {
    create.mockResolvedValueOnce(respuesta(noCuadra)).mockRejectedValueOnce(new Error("caído"));
    const res = await atenderLectura(peticion(jpg()));
    expect(res.status).toBe(200);
    expect((await res.json()).campos.total).toBe(500);
  });

  it("el respaldo se puede apagar", async () => {
    vi.stubEnv("FACTURA_MODELO_RESPALDO", "no");
    vi.resetModules();
    const { atenderLectura: sinRespaldo } = await import("./factura-vision");
    create.mockResolvedValue(respuesta(noCuadra));
    await sinRespaldo(peticion(jpg()));
    expect(create).toHaveBeenCalledTimes(1);
  });

  it("manda las franjas de un ticket largo juntas, en orden", async () => {
    create.mockResolvedValue(respuesta(cuadra));
    await atenderLectura(peticion(jpg(), jpg(), jpg()));
    const contenido = create.mock.calls[0][0].messages[0].content;
    expect(contenido.filter((b: { type: string }) => b.type === "image")).toHaveLength(3);
    expect((await atenderLectura(peticion(jpg(), jpg(), jpg(), jpg()))).status).toBe(400);
  });

  it("avisa si la clave no tiene formato de clave (p. ej. el id apikey_…)", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "apikey_01AbC");
    const res = await atenderLectura(peticion(jpg()));
    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.codigo).toBe("clave-formato");
    expect(JSON.stringify(json)).not.toContain("apikey_01AbC");
    expect(create).not.toHaveBeenCalled();
  });

  it("una clave rechazada por la API se explica sin mostrar la clave", async () => {
    const e = new AnthropicFalso.APIError("invalid x-api-key");
    e.status = 401;
    create.mockRejectedValue(e);
    const json = await (await atenderLectura(peticion(jpg()))).json();
    expect(json.codigo).toBe("clave-invalida");
    expect(json.error).not.toContain("sk-ant-prueba");
  });
});

describe("explicarErrorApi", () => {
  it("traduce los errores de la API a algo que se pueda resolver", () => {
    expect(explicarErrorApi(400, "Your credit balance is too low").codigo).toBe("sin-credito");
    expect(explicarErrorApi(404).codigo).toBe("modelo");
    expect(explicarErrorApi(429).codigo).toBe("limite");
    expect(explicarErrorApi(529).codigo).toBe("caido");
    expect(explicarErrorApi(undefined).codigo).toBe("red");
    expect(explicarErrorApi(400, "otra cosa").codigo).toBe("api");
  });
});
