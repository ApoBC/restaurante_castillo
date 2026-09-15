import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'

export type InventarioConProducto = Database['public']['Tables']['inventario']['Row'] & {
  productos: { nombre: string; tipo: string } | null
}

export async function listarInventario() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('inventario')
    .select('*, productos(nombre, tipo)')
    .order('id')
    .returns<InventarioConProducto[]>()

  if (error) throw error
  return data
}

export async function ajustarStock(params: {
  inventarioId: number
  productoId: number
  stockActual: number
  nuevoStock: number
  usuarioId: string
}) {
  const supabase = createClient()
  const diferencia = params.nuevoStock - params.stockActual

  const { error: errorInventario } = await supabase
    .from('inventario')
    .update({ stock_actual: params.nuevoStock, updated_at: new Date().toISOString() })
    .eq('id', params.inventarioId)

  if (errorInventario) throw errorInventario

  const { error: errorMovimiento } = await supabase.from('movimientos_inventario').insert({
    producto_id: params.productoId,
    tipo: 'ajuste',
    cantidad: diferencia,
    motivo: 'Ajuste manual desde panel admin',
    usuario_id: params.usuarioId,
  })

  if (errorMovimiento) throw errorMovimiento
}
