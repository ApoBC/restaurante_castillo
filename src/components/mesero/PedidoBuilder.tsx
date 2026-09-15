'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { listarProductosDisponibles } from '@/lib/queries/productos'
import { obtenerMesaPorNumero } from '@/lib/queries/mesas'
import {
  agregarItems,
  aplicarDescuento,
  crearPedido,
  marcarPagado,
  obtenerPedidoAbiertoPorMesa,
  type ItemNuevo,
} from '@/lib/queries/pedidos'
import { useUsuarioActual } from '@/lib/hooks/useUsuarioActual'
import { crearComprobante } from '@/lib/queries/comprobantes'

const DESCUENTO_MAXIMO_MESERO = 10

type LineaCarrito = ItemNuevo & { nombre: string; clave: string }

export function PedidoBuilder({ mesaNumero }: { mesaNumero?: number }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: usuario } = useUsuarioActual()

  const [carrito, setCarrito] = useState<LineaCarrito[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [mostrarCobro, setMostrarCobro] = useState(false)
  const [numeroDivision, setNumeroDivision] = useState(1)

  const { data: mesa } = useQuery({
    queryKey: ['mesa', mesaNumero],
    queryFn: () => obtenerMesaPorNumero(mesaNumero!),
    enabled: !!mesaNumero,
  })

  const { data: productos } = useQuery({
    queryKey: ['productos'],
    queryFn: listarProductosDisponibles,
  })

  const { data: pedidoAbierto } = useQuery({
    queryKey: ['pedido-abierto', mesa?.id],
    queryFn: () => obtenerPedidoAbiertoPorMesa(mesa!.id),
    enabled: !!mesa?.id,
  })

  const productosFiltrados = useMemo(() => {
    if (!productos) return []
    if (!busqueda.trim()) return productos
    const q = busqueda.toLowerCase()
    return productos.filter((p) => p.nombre.toLowerCase().includes(q))
  }, [productos, busqueda])

  function agregarAlCarrito(producto: { id: number; nombre: string; precio: number }) {
    setCarrito((prev) => {
      const existente = prev.find((l) => l.producto_id === producto.id && !l.nota)
      if (existente) {
        return prev.map((l) =>
          l === existente ? { ...l, cantidad: l.cantidad + 1 } : l
        )
      }
      return [
        ...prev,
        {
          clave: `${producto.id}-${Date.now()}`,
          producto_id: producto.id,
          nombre: producto.nombre,
          cantidad: 1,
          precio_unitario: producto.precio,
        },
      ]
    })
  }

  function actualizarCantidad(clave: string, delta: number) {
    setCarrito((prev) =>
      prev
        .map((l) => (l.clave === clave ? { ...l, cantidad: l.cantidad + delta } : l))
        .filter((l) => l.cantidad > 0)
    )
  }

  function actualizarNota(clave: string, nota: string) {
    setCarrito((prev) => prev.map((l) => (l.clave === clave ? { ...l, nota } : l)))
  }

  const enviarPedidoMutation = useMutation({
    mutationFn: async () => {
      if (!usuario) throw new Error('No se pudo identificar al mesero')
      if (carrito.length === 0) throw new Error('Agrega al menos un producto')

      let pedidoId = pedidoAbierto?.id

      if (!pedidoId) {
        const nuevoPedido = await crearPedido({
          mesaId: mesa?.id ?? null,
          tipo: mesa ? 'mesa' : 'delivery',
          meseroId: usuario.id,
        })
        pedidoId = nuevoPedido.id
      }

      await agregarItems(
        pedidoId,
        carrito.map(({ producto_id, cantidad, precio_unitario, nota }) => ({
          producto_id,
          cantidad,
          precio_unitario,
          nota,
        }))
      )

      return pedidoId
    },
    onSuccess: () => {
      toast.success('Pedido enviado a cocina')
      setCarrito([])
      queryClient.invalidateQueries({ queryKey: ['pedido-abierto'] })
      queryClient.invalidateQueries({ queryKey: ['mesas'] })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const cobrarMutation = useMutation({
    mutationFn: async (metodoPago: 'efectivo' | 'tarjeta') => {
      if (!pedidoAbierto) throw new Error('No hay pedido activo')
      await marcarPagado({ pedidoId: pedidoAbierto.id, mesaId: mesa?.id ?? null, metodoPago })
      return crearComprobante({
        pedidoId: pedidoAbierto.id,
        subtotal: pedidoAbierto.subtotal,
        total: pedidoAbierto.total,
      })
    },
    onSuccess: (comprobante) => {
      toast.success('Pago registrado')
      setMostrarCobro(false)
      queryClient.invalidateQueries({ queryKey: ['pedido-abierto'] })
      queryClient.invalidateQueries({ queryKey: ['mesas'] })
      window.open(`/recibo/${comprobante.id}`, '_blank')
      router.push('/mesero')
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const descuentoMutation = useMutation({
    mutationFn: async (pct: number) => {
      if (!pedidoAbierto) return
      await aplicarDescuento(pedidoAbierto.id, pct)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pedido-abierto'] }),
  })

  const totalCarritoNuevo = carrito.reduce((acc, l) => acc + l.cantidad * l.precio_unitario, 0)
  const totalPedidoExistente = pedidoAbierto?.total ?? 0

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:flex-row">
      {/* Catálogo */}
      <section className="flex-1">
        <h1 className="mb-2 text-lg font-semibold">
          {mesa ? `Mesa ${mesa.numero}` : 'Pedido delivery'}
        </h1>
        <input
          type="text"
          placeholder="Buscar plato..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="mb-3 w-full rounded border border-neutral-300 px-3 py-2 text-sm"
        />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {productosFiltrados.map((producto) => (
            <button
              key={producto.id}
              onClick={() => agregarAlCarrito(producto)}
              className="rounded border border-neutral-200 bg-white p-3 text-left text-sm hover:border-neutral-400"
            >
              <div className="font-medium">{producto.nombre}</div>
              <div className="text-xs capitalize text-neutral-500">{producto.tipo.replace('_', ' ')}</div>
              <div className="mt-1 font-semibold">S/ {producto.precio.toFixed(2)}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Carrito / pedido actual */}
      <aside className="w-full rounded-lg border border-neutral-200 bg-white p-4 md:w-80">
        <h2 className="mb-2 font-semibold">Pedido actual</h2>

        {pedidoAbierto && pedidoAbierto.pedido_items?.length > 0 && (
          <div className="mb-3 border-b border-neutral-100 pb-3">
            <p className="mb-1 text-xs font-medium text-neutral-500">Ya enviado a cocina</p>
            {pedidoAbierto.pedido_items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>
                  {item.cantidad}x {item.productos?.nombre}
                </span>
                <span className="capitalize text-neutral-500">{item.estado}</span>
              </div>
            ))}
            <div className="mt-1 text-sm font-semibold">Total: S/ {totalPedidoExistente.toFixed(2)}</div>
          </div>
        )}

        {carrito.length === 0 ? (
          <p className="text-sm text-neutral-400">Toca un producto para agregarlo</p>
        ) : (
          <ul className="space-y-2">
            {carrito.map((linea) => (
              <li key={linea.clave} className="border-b border-neutral-100 pb-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>{linea.nombre}</span>
                  <span>S/ {(linea.cantidad * linea.precio_unitario).toFixed(2)}</span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <button
                    onClick={() => actualizarCantidad(linea.clave, -1)}
                    className="h-6 w-6 rounded border border-neutral-300 text-xs"
                  >
                    -
                  </button>
                  <span>{linea.cantidad}</span>
                  <button
                    onClick={() => actualizarCantidad(linea.clave, 1)}
                    className="h-6 w-6 rounded border border-neutral-300 text-xs"
                  >
                    +
                  </button>
                  <input
                    type="text"
                    placeholder="Nota (opcional)"
                    value={linea.nota ?? ''}
                    onChange={(e) => actualizarNota(linea.clave, e.target.value)}
                    className="flex-1 rounded border border-neutral-200 px-2 py-1 text-xs"
                  />
                </div>
              </li>
            ))}
          </ul>
        )}

        {carrito.length > 0 && (
          <div className="mt-3 flex justify-between text-sm font-semibold">
            <span>Subtotal nuevo</span>
            <span>S/ {totalCarritoNuevo.toFixed(2)}</span>
          </div>
        )}

        <button
          onClick={() => enviarPedidoMutation.mutate()}
          disabled={carrito.length === 0 || enviarPedidoMutation.isPending}
          className="mt-3 w-full rounded bg-neutral-900 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          {enviarPedidoMutation.isPending ? 'Enviando...' : 'Enviar a cocina'}
        </button>

        {pedidoAbierto && (
          <>
            <div className="mt-4 border-t border-neutral-100 pt-3">
              <label className="mb-1 block text-xs font-medium text-neutral-500">
                Descuento (máx {DESCUENTO_MAXIMO_MESERO}%)
              </label>
              <input
                type="number"
                min={0}
                max={DESCUENTO_MAXIMO_MESERO}
                defaultValue={pedidoAbierto.descuento_pct}
                onBlur={(e) => {
                  const pct = Math.min(Number(e.target.value) || 0, DESCUENTO_MAXIMO_MESERO)
                  descuentoMutation.mutate(pct)
                }}
                className="w-full rounded border border-neutral-300 px-2 py-1 text-sm"
              />
            </div>

            <button
              onClick={() => setMostrarCobro(true)}
              className="mt-3 w-full rounded border border-neutral-900 py-2 text-sm font-medium hover:bg-neutral-50"
            >
              Cobrar (S/ {totalPedidoExistente.toFixed(2)})
            </button>
          </>
        )}

        {mostrarCobro && pedidoAbierto && (
          <div className="mt-3 rounded border border-neutral-200 bg-neutral-50 p-3">
            <label className="mb-1 block text-xs font-medium text-neutral-500">
              Dividir cuenta entre
            </label>
            <input
              type="number"
              min={1}
              value={numeroDivision}
              onChange={(e) => setNumeroDivision(Math.max(1, Number(e.target.value) || 1))}
              className="mb-2 w-full rounded border border-neutral-300 px-2 py-1 text-sm"
            />
            {numeroDivision > 1 && (
              <p className="mb-2 text-xs text-neutral-500">
                {numeroDivision} pagos de S/ {(totalPedidoExistente / numeroDivision).toFixed(2)} c/u
                (detalle completo del pedido se mantiene en el comprobante)
              </p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => cobrarMutation.mutate('efectivo')}
                disabled={cobrarMutation.isPending}
                className="flex-1 rounded bg-neutral-900 py-2 text-xs font-medium text-white"
              >
                Efectivo
              </button>
              <button
                onClick={() => cobrarMutation.mutate('tarjeta')}
                disabled={cobrarMutation.isPending}
                className="flex-1 rounded border border-neutral-900 py-2 text-xs font-medium"
              >
                Tarjeta
              </button>
            </div>
          </div>
        )}
      </aside>
    </main>
  )
}
