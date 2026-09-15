import { createClient } from '@/lib/supabase/client'

type PedidoResumen = {
  id: number
  total: number
  metodo_pago: string | null
  created_at: string
  pedido_items: {
    cantidad: number
    producto_id: number
    productos: { nombre: string } | null
  }[]
}

export async function obtenerResumenHoy() {
  const supabase = createClient()
  const inicioDia = new Date()
  inicioDia.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('pedidos')
    .select('id, total, metodo_pago, created_at, pedido_items(cantidad, producto_id, productos(nombre))')
    .eq('estado', 'pagado')
    .gte('created_at', inicioDia.toISOString())
    .returns<PedidoResumen[]>()

  if (error) throw error

  const totalVentas = data.reduce((acc, p) => acc + p.total, 0)
  const totalPedidos = data.length
  const porEfectivo = data.filter((p) => p.metodo_pago === 'efectivo').reduce((acc, p) => acc + p.total, 0)
  const porTarjeta = data.filter((p) => p.metodo_pago === 'tarjeta').reduce((acc, p) => acc + p.total, 0)

  const conteoProductos = new Map<string, number>()
  for (const pedido of data) {
    for (const item of pedido.pedido_items ?? []) {
      const nombre = item.productos?.nombre ?? 'Desconocido'
      conteoProductos.set(nombre, (conteoProductos.get(nombre) ?? 0) + item.cantidad)
    }
  }
  const topProductos = [...conteoProductos.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  return { totalVentas, totalPedidos, porEfectivo, porTarjeta, topProductos }
}
