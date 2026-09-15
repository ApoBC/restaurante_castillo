import { getUsuarioActual } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function MeseroPage() {
  const usuario = await getUsuarioActual()
  if (!usuario) redirect('/login')

  return (
    <main className="flex-1 p-6">
      <h1 className="text-xl font-semibold">Hola, {usuario.nombre}</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Panel de mesero — selección de mesa y toma de pedidos (en construcción).
      </p>
    </main>
  )
}
