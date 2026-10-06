#!/usr/bin/env node
// Verifica que Supabase esté bien conectado antes de confiar en el modo
// Supabase de la app. Uso: npm run supabase:check
//
// No depende de que exista .env.local todavía -- si no existe, o si faltan
// las variables, lo dice y sale en 0 (es el estado normal mientras no se
// haya creado el proyecto; ver docs/SUPABASE.md).

import { existsSync, readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function cargarEnvLocal() {
  if (!existsSync(".env.local")) return;
  for (const linea of readFileSync(".env.local", "utf8").split("\n")) {
    const l = linea.trim();
    if (!l || l.startsWith("#")) continue;
    const i = l.indexOf("=");
    if (i === -1) continue;
    const clave = l.slice(0, i).trim();
    const valor = l.slice(i + 1).trim();
    if (!(clave in process.env)) process.env[clave] = valor;
  }
}

cargarEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.log("Modo local: no hay NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local.");
  console.log("Es el estado normal hasta crear el proyecto de Supabase — ver docs/SUPABASE.md.");
  process.exit(0);
}

console.log(`Conectando a ${url} ...\n`);
const sb = createClient(url, key);

const TABLAS = [
  "inventory_ingredients",
  "recipes",
  "recipe_ingredients",
  "invoices",
  "invoice_items",
  "app_settings",
];

let huboError = false;

for (const tabla of TABLAS) {
  const { error } = await sb.from(tabla).select("*", { count: "exact", head: true });
  if (error) {
    huboError = true;
    console.error(`✗ tabla "${tabla}": ${error.message}`);
  } else {
    console.log(`✓ tabla "${tabla}" responde`);
  }
}

console.log();
if (huboError) {
  console.error("Faltan tablas o el schema no corrió bien. Repetí el paso 2 de docs/SUPABASE.md");
  console.error("(SQL Editor -> pegar supabase/schema.sql completo -> Run).");
  process.exitCode = 1;
} else {
  console.log("Conexión y tablas OK.");
  console.log("Falta a mano (no lo verifica este script):");
  console.log("  - Database -> Functions: crear_factura y guardar_receta existen (paso 2.6).");
  console.log("  - Authentication -> Users: al menos un usuario creado (paso 3).");
}
