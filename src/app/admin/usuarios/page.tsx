'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { desactivarUsuario, listarUsuarios } from '@/lib/queries/usuarios'
import { useUsuarioActual } from '@/lib/hooks/useUsuarioActual'
import type { RolUsuario } from '@/types/database'

export default function UsuariosPage() {
  const queryClient = useQueryClient()
  const { data: usuarioActual } = useUsuarioActual()
  const { data: usuarios, isLoading } = useQuery({ queryKey: ['usuarios'], queryFn: listarUsuarios })

  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rol, setRol] = useState<RolUsuario>('mesero')

  const esSuperadmin = usuarioActual?.rol === 'superadmin'

  const crearMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, email, password, rol }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al crear usuario')
      return data
    },
    onSuccess: () => {
      toast.success('Usuario creado')
      setNombre('')
      setEmail('')
      setPassword('')
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const toggleActivoMutation = useMutation({
    mutationFn: ({ id, activo }: { id: string; activo: boolean }) => desactivarUsuario(id, activo),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['usuarios'] }),
  })

  if (!esSuperadmin) {
    return (
      <main className="flex-1 p-6">
        <h1 className="text-xl font-semibold">Usuarios</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Solo el superadmin puede crear y gestionar usuarios. Puedes ver esta sección pero no
          tienes permisos de edición.
        </p>
        <TablaUsuarios usuarios={usuarios} isLoading={isLoading} onToggle={undefined} />
      </main>
    )
  }

  return (
    <main className="flex-1 p-6">
      <h1 className="mb-4 text-xl font-semibold">Usuarios</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          crearMutation.mutate()
        }}
        className="mb-6 max-w-md rounded-lg border border-neutral-200 bg-white p-4"
      >
        <h2 className="mb-3 font-medium">Crear nuevo usuario</h2>

        <label className="mb-1 block text-xs font-medium text-neutral-500">Nombre</label>
        <input
          required
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="mb-3 w-full rounded border border-neutral-300 px-3 py-2 text-sm"
        />

        <label className="mb-1 block text-xs font-medium text-neutral-500">Correo</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-3 w-full rounded border border-neutral-300 px-3 py-2 text-sm"
        />

        <label className="mb-1 block text-xs font-medium text-neutral-500">
          Contraseña / PIN temporal
        </label>
        <input
          type="text"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-3 w-full rounded border border-neutral-300 px-3 py-2 text-sm"
        />

        <label className="mb-1 block text-xs font-medium text-neutral-500">Rol</label>
        <select
          value={rol}
          onChange={(e) => setRol(e.target.value as RolUsuario)}
          className="mb-4 w-full rounded border border-neutral-300 px-3 py-2 text-sm"
        >
          <option value="mesero">Mesero</option>
          <option value="cocina">Cocina</option>
          <option value="admin">Admin / Gerente</option>
          <option value="superadmin">Superadmin</option>
        </select>

        {(rol === 'admin' || rol === 'superadmin') && (
          <p className="mb-3 text-xs text-neutral-500">
            Este rol requiere verificación de correo — se enviará una invitación por email.
          </p>
        )}

        <button
          type="submit"
          disabled={crearMutation.isPending}
          className="w-full rounded bg-neutral-900 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {crearMutation.isPending ? 'Creando...' : 'Crear usuario'}
        </button>
      </form>

      <TablaUsuarios
        usuarios={usuarios}
        isLoading={isLoading}
        onToggle={(id, activo) => toggleActivoMutation.mutate({ id, activo })}
      />
    </main>
  )
}

function TablaUsuarios({
  usuarios,
  isLoading,
  onToggle,
}: {
  usuarios: { id: string; nombre: string; rol: string; activo: boolean }[] | undefined
  isLoading: boolean
  onToggle: ((id: string, activo: boolean) => void) | undefined
}) {
  if (isLoading) return <p className="text-sm text-neutral-500">Cargando...</p>

  return (
    <table className="w-full max-w-2xl text-sm">
      <thead>
        <tr className="border-b border-neutral-200 text-left text-xs text-neutral-500">
          <th className="py-2">Nombre</th>
          <th className="py-2">Rol</th>
          <th className="py-2">Estado</th>
          {onToggle && <th className="py-2"></th>}
        </tr>
      </thead>
      <tbody>
        {usuarios?.map((u) => (
          <tr key={u.id} className="border-b border-neutral-100">
            <td className="py-2">{u.nombre}</td>
            <td className="py-2 capitalize">{u.rol}</td>
            <td className="py-2">{u.activo ? 'Activo' : 'Inactivo'}</td>
            {onToggle && (
              <td className="py-2">
                <button
                  onClick={() => onToggle(u.id, !u.activo)}
                  className="text-xs text-neutral-500 underline"
                >
                  {u.activo ? 'Desactivar' : 'Activar'}
                </button>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
