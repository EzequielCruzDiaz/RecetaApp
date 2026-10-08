import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import type { InventoryIngredient, Receta, Unit } from "@/lib/types";
import { computeIngredientCost } from "@/lib/conversion";
import { unidadesDisponibles, UNIT_INFO, type UnidadOpcion } from "@/lib/units";
import { digitosOdometro, type Odometro } from "@/lib/odometer";

/* ------------------------------------------------------------------ */
/* Tipos                                                              */
/* ------------------------------------------------------------------ */

/** Ciclo de vida al quitar un ingrediente: tachar → colapsar → eliminar */
export type EstadoItem = "activo" | "tachando" | "saliendo";

export interface ItemEditor {
  ingredientId: string;
  cantidad: number;
  unidad: Unit;
  alGusto: boolean;
  estado: EstadoItem;
}

export interface EstadoEditor {
  nombre: string;
  porciones: number;
  limite: number;
  items: ItemEditor[];
  nuevoId: string | null;
  guardada: boolean;
}

export type Accion =
  | { tipo: "nombre"; valor: string }
  | { tipo: "porciones"; valor: number }
  | { tipo: "limite"; valor: number }
  | { tipo: "agregar"; ingredientId: string }
  | { tipo: "limpiarNuevo" }
  | { tipo: "incrementar"; ingredientId: string }
  | { tipo: "decrementar"; ingredientId: string }
  | { tipo: "cantidad"; ingredientId: string; valor: number }
  | { tipo: "unidad"; ingredientId: string; unidad: Unit }
  | { tipo: "alGusto"; ingredientId: string; valor: boolean }
  | { tipo: "tachar"; ingredientId: string }
  | { tipo: "colapsar"; ingredientId: string }
  | { tipo: "eliminar"; ingredientId: string }
  | { tipo: "guardada" };

/** Tiempos (ms) de la animación de quitar un ingrediente. */
export const TIEMPOS = { colapsar: 520, eliminar: 1050, limpiarNuevo: 700 } as const;

const r2 = (n: number) => Math.round(n * 100) / 100;

/* ------------------------------------------------------------------ */
/* Reducer (puro, sin React: se puede probar solo)                    */
/* ------------------------------------------------------------------ */

export function crearReducer(inventario: InventoryIngredient[]) {
  const buscar = (id: string) => inventario.find((i) => i.id === id);

  const editar = (
    estado: EstadoEditor,
    id: string,
    fn: (it: ItemEditor) => ItemEditor,
  ): EstadoEditor => ({
    ...estado,
    guardada: false,
    items: estado.items.map((it) => (it.ingredientId === id ? fn(it) : it)),
  });

  return function reducer(estado: EstadoEditor, a: Accion): EstadoEditor {
    switch (a.tipo) {
      case "nombre":
        return { ...estado, nombre: a.valor, guardada: false };
      case "porciones":
        return { ...estado, porciones: Math.max(1, Math.floor(a.valor)), guardada: false };
      case "limite":
        return { ...estado, limite: Math.max(0, a.valor) };

      case "agregar": {
        const ing = buscar(a.ingredientId);
        if (!ing || estado.items.some((it) => it.ingredientId === a.ingredientId)) return estado;
        const primera = unidadesDisponibles(ing)[0];
        const item: ItemEditor = {
          ingredientId: ing.id,
          unidad: primera.unidad,
          cantidad: primera.def,
          alGusto: false,
          estado: "activo",
        };
        return { ...estado, items: [...estado.items, item], nuevoId: ing.id, guardada: false };
      }
      case "limpiarNuevo":
        return { ...estado, nuevoId: null };

      case "incrementar":
        return editar(estado, a.ingredientId, (it) => ({
          ...it,
          cantidad: r2(it.cantidad + UNIT_INFO[it.unidad].step),
        }));
      case "decrementar":
        return editar(estado, a.ingredientId, (it) => ({
          ...it,
          cantidad: Math.max(0, r2(it.cantidad - UNIT_INFO[it.unidad].step)),
        }));
      case "cantidad":
        return editar(estado, a.ingredientId, (it) => ({
          ...it,
          cantidad: Number.isFinite(a.valor) ? Math.max(0, a.valor) : 0,
        }));

      case "unidad": {
        const ing = buscar(a.ingredientId);
        const opcion = ing && unidadesDisponibles(ing).find((o) => o.unidad === a.unidad);
        if (!opcion) return estado;
        return editar(estado, a.ingredientId, (it) => ({
          ...it,
          unidad: opcion.unidad,
          cantidad: opcion.def,
        }));
      }

      case "alGusto":
        return editar(estado, a.ingredientId, (it) => ({ ...it, alGusto: a.valor }));

      case "tachar":
        return editar(estado, a.ingredientId, (it) =>
          it.estado === "activo" ? { ...it, estado: "tachando" } : it,
        );
      case "colapsar":
        return editar(estado, a.ingredientId, (it) => ({ ...it, estado: "saliendo" }));
      case "eliminar":
        return {
          ...estado,
          items: estado.items.filter((it) => it.ingredientId !== a.ingredientId),
        };

      case "guardada":
        return { ...estado, guardada: true };
    }
  };
}

