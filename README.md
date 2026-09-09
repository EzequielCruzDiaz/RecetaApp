# RecetApp

App de **costeo de recetas e inventario** para negocios de food service dominicanos.
Cliente inicial: Slyking Group.

Permite:

- Mantener un **inventario** de ingredientes con precio de compra, stock y umbral de alerta.
- Armar **recetas** que referencian ese inventario y ver el costo total y el costo por porción/unidad de rendimiento.
- **Escalar** una receta a una producción objetivo (ej. "necesito 50 lb de arroz primavera") y ver cómo cambian cantidades y costo.
- Registrar **facturas** de proveedores (con carga por OCR más adelante) que actualizan el stock.

## Stack

- **Next.js 16** (App Router) + **TypeScript** + **React 19**
- Sin Tailwind — el sistema de diseño (paleta, tipografía, radios) vive en [`lib/tokens.ts`](lib/tokens.ts) y se aplica con estilos inline.
- Estado vía React Context ([`components/StoreProvider.tsx`](components/StoreProvider.tsx)) con **dos backends**: `localStorage` (por defecto, sin login) o **Supabase** (cuando hay `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`). Cada cliente final tiene su propio proyecto de Supabase — ver [`docs/SUPABASE.md`](docs/SUPABASE.md).
- Distribución: **PWA**, venta única, una instancia por cliente.
- **Se entrega vacía**: sin recetas ni ingredientes precargados. La carga inicial de cada cliente es un paso operativo manual al momento de la venta. Los datos demo (`lib/recetas-iniciales.ts`: pollo, cebolla, ajo + 1 receta) solo cargan con `NODE_ENV=development`.

## Correr en local

```bash
npm install
npm run dev       
npm run build     
npm run lint
```

## Estructura

```
app/
  page.tsx              Resumen / dashboard
  recetas/page.tsx      Lista de recetas + costeo + escalador + alta
  inventario/page.tsx   Inventario con stock y alertas
  facturas/page.tsx     Confirmar factura + historial
  layout.tsx            Shell con menú lateral (AppShell) + StoreProvider
lib/
  types.ts              Tipos del dominio
  conversion.ts         computeIngredientCost / computeRecipeCost / conversión de unidades
  factura-ocr.ts        parseFacturaTexto: extrae RNC/NCF/fecha/ITBIS/total/ítems del texto del OCR
  tokens.ts             Sistema de diseño (colores, tipografía, radios)
  recetas-iniciales.ts  Datos demo SOLO para dev (NODE_ENV=development)
  ocr-config.ts         Rutas de los assets de Tesseract self-hosteados
  supabase/             config, client, database.types, repo (capa de datos)
supabase/
  schema.sql            Tablas + RLS + funciones (pegar en el SQL Editor)
docs/
  SUPABASE.md           Paso a paso para conectar un proyecto nuevo
components/
  AppShell, StoreProvider, ui        Infra y primitivas visuales
  ServiceWorkerRegister, InstallButton   PWA
  UnitSelector, IngredientRow, RecipeForm, RecetaCard, EscaladorReceta
  InventarioForm, InventarioList, ConfirmarFactura, Dashboard
  EscanearFactura                    OCR de factura (tesseract.js)
app/
  manifest.ts, icon.tsx, apple-icon.tsx   Manifest e íconos (generados)
public/
  sw.js                 Service worker (cache offline del shell + assets de OCR)
  tesseract/            worker + core wasm + spa.traineddata.gz self-hosteados (~7.8 MB)
```

## Sistema de diseño

Paleta en `lib/tokens.ts`. Regla: `accent` (rojo achiote `#B8471F`) se usa **solo** para lo que
requiere atención — costo por porción, stock bajo, alertas — nunca decorativo. Los números en
tablas y precios llevan `tabular-nums`. Las filas de listas se muestran como tarjetas.

## Backend (Supabase)

- Sin `.env.local` → modo **local** (`localStorage`), sin login. Es el default de dev/demo.
- Con `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` → modo **Supabase**:
  la app exige login (`components/AuthGate.tsx`) y todo pasa por `lib/supabase/repo.ts`.
- **Un proyecto de Supabase por cliente.** Aislación por proyecto, no por fila:
  RLS = "cualquier usuario autenticado tiene acceso total".
- Facturas y recetas se guardan con funciones Postgres (`crear_factura`, `guardar_receta`)
  para que la escritura + el ajuste de stock sean atómicos.
- Instalación completa: [`docs/SUPABASE.md`](docs/SUPABASE.md). SQL: [`supabase/schema.sql`](supabase/schema.sql).

## PWA / offline

- `app/manifest.ts` genera el manifest; `app/icon.tsx` / `app/apple-icon.tsx` generan los íconos
  (placeholder "R" — reemplazar por el logo del cliente cuando lo haya).
- `public/sw.js` es un service worker hecho a mano (`next-pwa` no soporta Turbopack, el default de
  Next 16). Cachea el shell de la app y los assets de OCR; navegación = red primero con fallback offline.
- El OCR funciona **offline**: worker, core WASM y `spa.traineddata.gz` están self-hosteados en
  `public/tesseract/` (~7.8 MB, versionados en git a propósito para deploys por cliente). Si el peso
  del repo molesta, se pueden bajar en un script de postinstall en vez de commitearlos.
- El botón "Instalar app" (sidebar) aparece cuando el navegador dispara `beforeinstallprompt`
  (Android/Chrome desktop). En iOS la instalación es manual (Compartir → Agregar a inicio).
- El SW solo se registra en `NODE_ENV=production`.

## Estado del proyecto

| # | Tarea | Estado |
|---|-------|--------|
| — | Tipos, conversión, tokens, formularios base | ✅ |
| — | Ruteo con menú, capa de estado, salida de Tailwind, shells de pantallas | ✅ |
| 1 | App vacía al entregar + empty states + datos demo solo en dev | ✅ |
| 2 | `RecetaCard` con el diseño nuevo | ✅ (a re-verificar con datos reales) |
| 3 | `EscaladorReceta` conectado a `computeIngredientCost` | ✅ (a re-verificar con datos reales) |
| 4 | Pantalla de Inventario con stock y alertas | ✅ |
| 5 | Pantalla de Confirmar factura | ✅ (sin OCR todavía) |
| 6 | Dashboard / Resumen | ✅ |
| 7 | OCR de facturas dominicanas (`tesseract.js`) | ✅ escanear → parsear (RNC/NCF/fecha/ITBIS/total/ítems) → precargar formulario |
| 8 | PWA: manifest + íconos, service worker offline, install prompt, OCR self-hosteado | ✅ |
| 9 | Supabase: capa de datos + auth + `schema.sql` + guía de instalación | ✅ código listo (falta crear el proyecto — `docs/SUPABASE.md`) |
