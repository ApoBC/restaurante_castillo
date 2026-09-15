'use client'

import { use } from 'react'
import { useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { obtenerComprobante } from '@/lib/queries/comprobantes'
import { ReciboImprimible } from '@/components/recibo/ReciboImprimible'
import { ANCHO_PAPEL_MM_DEFECTO } from '@/lib/config'

export default function ReciboPage({
  params,
}: {
  params: Promise<{ comprobanteId: string }>
}) {
  const { comprobanteId } = use(params)
  const searchParams = useSearchParams()
  const anchoParam = searchParams.get('ancho')
  const anchoMm = anchoParam === '58' ? 58 : anchoParam === '80' ? 80 : ANCHO_PAPEL_MM_DEFECTO

  const { data: comprobante, isLoading, error } = useQuery({
    queryKey: ['comprobante', comprobanteId],
    queryFn: () => obtenerComprobante(Number(comprobanteId)),
  })

  if (isLoading) return <p className="p-6 text-sm text-neutral-500">Generando recibo...</p>
  if (error || !comprobante) {
    return <p className="p-6 text-sm text-red-600">No se pudo cargar el comprobante.</p>
  }

  return <ReciboImprimible comprobante={comprobante} anchoMm={anchoMm} />
}
