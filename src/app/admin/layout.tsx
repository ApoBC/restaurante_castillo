import { redirect } from 'next/navigation'
import { getUsuarioActual } from '@/lib/auth'
import { NavBar } from '@/components/NavBar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const usuario = await getUsuarioActual()
  if (!usuario) redirect('/login')
  if (!['admin', 'superadmin'].includes(usuario.rol)) redirect('/login')

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <NavBar nombre={usuario.nombre} rol={usuario.rol} />
      {children}
    </div>
  )
}
