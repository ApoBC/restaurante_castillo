'use client'

import { useQuery } from '@tanstack/react-query'
import { obtenerResumenHoy } from '@/lib/queries/reportes'
import { useUsuarioActual } from '@/lib/hooks/useUsuarioActual'

export default function AdminPage() {
  const { data: usuario } = useUsuarioActual()
  const { data: resumen, isLoading } = useQuery({
    queryKey: ['resumen-hoy'],
    queryFn: obtenerResumenHoy,
  })

  return (
    <main className="flex-1 p-6">
      <h1 className="mb-1 text-xl font-semibold">Resumen de hoy</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Bienvenido, {usuario?.nombre} ({usuario?.rol})
      </p>

      {isLoading && <p className="text-sm text-neutral-500">Cargando...</p>}

      {resumen && (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Tarjeta titulo="Ventas totales" valor={`S/ ${resumen.totalVentas.toFixed(2)}`} />
            <Tarjeta titulo="Pedidos pagados" valor={String(resumen.totalPedidos)} />
            <Tarjeta titulo="Efectivo" valor={`S/ ${resumen.porEfectivo.toFixed(2)}`} />
            <Tarjeta titulo="Tarjeta" valor={`S/ ${resumen.porTarjeta.toFixed(2)}`} />
          </div>

          <h2 className="mb-2 font-medium">Top platos del día</h2>
          {resumen.topProductos.length === 0 ? (
            <p className="text-sm text-neutral-400">Aún no hay ventas registradas hoy.</p>
          ) : (
            <ul className="max-w-sm space-y-1 text-sm">
              {resumen.topProductos.map(([nombre, cantidad]) => (
                <li key={nombre} className="flex justify-between border-b border-neutral-100 py-1">
                  <span>{nombre}</span>
                  <span className="font-medium">{cantidad}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </main>
  )
}

function Tarjeta({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <p className="text-xs text-neutral-500">{titulo}</p>
      <p className="mt-1 text-lg font-semibold">{valor}</p>
    </div>
  )
}
