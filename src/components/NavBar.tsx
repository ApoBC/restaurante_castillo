'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { RolUsuario } from '@/types/database'

const ENLACES: Record<RolUsuario, { href: string; label: string }[]> = {
  mesero: [{ href: '/mesero', label: 'Mesas' }],
  cocina: [{ href: '/cocina', label: 'Cocina' }],
  admin: [
    { href: '/admin', label: 'Resumen' },
    { href: '/admin/mesas', label: 'Mesas' },
    { href: '/admin/reservas', label: 'Reservas' },
    { href: '/admin/inventario', label: 'Inventario' },
    { href: '/admin/usuarios', label: 'Usuarios' },
  ],
  superadmin: [
    { href: '/admin', label: 'Resumen' },
    { href: '/admin/mesas', label: 'Mesas' },
    { href: '/admin/reservas', label: 'Reservas' },
    { href: '/admin/inventario', label: 'Inventario' },
    { href: '/admin/usuarios', label: 'Usuarios' },
  ],
}

export function NavBar({ nombre, rol }: { nombre: string; rol: RolUsuario }) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  async function cerrarSesion() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const enlaces = ENLACES[rol]

  return (
    <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3">
      <div className="flex items-center gap-6">
        <span className="font-semibold">Restaurante Castillo</span>
        <nav className="flex gap-4 text-sm">
          {enlaces.map((enlace) => (
            <Link
              key={enlace.href}
              href={enlace.href}
              className={
                pathname === enlace.href
                  ? 'font-medium text-neutral-900'
                  : 'text-neutral-500 hover:text-neutral-900'
              }
            >
              {enlace.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-3 text-sm text-neutral-500">
        <span>
          {nombre} · {rol}
        </span>
        <button onClick={cerrarSesion} className="text-neutral-500 underline hover:text-neutral-900">
          Salir
        </button>
      </div>
    </header>
  )
}
