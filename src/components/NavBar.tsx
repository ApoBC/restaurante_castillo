'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { RolUsuario } from '@/types/database'

const ENLACES: Record<RolUsuario, { href: string; label: string }[]> = {
  mesero: [{ href: '/mesero', label: 'Mesas' }],
  cocina: [{ href: '/cocina', label: 'Cocina' }],
  admin: [
    { href: '/admin', label: 'Resumen' },
    { href: '/admin/productos', label: 'Productos' },
    { href: '/admin/mesas', label: 'Mesas' },
    { href: '/admin/reservas', label: 'Reservas' },
    { href: '/admin/inventario', label: 'Inventario' },
    { href: '/admin/usuarios', label: 'Usuarios' },
    { href: '/admin/backup', label: 'Backup' },
  ],
  superadmin: [
    { href: '/admin', label: 'Resumen' },
    { href: '/admin/productos', label: 'Productos' },
    { href: '/admin/mesas', label: 'Mesas' },
    { href: '/admin/reservas', label: 'Reservas' },
    { href: '/admin/inventario', label: 'Inventario' },
    { href: '/admin/usuarios', label: 'Usuarios' },
    { href: '/admin/backup', label: 'Backup' },
  ],
}

export function NavBar({ nombre, rol }: { nombre: string; rol: RolUsuario }) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [menuAbierto, setMenuAbierto] = useState(false)

  async function cerrarSesion() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const enlaces = ENLACES[rol]

  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <span className="font-semibold">Restaurante Castillo</span>
          <nav className="hidden md:flex md:gap-4 md:text-sm">
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

        <div className="hidden items-center gap-3 text-sm text-neutral-500 md:flex">
          <span>
            {nombre} · {rol}
          </span>
          <button onClick={cerrarSesion} className="text-neutral-500 underline hover:text-neutral-900">
            Salir
          </button>
        </div>

        <button
          onClick={() => setMenuAbierto((v) => !v)}
          aria-label="Abrir menú"
          className="flex h-9 w-9 items-center justify-center rounded border border-neutral-200 text-neutral-600 md:hidden"
        >
          {menuAbierto ? '✕' : '☰'}
        </button>
      </div>

      {menuAbierto && (
        <div className="border-t border-neutral-200 px-4 py-3 md:hidden">
          <nav className="mb-3 flex flex-col gap-3 text-sm">
            {enlaces.map((enlace) => (
              <Link
                key={enlace.href}
                href={enlace.href}
                onClick={() => setMenuAbierto(false)}
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
          <div className="flex items-center justify-between border-t border-neutral-100 pt-3 text-sm text-neutral-500">
            <span>
              {nombre} · {rol}
            </span>
            <button onClick={cerrarSesion} className="underline hover:text-neutral-900">
              Salir
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
