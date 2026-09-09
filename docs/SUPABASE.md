# Conectar RecetApp a Supabase

Se hace **una vez por cliente** (cada cliente tiene su propio proyecto de Supabase).
Mientras no haya `.env.local` con las variables, la app funciona en modo local
(`localStorage`, sin login) — útil para desarrollo y demos.

Tiempo estimado: ~15 min.

---

## 1. Crear el proyecto

1. Entrar a <https://supabase.com> → **Sign in** → **New project**.
2. Elegir la organización (o crear una gratis).
3. Completar:
   - **Name**: `recetapp-<cliente>` (ej. `recetapp-slyking`).
   - **Database Password**: generar una fuerte y **guardarla** (se usa para backups / acceso directo a Postgres).
   - **Region**: la más cercana al cliente (para RD: `East US (North Virginia)`).
   - **Plan**: Free alcanza para empezar; subir a Pro si el cliente necesita backups diarios y más límites.
4. **Create new project** y esperar 1–2 min a que termine de aprovisionar.

---

## 2. Crear las tablas, RLS y funciones

1. En el panel del proyecto: menú lateral → **SQL Editor** → **New query**.
2. Abrir el archivo [`supabase/schema.sql`](../supabase/schema.sql) del repo, copiar **todo** el contenido y pegarlo.
3. Click en **Run** (o `Ctrl/Cmd + Enter`).
4. Debería decir `Success. No rows returned`. Si algo falla, el error sale abajo — corregir y volver a correr (el script es re-ejecutable).
5. Verificar en **Table Editor** que aparezcan las 5 tablas:
   `inventory_ingredients`, `recipes`, `recipe_ingredients`, `invoices`, `invoice_items`.
6. Verificar en **Database → Functions** que estén `crear_factura` y `guardar_receta`.

> El script ya deja **RLS activado** en las 5 tablas con una política: *cualquier
> usuario autenticado tiene acceso total; sin sesión, nada*. No hace falta tocar
> nada más de seguridad para un proyecto de un solo cliente.

---

## 3. Configurar el login (Auth)

1. Menú lateral → **Authentication → Providers**.
2. **Email**: dejarlo **Enabled**.
3. **Authentication → Providers → Email → “Confirm email”**: **desactivar**
   (es una herramienta interna; no hace falta verificación por correo).
   - Alternativa: dejarlo activo y usar el link de confirmación que llega por mail.
4. Menú lateral → **Authentication → Users → Add user → Create new user**:
   - Email y contraseña del cliente / encargado.
   - Marcar **Auto Confirm User**.
   - Crear uno por cada persona que vaya a usar la app (todas tienen el mismo acceso).

---

## 4. Copiar las credenciales al código

1. Menú lateral → **Project Settings → API**.
2. Copiar:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Project API keys → `anon` `public`** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     *(NO usar la `service_role`: es secreta y no va nunca en el front.)*
3. En la raíz del repo, copiar `.env.example` a `.env.local` y completar:

   ```bash
   cp .env.example .env.local
   ```

   ```ini
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```

4. Si se despliega en Vercel / Netlify / etc.: cargar esas dos variables en el
   panel de **Environment Variables** del hosting (no subir `.env.local` al repo).

---

## 5. Probar

```bash
npm run build
npm start          # o el deploy
```

- Al abrir la app ahora pide **login** (pantalla de RecetApp con email + contraseña).
- Entrar con el usuario del paso 3.
- Inventario / Recetas / Facturas arrancan **vacíos** (los datos viven en Supabase).
- Probar: agregar un ingrediente → recargar la página → sigue ahí.
- Probar una factura con un ítem vinculado a un ingrediente → confirmar → el stock
  de ese ingrediente sube (lo hace la función `crear_factura` en una sola transacción).

Si algo de Supabase falla, aparece una franja roja arriba del contenido con el
mensaje de error.

---

## 6. Carga inicial de datos del cliente

Parte del onboarding, manual. Dos opciones:

- **Desde la app**: entrar y cargar el inventario y las recetas del cliente a mano.
- **Desde SQL**: `SQL Editor` → `insert into public.inventory_ingredients (...) values (...);`
  y `select public.guardar_receta('<uuid>', 'Nombre', 'Categoría', 6, 'porciones', '[...]'::jsonb);`

---

## Notas de operación

- **Backups**: en plan Free hay backups diarios con retención corta. Para producción
  real conviene Pro, o correr `pg_dump` periódico con la connection string de
  *Project Settings → Database*.
- **Rotar credenciales**: si se filtra la `anon key`, regenerarla en *Settings → API*
  y actualizar `.env.local` / el hosting. La `anon key` sola no da acceso a datos
  (RLS exige sesión), pero igual conviene tratarla con cuidado.
- **Regenerar tipos TS** (opcional, si se cambia el schema):
  ```bash
  npx supabase gen types typescript --project-id <ref> > lib/supabase/database.types.ts
  ```
- **Otro cliente**: repetir del paso 1 al 4 con un proyecto nuevo. El código no cambia.
