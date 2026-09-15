'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { actualizarEstadoReserva, crearReserva, listarReservas } from '@/lib/queries/reservas'
import { listarMesas } from '@/lib/queries/mesas'
import { useUsuarioActual } from '@/lib/hooks/useUsuarioActual'
import type { EstadoReserva } from '@/types/database'

const ESTILO_ESTADO: Record<EstadoReserva, string> = {
  pendiente: 'text-amber-600',
  confirmada: 'text-green-600',
  cancelada: 'text-neutral-400 line-through',
  completada: 'text-neutral-500',
}

export default function ReservasPage() {
  const queryClient = useQueryClient()
  const { data: usuario } = useUsuarioActual()
  const { data: reservas, isLoading } = useQuery({ queryKey: ['reservas'], queryFn: listarReservas })
  const { data: mesas } = useQuery({ queryKey: ['mesas'], queryFn: listarMesas })

  const [nombreCliente, setNombreCliente] = useState('')
  const [telefono, setTelefono] = useState('')
  const [fecha, setFecha] = useState('')
  const [hora, setHora] = useState('')
  const [numComensales, setNumComensales] = useState('2')
  const [mesaId, setMesaId] = useState('')

  const crearMutation = useMutation({
    mutationFn: () =>
      crearReserva({
        nombreCliente,
        telefono,
        fecha,
        hora,
        numComensales: Number(numComensales),
        mesaId: mesaId ? Number(mesaId) : null,
        creadoPor: usuario!.id,
      }),
    onSuccess: () => {
      toast.success('Reserva creada')
      setNombreCliente('')
      setTelefono('')
      setFecha('')
      setHora('')
      setNumComensales('2')
      setMesaId('')
      queryClient.invalidateQueries({ queryKey: ['reservas'] })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const estadoMutation = useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: EstadoReserva }) =>
      actualizarEstadoReserva(id, estado),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reservas'] }),
  })

  return (
    <main className="flex-1 p-6">
      <h1 className="mb-4 text-xl font-semibold">Reservas</h1>
      <p className="mb-4 text-xs text-neutral-500">
        Solo se reciben por teléfono. Máximo 12 comensales por reserva, sin reservas parciales de
        mesa.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          crearMutation.mutate()
        }}
        className="mb-6 grid max-w-2xl grid-cols-2 gap-3 rounded-lg border border-neutral-200 bg-white p-4 sm:grid-cols-3"
      >
        <div className="col-span-2 sm:col-span-1">
          <label className="mb-1 block text-xs text-neutral-500">Nombre del cliente</label>
          <input
            required
            value={nombreCliente}
            onChange={(e) => setNombreCliente(e.target.value)}
            className="w-full rounded border border-neutral-300 px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-neutral-500">Teléfono</label>
          <input
            required
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            className="w-full rounded border border-neutral-300 px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-neutral-500">Fecha</label>
          <input
            required
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="w-full rounded border border-neutral-300 px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-neutral-500">Hora</label>
          <input
            required
            type="time"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            className="w-full rounded border border-neutral-300 px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-neutral-500">N° comensales (máx. 12)</label>
          <input
            required
            type="number"
            min={1}
            max={12}
            value={numComensales}
            onChange={(e) => setNumComensales(e.target.value)}
            className="w-full rounded border border-neutral-300 px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-neutral-500">Mesa (opcional)</label>
          <select
            value={mesaId}
            onChange={(e) => setMesaId(e.target.value)}
            className="w-full rounded border border-neutral-300 px-2 py-1 text-sm"
          >
            <option value="">Sin asignar</option>
            {mesas?.map((m) => (
              <option key={m.id} value={m.id}>
                Mesa {m.numero}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-2 sm:col-span-3">
          <button
            type="submit"
            disabled={crearMutation.isPending}
            className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
          >
            Crear reserva
          </button>
        </div>
      </form>

      {isLoading && <p className="text-sm text-neutral-500">Cargando...</p>}

      <table className="w-full max-w-3xl text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-left text-xs text-neutral-500">
            <th className="py-2">Cliente</th>
            <th className="py-2">Fecha / Hora</th>
            <th className="py-2">Comensales</th>
            <th className="py-2">Mesa</th>
            <th className="py-2">Estado</th>
            <th className="py-2"></th>
          </tr>
        </thead>
        <tbody>
          {reservas?.map((r) => (
            <tr key={r.id} className="border-b border-neutral-100">
              <td className="py-2">
                {r.nombre_cliente}
                <div className="text-xs text-neutral-400">{r.telefono}</div>
              </td>
              <td className="py-2">
                {r.fecha} {r.hora}
              </td>
              <td className="py-2">{r.num_comensales}</td>
              <td className="py-2">{r.mesas?.numero ?? '-'}</td>
              <td className={`py-2 capitalize ${ESTILO_ESTADO[r.estado]}`}>{r.estado}</td>
              <td className="py-2">
                {r.estado === 'pendiente' && (
                  <button
                    onClick={() => estadoMutation.mutate({ id: r.id, estado: 'confirmada' })}
                    className="mr-2 text-xs text-green-600 underline"
                  >
                    Confirmar
                  </button>
                )}
                {r.estado !== 'cancelada' && r.estado !== 'completada' && (
                  <button
                    onClick={() => estadoMutation.mutate({ id: r.id, estado: 'cancelada' })}
                    className="text-xs text-red-500 underline"
                  >
                    Cancelar
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  )
}
