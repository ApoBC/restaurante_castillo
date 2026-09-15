import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'

export type ItemNuevo = {
  producto_id: number
  cantidad: number
  precio_unitario: number
  nota?: string
}

type PedidoRow = Database['public']['Tables']['pedidos']['Row']
type PedidoItemRow = Database['public']['Tables']['pedido_items']['Row']

export type PedidoItemConProducto = PedidoItemRow & {
  productos: { nombre: string; tipo: string } | null
}

export type PedidoConItems = PedidoRow & {
  pedido_items: PedidoItemConProducto[]
}

export type PedidoConMesaEItems = PedidoRow & {
  mesas: { numero: number } | null
  pedido_items: PedidoItemConProducto[]
}

/** Pedido abierto (no pagado/cancelado) para una mesa, si existe. */
export async function obtenerPedidoAbiertoPorMesa(mesaId: number) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('pedidos')
    .select('*, pedido_items(*, productos(nombre, tipo))')
    .eq('mesa_id', mesaId)
    .in('estado', ['nuevo', 'en_preparacion', 'listo'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
    .returns<PedidoConItems>()

  if (error) throw error
  return data
}

export async function crearPedido(params: {
  mesaId: number | null
  tipo: 'mesa' | 'delivery'
  meseroId: string
}) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('pedidos')
    .insert({ mesa_id: params.mesaId, tipo: params.tipo, mesero_id: params.meseroId })
    .select()
    .single()

  if (error) throw error

  if (params.mesaId) {
    await supabase.from('mesas').update({ estado: 'ocupada' }).eq('id', params.mesaId)
  }

  return data
}

export async function agregarItems(pedidoId: number, items: ItemNuevo[]) {
  const supabase = createClient()
  const { error } = await supabase
    .from('pedido_items')
    .insert(items.map((item) => ({ ...item, pedido_id: pedidoId })))

  if (error) throw error
  await recalcularTotales(pedidoId)
}

export async function recalcularTotales(pedidoId: number) {
  const supabase = createClient()
  const { data: items, error: errorItems } = await supabase
    .from('pedido_items')
    .select('cantidad, precio_unitario')
    .eq('pedido_id', pedidoId)

  if (errorItems) throw errorItems

  const { data: pedido, error: errorPedido } = await supabase
    .from('pedidos')
    .select('descuento_pct')
    .eq('id', pedidoId)
    .single()

  if (errorPedido) throw errorPedido

  const subtotal = (items ?? []).reduce((acc, item) => acc + item.cantidad * item.precio_unitario, 0)
  const total = subtotal * (1 - (pedido?.descuento_pct ?? 0) / 100)

  const { error } = await supabase
    .from('pedidos')
    .update({ subtotal, total, updated_at: new Date().toISOString() })
    .eq('id', pedidoId)

  if (error) throw error
}

export async function aplicarDescuento(pedidoId: number, descuentoPct: number) {
  const supabase = createClient()
  const { error } = await supabase.from('pedidos').update({ descuento_pct: descuentoPct }).eq('id', pedidoId)
  if (error) throw error
  await recalcularTotales(pedidoId)
}

export async function marcarPagado(params: {
  pedidoId: number
  mesaId: number | null
  metodoPago: 'efectivo' | 'tarjeta'
}) {
  const supabase = createClient()
  const { error } = await supabase
    .from('pedidos')
    .update({ estado: 'pagado', metodo_pago: params.metodoPago, updated_at: new Date().toISOString() })
    .eq('id', params.pedidoId)

  if (error) throw error

  if (params.mesaId) {
    await supabase.from('mesas').update({ estado: 'libre' }).eq('id', params.mesaId)
  }
}

/** Pedidos activos para cocina (KDS), ordenados FIFO por antigüedad. */
export async function listarPedidosActivosParaCocina() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('pedidos')
    .select('*, mesas(numero), pedido_items(*, productos(nombre))')
    .in('estado', ['nuevo', 'en_preparacion', 'listo'])
    .order('created_at', { ascending: true })
    .returns<PedidoConMesaEItems[]>()

  if (error) throw error
  return data
}

export async function actualizarEstadoItem(itemId: number, estado: 'en_preparacion' | 'listo') {
  const supabase = createClient()
  const ahora = new Date().toISOString()
  const cambios: Partial<PedidoItemRow> =
    estado === 'en_preparacion'
      ? { estado, iniciado_en: ahora }
      : { estado, listo_en: ahora }

  const { error } = await supabase.from('pedido_items').update(cambios).eq('id', itemId)

  if (error) throw error
}
