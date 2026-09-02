"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import { INVENTARIO_DEMO, RECETAS_DEMO } from "../lib/recetas-iniciales";
import type {
  BorradorFactura,
  BorradorInventoryIngredient,
  Factura,
  InventoryIngredient,
  Receta,
} from "../lib/types";

const KEY = "recetapp:v1";

interface StoreShape {
  inventario: InventoryIngredient[];
  recetas: Receta[];
  facturas: Factura[];
}

// La app se entrega vacía. Los datos demo solo se usan en desarrollo local.
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

interface Store extends StoreShape {
  addIngrediente: (b: BorradorInventoryIngredient) => void;
  updateIngrediente: (id: string, patch: Partial<InventoryIngredient>) => void;
  removeIngrediente: (id: string) => void;
  addReceta: (r: Receta) => void;
  removeReceta: (id: string) => void;
  addFactura: (b: BorradorFactura) => void;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const state = useSyncExternalStore(subscribe, readSnapshot, () => SEED);

  const addIngrediente = useCallback((b: BorradorInventoryIngredient) => {
    writeSnapshot({ ...memo, inventario: [...memo.inventario, { ...b, id: nuevoId("ing") }] });
  }, []);

  const updateIngrediente = useCallback((id: string, patch: Partial<InventoryIngredient>) => {
    writeSnapshot({
      ...memo,
      inventario: memo.inventario.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    });
  }, []);

  const removeIngrediente = useCallback((id: string) => {
    writeSnapshot({ ...memo, inventario: memo.inventario.filter((i) => i.id !== id) });
  }, []);

  const addReceta = useCallback((r: Receta) => {
    writeSnapshot({ ...memo, recetas: [r, ...memo.recetas] });
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

export function useStore(): Store {
  const c = useContext(Ctx);
  if (!c) throw new Error("useStore debe usarse dentro de <StoreProvider>");
  return c;
}
