'use client'

import { useEffect, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { actualizarEstadoItem, listarPedidosActivosParaCocina } from '@/lib/queries/pedidos'
import { createClient } from '@/lib/supabase/client'
import { TemporizadorItem } from '@/components/cocina/TemporizadorItem'

const ESTILO_ITEM: Record<string, string> = {
  nuevo: 'border-red-400 bg-red-50',
  en_preparacion: 'border-amber-400 bg-amber-50',
  listo: 'border-green-400 bg-green-50',
}

function reproducirTimbre() {
  try {
    const AudioContextClass = window.AudioContext
    const ctx = new AudioContextClass()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.frequency.value = 880
    osc.connect(gain)
    gain.connect(ctx.destination)
    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    osc.start()
    osc.stop(ctx.currentTime + 0.3)
  } catch {
    // Silencioso si el navegador bloquea audio sin interacción previa
  }
}

export default function CocinaPage() {
  const queryClient = useQueryClient()
  const previoListosRef = useRef<Set<number>>(new Set())

  const { data: pedidos, isLoading } = useQuery({
    queryKey: ['pedidos-cocina'],
    queryFn: listarPedidosActivosParaCocina,
    refetchInterval: 15000,
  })

  useEffect(() => {
    const supabase = createClient()
    const canal = supabase
      .channel('cocina-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedido_items' }, () => {
        queryClient.invalidateQueries({ queryKey: ['pedidos-cocina'] })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, () => {
        queryClient.invalidateQueries({ queryKey: ['pedidos-cocina'] })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(canal)
    }
  }, [queryClient])

  useEffect(() => {
    if (!pedidos) return
    const listosActuales = new Set<number>()
    for (const pedido of pedidos) {
      for (const item of pedido.pedido_items ?? []) {
        if (item.estado === 'listo') listosActuales.add(item.id)
      }
    }
    const huboNuevoListo = [...listosActuales].some((id) => !previoListosRef.current.has(id))
    if (huboNuevoListo && previoListosRef.current.size > 0) {
      reproducirTimbre()
    }
    previoListosRef.current = listosActuales
  }, [pedidos])

  const mutation = useMutation({
    mutationFn: ({ itemId, estado }: { itemId: number; estado: 'en_preparacion' | 'listo' }) =>
      actualizarEstadoItem(itemId, estado),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pedidos-cocina'] }),
  })

  return (
    <main className="flex-1 p-4">
      <h1 className="mb-4 text-xl font-semibold">Cocina</h1>

      {isLoading && <p className="text-sm text-neutral-500">Cargando pedidos...</p>}
      {!isLoading && pedidos?.length === 0 && (
        <p className="text-sm text-neutral-400">No hay pedidos pendientes.</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pedidos?.map((pedido) => (
          <div key={pedido.id} className="rounded-lg border border-neutral-200 bg-white p-3">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-bold">
                {pedido.mesas ? `Mesa ${pedido.mesas.numero}` : 'Delivery'}
              </h2>
              <span className="text-xs text-neutral-400">
                {new Date(pedido.created_at).toLocaleTimeString('es-PE', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>

            <ul className="space-y-2">
              {pedido.pedido_items?.map((item) => (
                <li
                  key={item.id}
                  className={`rounded border-2 p-2 text-sm ${ESTILO_ITEM[item.estado]}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {item.cantidad}x {item.productos?.nombre}
                    </span>
                    <TemporizadorItem desde={item.iniciado_en ?? item.created_at} />
                  </div>
                  {item.nota && <p className="mt-1 text-xs italic text-neutral-600">{item.nota}</p>}

                  <div className="mt-2 flex gap-2">
                    {item.estado === 'nuevo' && (
                      <button
                        onClick={() => mutation.mutate({ itemId: item.id, estado: 'en_preparacion' })}
                        className="rounded bg-amber-500 px-2 py-1 text-xs font-medium text-white"
                      >
                        Empezar
                      </button>
                    )}
                    {item.estado === 'en_preparacion' && (
                      <button
                        onClick={() => mutation.mutate({ itemId: item.id, estado: 'listo' })}
                        className="rounded bg-green-600 px-2 py-1 text-xs font-medium text-white"
                      >
                        Listo
                      </button>
                    )}
                    {item.estado === 'listo' && (
                      <span className="text-xs font-medium text-green-700">✓ Listo</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </main>
  )
}
