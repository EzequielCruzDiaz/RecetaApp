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
- Estado en el cliente vía React Context + `localStorage` ([`components/StoreProvider.tsx`](components/StoreProvider.tsx)). **Supabase se conecta al final** y reemplaza esta capa; cada cliente final tiene su propio proyecto de Supabase.
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
components/
  AppShell, StoreProvider, ui        Infra y primitivas visuales
  UnitSelector, IngredientRow, RecipeForm, RecetaCard, EscaladorReceta
  InventarioForm, InventarioList, ConfirmarFactura, Dashboard
```

## Sistema de diseño

Paleta en `lib/tokens.ts`. Regla: `accent` (rojo achiote `#B8471F`) se usa **solo** para lo que
requiere atención — costo por porción, stock bajo, alertas — nunca decorativo. Los números en
tablas y precios llevan `tabular-nums`. Las filas de listas se muestran como tarjetas.

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
| 8 | PWA (`manifest.json`, service worker, install prompt) | ⬜ |
| 9 | Supabase (schema + RLS + reemplazo de datos de ejemplo) | ⬜ |
