import { describe, expect, it } from "vitest";
import { aGrises, escalaPara, umbralAdaptativo } from "./ocr-imagen";

describe("escalaPara", () => {
  it("achica una foto de 12 MP a ~2000 px de lado mayor", () => {
    expect(Math.round(4000 * escalaPara(4000, 3000))).toBe(2000);
  });

  it("agranda una imagen chica, pero no más de 2×", () => {
    expect(escalaPara(600, 400)).toBe(2);
    expect(escalaPara(1500, 800)).toBeCloseTo(2000 / 1500);
  });
});

describe("aGrises", () => {
  it("convierte RGBA a luminancia", () => {
    const rgba = new Uint8ClampedArray([255, 255, 255, 255, 0, 0, 0, 255]);
    expect(Array.from(aGrises(rgba, 2, 1))).toEqual([255, 0]);
  });
});

describe("umbralAdaptativo", () => {
  it("separa la tinta del papel aunque media hoja esté en sombra", () => {
    // 40×10: papel claro (200) a la izquierda y en sombra (90) a la derecha,
    // con un trazo de tinta en cada mitad (150 en la luz, 40 en la sombra).
    const w = 40, h = 10;
    const gris = new Uint8ClampedArray(w * h);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const sombra = x >= 20;
        const tinta = x === 10 || x === 30;
        gris[y * w + x] = tinta ? (sombra ? 40 : 150) : sombra ? 90 : 200;
      }
    const bn = umbralAdaptativo(gris, w, h, 9);
    const fila = Array.from(bn.slice(5 * w, 6 * w));
    expect(fila[10]).toBe(0);
    expect(fila[30]).toBe(0);
    // El papel en sombra queda blanco (un umbral global lo pondría negro);
    // se deja fuera el borde duro entre luz y sombra.
    const papel = fila.filter((_, x) => x !== 10 && x !== 30 && (x < 16 || x > 24));
    expect(papel.every((v) => v === 255)).toBe(true);
  });
});
