import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'

type ComprobanteRow = Database['public']['Tables']['comprobantes']['Row']

export type ComprobanteCompleto = ComprobanteRow & {
  pedidos: {
    id: number
    tipo: string
    metodo_pago: string | null
    descuento_pct: number
    created_at: string
    mesas: { numero: number } | null
    pedido_items: {
      cantidad: number
      precio_unitario: number
      nota: string | null
      productos: { nombre: string } | null
    }[]
  } | null
}

const SERIE_BOLETA = 'B001'

/**
 * Crea el comprobante para un pedido ya pagado. El correlativo usa el id
 * autoincremental de la tabla como numeración provisional mientras se
 * define el proveedor de integración con SUNAT (ver requerimientos_finales.md).
 */
export async function crearComprobante(params: { pedidoId: number; subtotal: number; total: number }) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('comprobantes')
    .insert({
      pedido_id: params.pedidoId,
      tipo: 'boleta',
      serie: SERIE_BOLETA,
      subtotal: params.subtotal,
      igv: 0,
      total: params.total,
    })
    .select()
    .single()

  if (error) throw error

  const { data: actualizado, error: errorUpdate } = await supabase
    .from('comprobantes')
    .update({ correlativo: data.id })
    .eq('id', data.id)
    .select()
    .single()

  if (errorUpdate) throw errorUpdate
  return actualizado
}

export async function obtenerComprobante(comprobanteId: number) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('comprobantes')
    .select(
      '*, pedidos(id, tipo, metodo_pago, descuento_pct, created_at, mesas(numero), pedido_items(cantidad, precio_unitario, nota, productos(nombre)))'
    )
    .eq('id', comprobanteId)
    .single()
    .returns<ComprobanteCompleto>()

  if (error) throw error
  return data
}
