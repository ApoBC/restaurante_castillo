// Tipos generados manualmente como placeholder inicial.
// Una vez creado el proyecto de Supabase, reemplazar este archivo con:
//   npx supabase gen types typescript --project-id <ID> > src/types/database.ts

export type RolUsuario = 'superadmin' | 'admin' | 'mesero' | 'cocina'
export type EstadoMesa = 'libre' | 'ocupada' | 'reservada'
export type TipoProducto = 'plato' | 'bebida' | 'postre' | 'menu_dia' | 'combo'
export type TipoPedido = 'mesa' | 'delivery'
export type EstadoPedido = 'nuevo' | 'en_preparacion' | 'listo' | 'pagado' | 'cancelado'
export type EstadoItem = 'nuevo' | 'en_preparacion' | 'listo'
export type MetodoPago = 'efectivo' | 'tarjeta'
export type EstadoReserva = 'pendiente' | 'confirmada' | 'cancelada' | 'completada'
export type TipoComprobante = 'boleta' | 'factura'
export type TipoMovimientoInventario = 'entrada' | 'salida' | 'ajuste'

export interface Database {
  public: {
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
    Tables: {
      usuarios: {
        Row: {
          id: string
          nombre: string
          rol: RolUsuario
          activo: boolean
          creado_por: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['usuarios']['Row']> & {
          id: string
          nombre: string
          rol: RolUsuario
        }
        Update: Partial<Database['public']['Tables']['usuarios']['Row']>
        Relationships: []
      }
      mesas: {
        Row: {
          id: number
          numero: number
          capacidad: number
          estado: EstadoMesa
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['mesas']['Row']> & { numero: number }
        Update: Partial<Database['public']['Tables']['mesas']['Row']>
        Relationships: []
      }
      productos: {
        Row: {
          id: number
          nombre: string
          descripcion: string | null
          precio: number
          tipo: TipoProducto
          disponible: boolean
          controla_inventario: boolean
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['productos']['Row']> & {
          nombre: string
          precio: number
          tipo: TipoProducto
        }
        Update: Partial<Database['public']['Tables']['productos']['Row']>
        Relationships: []
      }
      pedidos: {
        Row: {
          id: number
          tipo: TipoPedido
          mesa_id: number | null
          estado: EstadoPedido
          mesero_id: string
          subtotal: number
          descuento_pct: number
          total: number
          metodo_pago: MetodoPago | null
          notas: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['pedidos']['Row']> & {
          mesero_id: string
        }
        Update: Partial<Database['public']['Tables']['pedidos']['Row']>
        Relationships: []
      }
      pedido_items: {
        Row: {
          id: number
          pedido_id: number
          producto_id: number
          cantidad: number
          precio_unitario: number
          nota: string | null
          estado: EstadoItem
          iniciado_en: string | null
          listo_en: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['pedido_items']['Row']> & {
          pedido_id: number
          producto_id: number
          precio_unitario: number
        }
        Update: Partial<Database['public']['Tables']['pedido_items']['Row']>
        Relationships: []
      }
      reservas: {
        Row: {
          id: number
          nombre_cliente: string
          telefono: string
          fecha: string
          hora: string
          num_comensales: number
          mesa_id: number | null
          estado: EstadoReserva
          creado_por: string
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['reservas']['Row']> & {
          nombre_cliente: string
          telefono: string
          fecha: string
          hora: string
          num_comensales: number
          creado_por: string
        }
        Update: Partial<Database['public']['Tables']['reservas']['Row']>
        Relationships: []
      }
      inventario: {
        Row: {
          id: number
          producto_id: number
          stock_actual: number
          stock_minimo: number
          unidad: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['inventario']['Row']> & {
          producto_id: number
        }
        Update: Partial<Database['public']['Tables']['inventario']['Row']>
        Relationships: []
      }
      movimientos_inventario: {
        Row: {
          id: number
          producto_id: number
          tipo: TipoMovimientoInventario
          cantidad: number
          motivo: string | null
          usuario_id: string
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['movimientos_inventario']['Row']> & {
          producto_id: number
          tipo: TipoMovimientoInventario
          cantidad: number
          usuario_id: string
        }
        Update: Partial<Database['public']['Tables']['movimientos_inventario']['Row']>
        Relationships: []
      }
      comprobantes: {
        Row: {
          id: number
          pedido_id: number
          tipo: TipoComprobante
          serie: string | null
          correlativo: number | null
          subtotal: number
          igv: number
          total: number
          pdf_url: string | null
          enviado_sunat: boolean
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['comprobantes']['Row']> & {
          pedido_id: number
          subtotal: number
          total: number
        }
        Update: Partial<Database['public']['Tables']['comprobantes']['Row']>
        Relationships: []
      }
      auditoria: {
        Row: {
          id: number
          usuario_id: string | null
          accion: string
          entidad: string
          entidad_id: string | null
          detalle: Record<string, unknown> | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['auditoria']['Row']> & {
          accion: string
          entidad: string
        }
        Update: Partial<Database['public']['Tables']['auditoria']['Row']>
        Relationships: []
      }
    }
  }
}
