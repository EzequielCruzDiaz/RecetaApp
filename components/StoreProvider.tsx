"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { INVENTARIO_DEMO, RECETAS_DEMO } from "../lib/recetas-iniciales";
import { supabaseConfigurado } from "../lib/supabase/config";
import * as repo from "../lib/supabase/repo";
import type {
  BorradorFactura,
  BorradorInventoryIngredient,
  Factura,
  InventoryIngredient,
  Receta,
} from "../lib/types";

interface StoreShape {
  inventario: InventoryIngredient[];
  recetas: Receta[];
  facturas: Factura[];
}

interface Store extends StoreShape {
  origen: "local" | "supabase";
  cargando: boolean;
  error: string | null;
  recargar: () => void;
  addIngrediente: (b: BorradorInventoryIngredient) => void;
  updateIngrediente: (id: string, patch: Partial<InventoryIngredient>) => void;
  removeIngrediente: (id: string) => void;
  addReceta: (r: Receta) => void;
  removeReceta: (id: string) => void;
  addFactura: (b: BorradorFactura) => void;
}

const Ctx = createContext<Store | null>(null);

export function useStore(): Store {
  const c = useContext(Ctx);
  if (!c) throw new Error("useStore debe usarse dentro de <StoreProvider>");
  return c;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  return supabaseConfigurado ? (
    <SupabaseStore>{children}</SupabaseStore>
  ) : (
    <LocalStore>{children}</LocalStore>
  );
}

// ── Backend local (localStorage) ─────────────────────────────

const KEY = "recetapp:v1";

const SEED: StoreShape =
  process.env.NODE_ENV === "development"
    ? { inventario: INVENTARIO_DEMO, recetas: RECETAS_DEMO, facturas: [] }
    : { inventario: [], recetas: [], facturas: [] };

let memo: StoreShape = SEED;
let loaded = false;
const listeners = new Set<() => void>();

function readSnapshot(): StoreShape {
  if (!loaded) {
    loaded = true;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) memo = JSON.parse(raw) as StoreShape;
    } catch {
      /* localStorage no disponible */
    }
  }
  return memo;
}

function writeSnapshot(next: StoreShape) {
  memo = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* localStorage no disponible */
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

function nuevoId(prefijo: string): string {
  const rnd =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return `${prefijo}-${rnd}`;
}

function LocalStore({ children }: { children: React.ReactNode }) {
  const state = useSyncExternalStore(subscribe, readSnapshot, () => SEED);

  const addIngrediente = useCallback((b: BorradorInventoryIngredient) => {
    writeSnapshot({ ...memo, inventario: [...memo.inventario, { ...b, id: nuevoId("ing") }] });
  }, []);

  const updateIngrediente = useCallback(
    (id: string, patch: Partial<InventoryIngredient>) => {
      writeSnapshot({
        ...memo,
        inventario: memo.inventario.map((i) => (i.id === id ? { ...i, ...patch } : i)),
      });
    },
    [],
  );

  const removeIngrediente = useCallback((id: string) => {
    writeSnapshot({ ...memo, inventario: memo.inventario.filter((i) => i.id !== id) });
  }, []);

  const addReceta = useCallback((r: Receta) => {
    writeSnapshot({ ...memo, recetas: [r, ...memo.recetas.filter((x) => x.id !== r.id)] });
  }, []);

  const removeReceta = useCallback((id: string) => {
    writeSnapshot({ ...memo, recetas: memo.recetas.filter((r) => r.id !== id) });
  }, []);

  const addFactura = useCallback((b: BorradorFactura) => {
    const factura: Factura = { ...b, id: nuevoId("fac"), aplicadaAlInventario: true };
    const inventario = memo.inventario.map((ing) => {
      const aporte = b.items
        .filter((it) => it.ingredientId === ing.id)
        .reduce((acc, it) => acc + it.cantidad, 0);
      return aporte ? { ...ing, stock: ing.stock + aporte } : ing;
    });
    writeSnapshot({ ...memo, facturas: [factura, ...memo.facturas], inventario });
  }, []);

  const value = useMemo<Store>(
    () => ({
      ...state,
      origen: "local",
      cargando: false,
      error: null,
      recargar: () => {},
      addIngrediente,
      updateIngrediente,
      removeIngrediente,
      addReceta,
      removeReceta,
      addFactura,
    }),
    [state, addIngrediente, updateIngrediente, removeIngrediente, addReceta, removeReceta, addFactura],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// ── Backend Supabase ─────────────────────────────────────────

function SupabaseStore({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<StoreShape>({ inventario: [], recetas: [], facturas: [] });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // No toca estado de forma síncrona: es seguro llamarla desde un efecto.
  const cargarDatos = useCallback(async () => {
    try {
      const [inventario, recetas, facturas] = await Promise.all([
        repo.fetchInventario(),
        repo.fetchRecetas(),
        repo.fetchFacturas(),
      ]);
      setState({ inventario, recetas, facturas });
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar desde Supabase");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    // Carga inicial desde un store externo (Supabase). El setState ocurre
    // recién después del await; la regla no distingue ese caso.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void cargarDatos();
  }, [cargarDatos]);

  const recargar = useCallback(() => {
    setCargando(true);
    void cargarDatos();
  }, [cargarDatos]);

  const run = useCallback(
    async (fn: () => Promise<unknown>) => {
      try {
        await fn();
        await cargarDatos();
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo guardar el cambio");
      }
    },
    [cargarDatos],
  );

  const value = useMemo<Store>(
    () => ({
      ...state,
      origen: "supabase",
      cargando,
      error,
      recargar,
      addIngrediente: (b) => void run(() => repo.crearIngrediente(b)),
      updateIngrediente: (id, patch) => void run(() => repo.actualizarIngrediente(id, patch)),
      removeIngrediente: (id) => void run(() => repo.borrarIngrediente(id)),
      addReceta: (r) => void run(() => repo.guardarReceta(r)),
      removeReceta: (id) => void run(() => repo.borrarReceta(id)),
      addFactura: (b) => void run(() => repo.crearFactura(b)),
    }),
    [state, cargando, error, recargar, run],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

