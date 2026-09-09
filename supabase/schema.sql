-- ============================================================
-- RecetApp — schema para UN proyecto de Supabase (uno por cliente).
-- Pegar completo en: Supabase Dashboard -> SQL Editor -> New query -> Run.
-- Es re-ejecutable (usa "if not exists" / "or replace" / "drop ... if exists").
-- ============================================================

-- ------------------------------------------------------------
-- Tablas
-- ------------------------------------------------------------

create table if not exists public.inventory_ingredients (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null,
  categoria     text not null check (categoria in ('peso','volumen','pieza')),
  unidad_compra text not null,
  precio_compra numeric not null default 0,
  stock         numeric not null default 0,
  stock_minimo  numeric not null default 0,
  equivalencia  jsonb,
  created_at    timestamptz not null default now()
);

create table if not exists public.recipes (
  id                 uuid primary key default gen_random_uuid(),
  nombre             text not null,
  categoria          text,
  porciones          numeric not null default 1,
  unidad_rendimiento text not null default 'porciones',
  created_at         timestamptz not null default now()
);

create table if not exists public.recipe_ingredients (
  id            uuid primary key default gen_random_uuid(),
  recipe_id     uuid not null references public.recipes(id) on delete cascade,
  ingredient_id uuid references public.inventory_ingredients(id) on delete restrict,
  cantidad      numeric,
  unidad        text,
  al_gusto      boolean not null default false,
  orden         int not null default 0
);
create index if not exists recipe_ingredients_recipe_id_idx
  on public.recipe_ingredients(recipe_id);

create table if not exists public.invoices (
  id                     uuid primary key default gen_random_uuid(),
  proveedor              text not null,
  fecha                  date not null,
  rnc                    text,
  ncf                    text,
  itbis                  numeric not null default 0,
  total                  numeric not null default 0,
  aplicada_al_inventario boolean not null default true,
  created_at             timestamptz not null default now()
);

create table if not exists public.invoice_items (
  id              uuid primary key default gen_random_uuid(),
  invoice_id      uuid not null references public.invoices(id) on delete cascade,
  nombre          text not null,
  cantidad        numeric not null default 0,
  unidad          text,
  precio_unitario numeric not null default 0,
  ingredient_id   uuid references public.inventory_ingredients(id) on delete set null
);
create index if not exists invoice_items_invoice_id_idx
  on public.invoice_items(invoice_id);

-- ------------------------------------------------------------
-- Row Level Security
-- Proyecto de un solo inquilino: cualquier usuario AUTENTICADO tiene acceso
-- total. Sin sesión (anon), nada. La aislación entre clientes es por proyecto.
-- ------------------------------------------------------------

alter table public.inventory_ingredients enable row level security;
alter table public.recipes               enable row level security;
alter table public.recipe_ingredients    enable row level security;
alter table public.invoices              enable row level security;
alter table public.invoice_items         enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'inventory_ingredients','recipes','recipe_ingredients','invoices','invoice_items'
  ] loop
    execute format('drop policy if exists %I_auth_all on public.%I', t, t);
    execute format(
      'create policy %I_auth_all on public.%I for all to authenticated using (true) with check (true)',
      t, t
    );
  end loop;
end $$;

-- ------------------------------------------------------------
-- RPC: crear factura + aplicar al stock (en una sola transacción)
-- ------------------------------------------------------------

create or replace function public.crear_factura(
  p_proveedor text,
  p_fecha     date,
  p_rnc       text,
  p_ncf       text,
  p_itbis     numeric,
  p_total     numeric,
  p_items     jsonb
) returns uuid
language plpgsql
security invoker
as $$
declare
  v_invoice_id uuid;
  v_item       jsonb;
  v_ing        uuid;
begin
  insert into public.invoices (proveedor, fecha, rnc, ncf, itbis, total, aplicada_al_inventario)
  values (
    p_proveedor, p_fecha, nullif(p_rnc,''), nullif(p_ncf,''),
    coalesce(p_itbis, 0), coalesce(p_total, 0), true
  )
  returning id into v_invoice_id;

  for v_item in select * from jsonb_array_elements(coalesce(p_items, '[]'::jsonb))
  loop
    v_ing := nullif(v_item->>'ingredient_id', '')::uuid;

    insert into public.invoice_items (invoice_id, nombre, cantidad, unidad, precio_unitario, ingredient_id)
    values (
      v_invoice_id,
      coalesce(v_item->>'nombre', ''),
      coalesce((v_item->>'cantidad')::numeric, 0),
      nullif(v_item->>'unidad', ''),
      coalesce((v_item->>'precio_unitario')::numeric, 0),
      v_ing
    );

    if v_ing is not null then
      update public.inventory_ingredients
         set stock = stock + coalesce((v_item->>'cantidad')::numeric, 0)
       where id = v_ing;
    end if;
  end loop;

  return v_invoice_id;
end $$;

-- ------------------------------------------------------------
-- RPC: guardar receta (insert o reemplazo) junto con sus ingredientes
-- ------------------------------------------------------------

create or replace function public.guardar_receta(
  p_id                 uuid,
  p_nombre             text,
  p_categoria          text,
  p_porciones          numeric,
  p_unidad_rendimiento text,
  p_ingredientes       jsonb
) returns void
language plpgsql
security invoker
as $$
begin
  insert into public.recipes (id, nombre, categoria, porciones, unidad_rendimiento)
  values (
    p_id, p_nombre, nullif(p_categoria, ''), coalesce(p_porciones, 1),
    coalesce(nullif(p_unidad_rendimiento, ''), 'porciones')
  )
  on conflict (id) do update
     set nombre             = excluded.nombre,
         categoria          = excluded.categoria,
         porciones          = excluded.porciones,
         unidad_rendimiento = excluded.unidad_rendimiento;

  delete from public.recipe_ingredients where recipe_id = p_id;

  insert into public.recipe_ingredients (recipe_id, ingredient_id, cantidad, unidad, al_gusto, orden)
  select
    p_id,
    nullif(items.elem->>'ingredient_id', '')::uuid,
    nullif(items.elem->>'cantidad', '')::numeric,
    nullif(items.elem->>'unidad', ''),
    coalesce((items.elem->>'al_gusto')::boolean, false),
    coalesce((items.elem->>'orden')::int, (items.ord - 1)::int)
  from jsonb_array_elements(coalesce(p_ingredientes, '[]'::jsonb))
       with ordinality as items(elem, ord);
end $$;

grant execute on function public.crear_factura(text, date, text, text, numeric, numeric, jsonb) to authenticated;
grant execute on function public.guardar_receta(uuid, text, text, numeric, text, jsonb) to authenticated;

-- ============================================================
-- Listo. Siguiente paso: crear al menos un usuario en
-- Authentication -> Users, y copiar URL + anon key a .env.local
-- (ver docs/SUPABASE.md).
-- ============================================================
