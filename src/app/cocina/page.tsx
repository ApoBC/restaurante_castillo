import { getUsuarioActual } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function CocinaPage() {
  const usuario = await getUsuarioActual()
  if (!usuario) redirect('/login')

  return (
    <main className="flex-1 p-6">
      <h1 className="text-xl font-semibold">Cocina (KDS)</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Pantalla de pedidos en tiempo real, ordenados FIFO (en construcción).
      </p>
    </main>
  )
}
