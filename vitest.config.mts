import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    // Mismo alias que tsconfig.json (@/* -> ./*) para que los tests
    // importen igual que el resto del código.
    alias: {
      "@": dirname,
    },
  },
  test: {
    // Lógica pura (ver CLAUDE.md) — no hace falta un DOM simulado.
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules", ".next"],
  },
});
