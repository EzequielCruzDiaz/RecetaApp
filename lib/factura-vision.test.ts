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

const { atenderLectura } = await import("./factura-vision");

function peticion(foto?: Blob) {
  const cuerpo = new FormData();
  if (foto) cuerpo.append("foto", foto, "factura.jpg");
  return new Request("http://localhost/api/facturas/leer", { method: "POST", body: cuerpo });
}

const jpg = () => new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])], { type: "image/jpeg" });

const respuesta = (json: unknown, stop_reason = "end_turn") => ({
  stop_reason,
  content: [{ type: "text", text: JSON.stringify(json) }],
});

describe("POST /api/facturas/leer", () => {
  beforeEach(() => {
    vi.stubEnv("ANTHROPIC_API_KEY", "sk-prueba");
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
});
