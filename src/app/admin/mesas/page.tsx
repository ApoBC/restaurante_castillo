'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { listarMesas } from '@/lib/queries/mesas'
import { createClient } from '@/lib/supabase/client'

export default function MesasPage() {
  const queryClient = useQueryClient()
  const { data: mesas, isLoading } = useQuery({ queryKey: ['mesas'], queryFn: listarMesas })
  const [nuevoNumero, setNuevoNumero] = useState('')
  const [nuevaCapacidad, setNuevaCapacidad] = useState('4')

  const actualizarMutation = useMutation({
    mutationFn: async ({ id, numero, capacidad }: { id: number; numero: number; capacidad: number }) => {
      const supabase = createClient()
      const { error } = await supabase.from('mesas').update({ numero, capacidad }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Mesa actualizada')
      queryClient.invalidateQueries({ queryKey: ['mesas'] })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const crearMutation = useMutation({
    mutationFn: async () => {
      const supabase = createClient()
      const { error } = await supabase
        .from('mesas')
        .insert({ numero: Number(nuevoNumero), capacidad: Number(nuevaCapacidad) })
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Mesa creada')
      setNuevoNumero('')
      queryClient.invalidateQueries({ queryKey: ['mesas'] })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  return (
    <main className="flex-1 p-6">
      <h1 className="mb-4 text-xl font-semibold">Mesas</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          crearMutation.mutate()
        }}
        className="mb-6 flex max-w-md items-end gap-2"
      >
        <div>
          <label className="mb-1 block text-xs text-neutral-500">Número</label>
          <input
            required
            type="number"
            value={nuevoNumero}
            onChange={(e) => setNuevoNumero(e.target.value)}
            className="w-24 rounded border border-neutral-300 px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-neutral-500">Capacidad</label>
          <input
            type="number"
            value={nuevaCapacidad}
            onChange={(e) => setNuevaCapacidad(e.target.value)}
            className="w-24 rounded border border-neutral-300 px-2 py-1 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={crearMutation.isPending}
          className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
        >
          Agregar mesa
        </button>
      </form>

      {isLoading && <p className="text-sm text-neutral-500">Cargando...</p>}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {mesas?.map((mesa) => (
          <div key={mesa.id} className="rounded border border-neutral-200 bg-white p-3">
            <label className="mb-1 block text-xs text-neutral-500">Número</label>
            <input
              type="number"
              defaultValue={mesa.numero}
              onBlur={(e) => {
                const numero = Number(e.target.value)
                if (numero !== mesa.numero) {
                  actualizarMutation.mutate({ id: mesa.id, numero, capacidad: mesa.capacidad })
                }
              }}
              className="mb-2 w-full rounded border border-neutral-200 px-2 py-1 text-sm"
            />
            <label className="mb-1 block text-xs text-neutral-500">Capacidad</label>
            <input
              type="number"
              defaultValue={mesa.capacidad}
              onBlur={(e) => {
                const capacidad = Number(e.target.value)
                if (capacidad !== mesa.capacidad) {
                  actualizarMutation.mutate({ id: mesa.id, numero: mesa.numero, capacidad })
                }
              }}
              className="w-full rounded border border-neutral-200 px-2 py-1 text-sm"
            />
            <p className="mt-2 text-xs capitalize text-neutral-500">{mesa.estado}</p>
          </div>
        ))}
      </div>
    </main>
  )
}
