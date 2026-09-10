@AGENTS.md

# Arquitectura

- **Capas.** `app/` = routing y composición, sin lógica. `components/` = UI
  (primitivas en `ui.tsx` + componentes de pantalla). `lib/` = dominio, y **no
  importa `react`** (única excepción: `components/StoreProvider.tsx`, que por eso
  vive en `components/`). Si hay un cálculo o un `fetch` en `app/`, va mal
  ubicado.
- **Un solo seam de datos.** Los componentes nunca tocan Supabase ni
  `localStorage` directo: todo pasa por `useStore()` de `StoreProvider`, que tiene
  dos backends intercambiables (localStorage sin `NEXT_PUBLIC_SUPABASE_*`,
  Supabase con ellas). Se construye cada pantalla contra el store local y el
  schema (`supabase/schema.sql`) se congela al final.
- **Una instancia por cliente = configuración, no ramas.** El código es idéntico
  para todos. Lo que varía entra por env (`.env.local`), `lib/tokens.ts` (marca)
  o `app/icon.tsx` (logo). Nunca un `if (cliente === "…")`.
- **Imports con alias `@/`** (`@/lib/tokens`, no `../../lib/tokens`); `./` solo
  para hermanos del mismo directorio.
- **Idioma.** Términos del dominio en español (`receta`, `factura`, `inventario`,
  `ingrediente`, `costo`); el resto puede ser inglés. Nombres de componentes hoy
  mezclados — al tocar uno, alinéalo al español.
- **Diseño.** `accent` (`#B8471F`) solo para lo accionable o de alerta, nunca
  decorativo. Números con `tabular-nums`. Filas de listas = tarjetas. Paleta y
  tipografía desde `lib/tokens.ts`.
- **Tests** en lógica pura con casos borde: `lib/conversion.ts` y
  `lib/factura-ocr.ts::parseFacturaTexto`. La UI no.
- **Commits** por unidad de trabajo; no mezclar features sin relación.
