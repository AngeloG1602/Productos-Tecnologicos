// Tipos de la base de datos, en el formato de `supabase gen types typescript`.
// Mantener sincronizado con supabase/migrations. Si se instala la CLI de Supabase,
// este archivo se puede regenerar con:
//   npx supabase gen types typescript --project-id <id> > lib/supabase/tipos.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type PedidoEstado = "pendiente" | "confirmado" | "entregado" | "cancelado";

export type Database = {
  public: {
    Tables: {
      categorias: {
        Row: {
          id: string;
          nombre: string;
          slug: string;
          orden: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          slug: string;
          orden?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          slug?: string;
          orden?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      productos: {
        Row: {
          id: string;
          categoria_id: string | null;
          nombre: string;
          slug: string;
          descripcion: string;
          imagenes: string[];
          precio_venta: number;
          precio_anterior: number | null;
          stock: number;
          activo: boolean;
          destacado: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          categoria_id?: string | null;
          nombre: string;
          slug: string;
          descripcion?: string;
          imagenes?: string[];
          precio_venta: number;
          precio_anterior?: number | null;
          stock?: number;
          activo?: boolean;
          destacado?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          categoria_id?: string | null;
          nombre?: string;
          slug?: string;
          descripcion?: string;
          imagenes?: string[];
          precio_venta?: number;
          precio_anterior?: number | null;
          stock?: number;
          activo?: boolean;
          destacado?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "productos_categoria_id_fkey";
            columns: ["categoria_id"];
            isOneToOne: false;
            referencedRelation: "categorias";
            referencedColumns: ["id"];
          },
        ];
      };
      producto_costos: {
        Row: {
          producto_id: string;
          costo: number;
          margen_pct: number;
        };
        Insert: {
          producto_id: string;
          costo: number;
          margen_pct: number;
        };
        Update: {
          producto_id?: string;
          costo?: number;
          margen_pct?: number;
        };
        Relationships: [
          {
            foreignKeyName: "producto_costos_producto_id_fkey";
            columns: ["producto_id"];
            isOneToOne: true;
            referencedRelation: "productos";
            referencedColumns: ["id"];
          },
        ];
      };
      socios: {
        Row: {
          id: string;
          nombre: string;
          porcentaje: number;
          activo: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          porcentaje: number;
          activo?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          porcentaje?: number;
          activo?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      pedidos: {
        Row: {
          id: string;
          codigo: string;
          estado: PedidoEstado;
          cliente_nombre: string;
          cliente_ciudad: string;
          notas: string;
          total_venta: number;
          total_costo: number;
          ganancia: number;
          created_at: string;
          confirmado_at: string | null;
          entregado_at: string | null;
          cancelado_at: string | null;
        };
        // Los pedidos solo se crean y cambian de estado vía funciones.
        Insert: never;
        Update: never;
        Relationships: [];
      };
      pedido_items: {
        Row: {
          id: string;
          pedido_id: string;
          producto_id: string | null;
          nombre_snapshot: string;
          cantidad: number;
          precio_unitario: number;
          costo_unitario: number;
        };
        Insert: never;
        Update: never;
        Relationships: [
          {
            foreignKeyName: "pedido_items_pedido_id_fkey";
            columns: ["pedido_id"];
            isOneToOne: false;
            referencedRelation: "pedidos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pedido_items_producto_id_fkey";
            columns: ["producto_id"];
            isOneToOne: false;
            referencedRelation: "productos";
            referencedColumns: ["id"];
          },
        ];
      };
      pedido_reparto: {
        Row: {
          id: string;
          pedido_id: string;
          socio_id: string | null;
          socio_nombre: string;
          porcentaje: number;
          monto: number;
        };
        Insert: never;
        Update: never;
        Relationships: [
          {
            foreignKeyName: "pedido_reparto_pedido_id_fkey";
            columns: ["pedido_id"];
            isOneToOne: false;
            referencedRelation: "pedidos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pedido_reparto_socio_id_fkey";
            columns: ["socio_id"];
            isOneToOne: false;
            referencedRelation: "socios";
            referencedColumns: ["id"];
          },
        ];
      };
      configuracion: {
        Row: {
          id: number;
          whatsapp_numero: string | null;
          margen_default: number;
          redondeo: number;
          umbral_stock_bajo: number;
          texto_envio: string;
        };
        Insert: never;
        Update: {
          whatsapp_numero?: string | null;
          margen_default?: number;
          redondeo?: number;
          umbral_stock_bajo?: number;
          texto_envio?: string;
        };
        Relationships: [];
      };
      administradores: {
        Row: {
          user_id: string;
          nombre: string;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      es_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      configuracion_publica: {
        Args: Record<PropertyKey, never>;
        Returns: {
          whatsapp_numero: string | null;
          umbral_stock_bajo: number;
          texto_envio: string;
        }[];
      };
      crear_pedido: {
        Args: { p_items: Json; p_cliente: Json };
        Returns: Json;
      };
      confirmar_pedido: {
        Args: { p_pedido_id: string };
        Returns: Json;
      };
      cancelar_pedido: {
        Args: { p_pedido_id: string };
        Returns: Json;
      };
      entregar_pedido: {
        Args: { p_pedido_id: string };
        Returns: Json;
      };
      guardar_producto: {
        Args: {
          p_id: string;
          p_categoria_id: string | null;
          p_nombre: string;
          p_slug: string;
          p_descripcion: string | null;
          p_imagenes: string[] | null;
          p_costo: number;
          p_margen_pct: number;
          p_precio_venta: number;
          p_precio_anterior: number | null;
          p_stock: number;
          p_activo: boolean;
          p_destacado: boolean;
        };
        Returns: string;
      };
      duplicar_producto: {
        Args: { p_producto_id: string };
        Returns: string;
      };
    };
    Enums: {
      pedido_estado: PedidoEstado;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type Public = Database["public"];

/** Fila de una tabla: `Fila<"productos">`. */
export type Fila<T extends keyof Public["Tables"]> = Public["Tables"][T]["Row"];
