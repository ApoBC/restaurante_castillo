'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { listarComprobantesDelMes } from '@/lib/queries/backup'
import { descargarBlob, generarBackupZip } from '@/lib/backup/generarBackupZip'

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

export default function BackupPage() {
  const ahora = new Date()
  const [anio, setAnio] = useState(ahora.getFullYear())
  const [mes, setMes] = useState(ahora.getMonth() + 1)
  const [generando, setGenerando] = useState(false)

  async function handleDescargar() {
    setGenerando(true)
    try {
      const comprobantes = await listarComprobantesDelMes(anio, mes)

      if (comprobantes.length === 0) {
        toast.error('No hay boletas ni facturas en ese mes')
        return
      }

      const blob = await generarBackupZip({ anio, mes, comprobantes })
      const nombre = `comprobantes-${anio}-${String(mes).padStart(2, '0')}.zip`
      descargarBlob(blob, nombre)
      toast.success(`Backup generado: ${comprobantes.length} comprobantes`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error generando el backup')
    } finally {
      setGenerando(false)
    }
  }

  const anioActual = ahora.getFullYear()
  const anios = [anioActual, anioActual - 1, anioActual - 2]

  return (
    <main className="flex-1 p-6">
      <h1 className="mb-1 text-xl font-semibold">Backup de comprobantes</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Descarga un .zip con todas las boletas y facturas emitidas en el mes elegido (no incluye
        tickets internos de cocina). Guárdalo en un lugar seguro fuera del sistema.
      </p>

      <div className="max-w-md rounded-lg border border-neutral-200 bg-white p-4">
        <div className="mb-4 flex gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-xs text-neutral-500">Mes</label>
            <select
              value={mes}
              onChange={(e) => setMes(Number(e.target.value))}
              className="w-full rounded border border-neutral-300 px-2 py-1 text-sm"
            >
              {MESES.map((nombre, i) => (
                <option key={nombre} value={i + 1}>
                  {nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs text-neutral-500">Año</label>
            <select
              value={anio}
              onChange={(e) => setAnio(Number(e.target.value))}
              className="w-full rounded border border-neutral-300 px-2 py-1 text-sm"
            >
              {anios.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleDescargar}
          disabled={generando}
          className="w-full rounded bg-neutral-900 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {generando ? 'Generando...' : 'Descargar backup (.zip)'}
        </button>
      </div>
    </main>
  )
}
