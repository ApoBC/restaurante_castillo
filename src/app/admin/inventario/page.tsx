'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ajustarStock, listarInventario } from '@/lib/queries/inventario'
import { useUsuarioActual } from '@/lib/hooks/useUsuarioActual'

export default function InventarioPage() {
  const queryClient = useQueryClient()
  const { data: usuario } = useUsuarioActual()
  const { data: inventario, isLoading } = useQuery({
    queryKey: ['inventario'],
    queryFn: listarInventario,
  })

  const ajusteMutation = useMutation({
    mutationFn: ajustarStock,
    onSuccess: () => {
      toast.success('Stock actualizado')
      queryClient.invalidateQueries({ queryKey: ['inventario'] })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  return (
    <main className="flex-1 p-6">
      <h1 className="mb-1 text-xl font-semibold">Inventario</h1>
      <p className="mb-4 text-xs text-neutral-500">
        Solo bebidas y postres del día. El ajuste se registra como recuento físico manual.
      </p>

      {isLoading && <p className="text-sm text-neutral-500">Cargando...</p>}
      {!isLoading && inventario?.length === 0 && (
        <p className="text-sm text-neutral-400">
          Sin productos con control de inventario. Márcalos como &quot;controla_inventario&quot; al
          crearlos.
        </p>
      )}

      <table className="w-full max-w-2xl text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-left text-xs text-neutral-500">
            <th className="py-2">Producto</th>
            <th className="py-2">Stock actual</th>
            <th className="py-2">Mínimo</th>
            <th className="py-2">Unidad</th>
            <th className="py-2"></th>
          </tr>
        </thead>
        <tbody>
          {inventario?.map((item) => {
            const bajoMinimo = item.stock_actual < item.stock_minimo
            return (
              <tr key={item.id} className="border-b border-neutral-100">
                <td className="py-2">
                  {item.productos?.nombre}
                  {bajoMinimo && (
                    <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700">
                      Stock bajo
                    </span>
                  )}
                </td>
                <td className="py-2">
                  <input
                    type="number"
                    defaultValue={item.stock_actual}
                    onBlur={(e) => {
                      const nuevo = Number(e.target.value)
                      if (nuevo !== item.stock_actual && usuario) {
                        ajusteMutation.mutate({
                          inventarioId: item.id,
                          productoId: item.producto_id,
                          stockActual: item.stock_actual,
                          nuevoStock: nuevo,
                          usuarioId: usuario.id,
                        })
                      }
                    }}
                    className="w-20 rounded border border-neutral-200 px-2 py-1 text-sm"
                  />
                </td>
                <td className="py-2">{item.stock_minimo}</td>
                <td className="py-2">{item.unidad}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </main>
  )
}
