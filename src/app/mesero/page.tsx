'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { listarMesas } from '@/lib/queries/mesas'

const ESTILO_ESTADO: Record<string, string> = {
  libre: 'border-neutral-200 bg-white text-neutral-700',
  ocupada: 'border-red-300 bg-red-50 text-red-700',
  reservada: 'border-amber-300 bg-amber-50 text-amber-700',
}

export default function MeseroPage() {
  const { data: mesas, isLoading } = useQuery({ queryKey: ['mesas'], queryFn: listarMesas })

  return (
    <main className="flex-1 p-6">
      <h1 className="mb-4 text-xl font-semibold">Selecciona una mesa</h1>

      {isLoading && <p className="text-sm text-neutral-500">Cargando mesas...</p>}

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
        {mesas?.map((mesa) => (
          <Link
            key={mesa.id}
            href={`/mesero/mesa/${mesa.numero}`}
            className={`flex flex-col items-center justify-center rounded-lg border-2 p-6 text-center transition hover:opacity-80 ${ESTILO_ESTADO[mesa.estado]}`}
          >
            <span className="text-2xl font-bold">{mesa.numero}</span>
            <span className="mt-1 text-xs capitalize">{mesa.estado}</span>
          </Link>
        ))}
      </div>

      <div className="mt-6">
        <Link
          href="/mesero/delivery"
          className="inline-block rounded border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50"
        >
          + Nuevo pedido delivery
        </Link>
      </div>
    </main>
  )
}