/* ------------------------------------------------------------------ */
/* Resumen (cálculos derivados)                                       */
/* ------------------------------------------------------------------ */

export interface ItemResumen extends ItemEditor {
  nombre: string;
  costo: number | null;
  error: string | null;
  opciones: UnidadOpcion[];
}

export interface Resumen {
  items: ItemResumen[];
  costoTotal: number;
  costoPorPorcion: number;
  superaLimite: boolean;
  odometroTotal: Odometro;
  odometroPorcion: Odometro;
  disponibles: InventoryIngredient[];
}

export function calcularResumen(estado: EstadoEditor, inventario: InventoryIngredient[]): Resumen {
  let costoTotal = 0;

  const items: ItemResumen[] = [];
  for (const it of estado.items) {
    const ing = inventario.find((i) => i.id === it.ingredientId);
    if (!ing) continue;

    let costo: number | null = null;
    let error: string | null = null;
    if (!it.alGusto) {
      try {
        costo = computeIngredientCost(ing, it.cantidad, it.unidad);
      } catch (e) {
        error = e instanceof Error ? e.message : "No se pudo calcular el costo.";
      }
    }
    // Un ingrediente que se está quitando deja de sumar desde que se tacha,
    // así el odómetro rueda mientras se ve la línea.
    if (costo !== null && it.estado === "activo") costoTotal += costo;

    items.push({ ...it, nombre: ing.nombre, costo, error, opciones: unidadesDisponibles(ing) });
  }

  const costoPorPorcion = costoTotal / Math.max(1, estado.porciones);

  return {
    items,
    costoTotal,
    costoPorPorcion,
    superaLimite: costoPorPorcion > estado.limite,
    odometroTotal: digitosOdometro(costoTotal),
    odometroPorcion: digitosOdometro(costoPorPorcion),
    disponibles: inventario.filter((i) => !estado.items.some((it) => it.ingredientId === i.id)),
  };
}

/** Convierte el estado del editor en una Receta lista para guardar. */
export function aReceta(estado: EstadoEditor, id: string): Receta {
  return {
    id,
    nombre: estado.nombre,
    porciones: estado.porciones,
    ingredientes: estado.items
      .filter((it) => it.estado === "activo")
      .map((it) => ({
        ingredientId: it.ingredientId,
        cantidad: it.alGusto ? null : it.cantidad,
        unidad: it.alGusto ? null : it.unidad,
        alGusto: it.alGusto,
      })),
  };
}

/* ------------------------------------------------------------------ */
/* Hook                                                               */
/* ------------------------------------------------------------------ */

export interface OpcionesEditor {
  inicial?: Partial<EstadoEditor>;
  onGuardar?: (receta: Receta) => void;
}

export function useRecetaEditor(inventario: InventoryIngredient[], opciones: OpcionesEditor = {}) {
  const reducer = useMemo(() => crearReducer(inventario), [inventario]);

  const [estado, dispatch] = useReducer(
    reducer,
    undefined,
    (): EstadoEditor => ({
      nombre: "",
      porciones: 4,
      limite: 35,
      items: [],
      nuevoId: null,
      guardada: false,
      ...opciones.inicial,
    }),
  );

  const resumen = useMemo(() => calcularResumen(estado, inventario), [estado, inventario]);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const despues = useCallback((fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);

  const agregar = useCallback(
    (ingredientId: string) => {
      dispatch({ tipo: "agregar", ingredientId });
      despues(() => dispatch({ tipo: "limpiarNuevo" }), TIEMPOS.limpiarNuevo);
    },
    [despues],
  );

  const quitar = useCallback(
    (ingredientId: string) => {
      dispatch({ tipo: "tachar", ingredientId });
      despues(() => dispatch({ tipo: "colapsar", ingredientId }), TIEMPOS.colapsar);
      despues(() => dispatch({ tipo: "eliminar", ingredientId }), TIEMPOS.eliminar);
    },
    [despues],
  );

  const guardar = useCallback(() => {
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now());
    opciones.onGuardar?.(aReceta(estado, id));
    dispatch({ tipo: "guardada" });
  }, [estado, opciones]);

  return {
    estado,
    resumen,
    acciones: {
      setNombre: (valor: string) => dispatch({ tipo: "nombre", valor }),
      setPorciones: (valor: number) => dispatch({ tipo: "porciones", valor }),
      setLimite: (valor: number) => dispatch({ tipo: "limite", valor }),
      agregar,
      quitar,
      incrementar: (ingredientId: string) => dispatch({ tipo: "incrementar", ingredientId }),
      decrementar: (ingredientId: string) => dispatch({ tipo: "decrementar", ingredientId }),
      setCantidad: (ingredientId: string, valor: number) => dispatch({ tipo: "cantidad", ingredientId, valor }),
      setUnidad: (ingredientId: string, unidad: Unit) => dispatch({ tipo: "unidad", ingredientId, unidad }),
      setAlGusto: (ingredientId: string, valor: boolean) => dispatch({ tipo: "alGusto", ingredientId, valor }),
      guardar,
    },
  };
}
