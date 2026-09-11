// Tipos del schema (ver supabase/schema.sql). Escritos a mano porque todavía
// no hay proyecto. Cuando exista, se pueden regenerar con:
//   npx supabase gen types typescript --project-id <id> > lib/supabase/database.types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      inventory_ingredients: {
        Row: {
          id: string;
          nombre: string;
          categoria: string;
          unidad_compra: string;
          precio_compra: number;
          stock: number;
          stock_minimo: number;
          equivalencia: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          categoria: string;
          unidad_compra: string;
          precio_compra?: number;
          stock?: number;
          stock_minimo?: number;
          equivalencia?: Json | null;
          created_at?: string;
        };
        Update: {
          nombre?: string;
          categoria?: string;
          unidad_compra?: string;
          precio_compra?: number;
          stock?: number;
          stock_minimo?: number;
          equivalencia?: Json | null;
        };
        Relationships: [];
      };
      recipes: {
        Row: {
          id: string;
          nombre: string;
          categoria: string | null;
          porciones: number;
          unidad_rendimiento: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          categoria?: string | null;
          porciones?: number;
          unidad_rendimiento?: string;
          created_at?: string;
        };
        Update: {
          nombre?: string;
          categoria?: string | null;
          porciones?: number;
          unidad_rendimiento?: string;
        };
        Relationships: [];
      };
      recipe_ingredients: {
        Row: {
          id: string;
          recipe_id: string;
          ingredient_id: string | null;
          cantidad: number | null;
          unidad: string | null;
          al_gusto: boolean;
          orden: number;
        };
        Insert: {
          id?: string;
          recipe_id: string;
          ingredient_id?: string | null;
          cantidad?: number | null;
          unidad?: string | null;
          al_gusto?: boolean;
          orden?: number;
        };
        Update: {
          ingredient_id?: string | null;
          cantidad?: number | null;
          unidad?: string | null;
          al_gusto?: boolean;
          orden?: number;
        };
        Relationships: [];
      };
      invoices: {
        Row: {
          id: string;
          proveedor: string;
          fecha: string;
          rnc: string | null;
          ncf: string | null;
          itbis: number;
          total: number;
          aplicada_al_inventario: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          proveedor: string;
          fecha: string;
          rnc?: string | null;
          ncf?: string | null;
          itbis?: number;
          total?: number;
          aplicada_al_inventario?: boolean;
          created_at?: string;
        };
        Update: {
          proveedor?: string;
          fecha?: string;
          rnc?: string | null;
          ncf?: string | null;
          itbis?: number;
          total?: number;
        };
        Relationships: [];
      };
      invoice_items: {
        Row: {
          id: string;
          invoice_id: string;
          nombre: string;
          cantidad: number;
          unidad: string | null;
          precio_unitario: number;
          ingredient_id: string | null;
        };
        Insert: {
          id?: string;
          invoice_id: string;
          nombre: string;
          cantidad?: number;
          unidad?: string | null;
          precio_unitario?: number;
          ingredient_id?: string | null;
        };
        Update: {
          nombre?: string;
          cantidad?: number;
          unidad?: string | null;
          precio_unitario?: number;
          ingredient_id?: string | null;
        };
        Relationships: [];
      };
      app_settings: {
        Row: {
          id: number;
          nombre_negocio: string;
        };
        Insert: {
          id?: number;
          nombre_negocio?: string;
        };
        Update: {
          nombre_negocio?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      crear_factura: {
        Args: {
          p_proveedor: string;
          p_fecha: string;
          p_rnc: string | null;
          p_ncf: string | null;
          p_itbis: number;
          p_total: number;
          p_items: Json;
        };
        Returns: string;
      };
      guardar_receta: {
        Args: {
          p_id: string;
          p_nombre: string;
          p_categoria: string | null;
          p_porciones: number;
          p_unidad_rendimiento: string;
          p_ingredientes: Json;
        };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
