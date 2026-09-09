// Config de Supabase leída de env. Si falta cualquiera de las dos variables,
// la app corre en modo local (localStorage) y sin login.

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabaseConfigurado = Boolean(supabaseUrl && supabaseAnonKey);
