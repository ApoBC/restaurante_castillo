import { createClient } from '@/lib/supabase/client'
import type { ComprobanteCompleto } from '@/lib/queries/comprobantes'

/** Comprobantes (boletas/facturas) emitidos en un mes calendario, con el detalle del pedido. */
export async function listarComprobantesDelMes(anio: number, mes: number) {
  const supabase = createClient()

  const inicio = new Date(anio, mes - 1, 1)
  const fin = new Date(anio, mes, 1)

  const { data, error } = await supabase
    .from('comprobantes')
    .select(
      '*, pedidos(id, tipo, metodo_pago, descuento_pct, created_at, mesas(numero), pedido_items(cantidad, precio_unitario, nota, productos(nombre)))'
    )
    .gte('created_at', inicio.toISOString())
    .lt('created_at', fin.toISOString())
    .order('created_at', { ascending: true })
    .returns<ComprobanteCompleto[]>()

  if (error) throw error
  return data
}
