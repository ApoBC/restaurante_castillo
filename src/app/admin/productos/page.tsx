'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  actualizarProducto,
  crearProducto,
  listarTodosLosProductos,
} from '@/lib/queries/productos'
import type { TipoProducto } from '@/types/database'

const TIPOS: { value: TipoProducto; label: string }[] = [
  { value: 'plato', label: 'Plato' },
  { value: 'bebida', label: 'Bebida' },
  { value: 'postre', label: 'Postre' },
  { value: 'menu_dia', label: 'Menú del día' },
  { value: 'combo', label: 'Combo' },
]

export default function ProductosPage() {
  const queryClient = useQueryClient()
  const { data: productos, isLoading } = useQuery({
    queryKey: ['productos-admin'],
    queryFn: listarTodosLosProductos,
  })

  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [precio, setPrecio] = useState('')
  const [tipo, setTipo] = useState<TipoProducto>('plato')
  const [controlaInventario, setControlaInventario] = useState(false)

  const crearMutation = useMutation({
    mutationFn: () =>
      crearProducto({
        nombre,
        descripcion: descripcion || null,
        precio: Number(precio),
        tipo,
        controlaInventario,
      }),
    onSuccess: () => {
      toast.success('Producto creado')
      setNombre('')
      setDescripcion('')
      setPrecio('')
      setTipo('plato')
      setControlaInventario(false)
      queryClient.invalidateQueries({ queryKey: ['productos-admin'] })
      queryClient.invalidateQueries({ queryKey: ['inventario'] })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const actualizarMutation = useMutation({
    mutationFn: ({ id, cambios }: { id: number; cambios: Record<string, unknown> }) =>
      actualizarProducto(id, cambios),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos-admin'] })
      queryClient.invalidateQueries({ queryKey: ['productos'] })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  return (
    <main className="flex-1 p-6">
      <h1 className="mb-4 text-xl font-semibold">Productos</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          crearMutation.mutate()
        }}
        className="mb-6 grid max-w-2xl grid-cols-2 gap-3 rounded-lg border border-neutral-200 bg-white p-4 sm:grid-cols-4"
      >
        <div className="col-span-2 sm:col-span-2">
          <label className="mb-1 block text-xs text-neutral-500">Nombre</label>
          <input
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full rounded border border-neutral-300 px-2 py-1 text-sm"
          />
        </div>
        <div className="col-span-2 sm:col-span-2">
          <label className="mb-1 block text-xs text-neutral-500">Descripción (opcional)</label>
          <input
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="w-full rounded border border-neutral-300 px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-neutral-500">Precio (S/)</label>
          <input
            required
            type="number"
            step="0.01"
            min="0"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            className="w-full rounded border border-neutral-300 px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-neutral-500">Tipo</label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoProducto)}
            className="w-full rounded border border-neutral-300 px-2 py-1 text-sm"
          >
            {TIPOS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-2 flex items-end gap-2 sm:col-span-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={controlaInventario}
              onChange={(e) => setControlaInventario(e.target.checked)}
            />
            Controla inventario (solo bebidas/postres)
          </label>
        </div>
        <div className="col-span-2 sm:col-span-4">
          <button
            type="submit"
            disabled={crearMutation.isPending}
            className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {crearMutation.isPending ? 'Creando...' : 'Crear producto'}
          </button>
        </div>
      </form>

      {isLoading && <p className="text-sm text-neutral-500">Cargando...</p>}

      <table className="w-full max-w-4xl text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-left text-xs text-neutral-500">
            <th className="py-2">Nombre</th>
            <th className="py-2">Tipo</th>
            <th className="py-2">Precio</th>
            <th className="py-2">Disponible</th>
            <th className="py-2">Inventario</th>
          </tr>
        </thead>
        <tbody>
          {productos?.map((p) => (
            <tr key={p.id} className="border-b border-neutral-100">
              <td className="py-2">
                {p.nombre}
                {p.descripcion && <div className="text-xs text-neutral-400">{p.descripcion}</div>}
              </td>
              <td className="py-2 capitalize">{p.tipo.replace('_', ' ')}</td>
              <td className="py-2">
                <input
                  type="number"
                  step="0.01"
                  defaultValue={p.precio}
                  onBlur={(e) => {
                    const nuevo = Number(e.target.value)
                    if (nuevo !== p.precio) {
                      actualizarMutation.mutate({ id: p.id, cambios: { precio: nuevo } })
                    }
                  }}
                  className="w-24 rounded border border-neutral-200 px-2 py-1 text-sm"
                />
              </td>
              <td className="py-2">
                <button
                  onClick={() =>
                    actualizarMutation.mutate({ id: p.id, cambios: { disponible: !p.disponible } })
                  }
                  className={`rounded px-2 py-1 text-xs ${
                    p.disponible ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-500'
                  }`}
                >
                  {p.disponible ? 'Sí' : 'No'}
                </button>
              </td>
              <td className="py-2 text-xs text-neutral-500">
                {p.controla_inventario ? 'Sí' : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  )
}
