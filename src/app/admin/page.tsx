import { getUsuarioActual } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function AdminPage() {
  const usuario = await getUsuarioActual()
  if (!usuario) redirect('/login')
  if (usuario.rol !== 'admin' && usuario.rol !== 'superadmin') redirect('/login')

  return (
    <main className="flex-1 p-6">
      <h1 className="text-xl font-semibold">Panel administrativo</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Bienvenido, {usuario.nombre} ({usuario.rol}). Reportes, mesas, inventario,
        reservas y usuarios (en construcción).
      </p>
    </main>
  )
}
