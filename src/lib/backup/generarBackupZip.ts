import JSZip from 'jszip'
import type { ComprobanteCompleto } from '@/lib/queries/comprobantes'
import { DATOS_RESTAURANTE } from '@/lib/config'

function nombreArchivo(comprobante: ComprobanteCompleto) {
  const correlativo = String(comprobante.correlativo ?? comprobante.id).padStart(6, '0')
  return `${comprobante.serie ?? 'B001'}-${correlativo}.txt`
}

function textoComprobante(comprobante: ComprobanteCompleto) {
  const pedido = comprobante.pedidos
  const items = pedido?.pedido_items ?? []
  const fecha = new Date(comprobante.created_at)
  const correlativo = String(comprobante.correlativo ?? comprobante.id).padStart(6, '0')

  const lineas = [
    DATOS_RESTAURANTE.nombre,
    `RUC: ${DATOS_RESTAURANTE.ruc}`,
    `${DATOS_RESTAURANTE.direccion}`,
    '-----------------------------------',
    `BOLETA DE VENTA ${comprobante.serie ?? 'B001'}-${correlativo}`,
    '-----------------------------------',
    `Fecha: ${fecha.toLocaleDateString('es-PE')} ${fecha.toLocaleTimeString('es-PE')}`,
    pedido?.mesas ? `Mesa: ${pedido.mesas.numero}` : 'Delivery',
    `Pago: ${pedido?.metodo_pago ?? '-'}`,
    '-----------------------------------',
  ]

  for (const item of items) {
    lineas.push(
      `${item.cantidad}x ${item.productos?.nombre ?? 'Producto'}  S/ ${(item.cantidad * item.precio_unitario).toFixed(2)}`
    )
    if (item.nota) lineas.push(`   - ${item.nota}`)
  }

  lineas.push('-----------------------------------')
  lineas.push(`Subtotal: S/ ${comprobante.subtotal.toFixed(2)}`)
  if (pedido && pedido.descuento_pct > 0) {
    const descuentoMonto = comprobante.subtotal * (pedido.descuento_pct / 100)
    lineas.push(`Descuento (${pedido.descuento_pct}%): -S/ ${descuentoMonto.toFixed(2)}`)
  }
  lineas.push(`TOTAL: S/ ${comprobante.total.toFixed(2)}`)

  return lineas.join('\n')
}

function escaparCsv(valor: string | number) {
  const texto = String(valor)
  if (texto.includes(',') || texto.includes('"') || texto.includes('\n')) {
    return `"${texto.replace(/"/g, '""')}"`
  }
  return texto
}

function generarCsvResumen(comprobantes: ComprobanteCompleto[]) {
  const encabezado = [
    'comprobante',
    'fecha',
    'mesa_o_delivery',
    'metodo_pago',
    'subtotal',
    'descuento_pct',
    'total',
  ]

  const filas = comprobantes.map((c) => {
    const pedido = c.pedidos
    const correlativo = String(c.correlativo ?? c.id).padStart(6, '0')
    return [
      `${c.serie ?? 'B001'}-${correlativo}`,
      new Date(c.created_at).toLocaleString('es-PE'),
      pedido?.mesas ? `Mesa ${pedido.mesas.numero}` : 'Delivery',
      pedido?.metodo_pago ?? '-',
      c.subtotal.toFixed(2),
      pedido?.descuento_pct ?? 0,
      c.total.toFixed(2),
    ].map(escaparCsv)
  })

  const totalGeneral = comprobantes.reduce((acc, c) => acc + c.total, 0)
  filas.push(['', '', '', '', '', 'TOTAL', totalGeneral.toFixed(2)])

  return [encabezado.join(','), ...filas.map((f) => f.join(','))].join('\n')
}

export async function generarBackupZip(params: {
  anio: number
  mes: number
  comprobantes: ComprobanteCompleto[]
}) {
  const zip = new JSZip()
  const carpeta = zip.folder(`comprobantes-${params.anio}-${String(params.mes).padStart(2, '0')}`)!

  carpeta.file('resumen.csv', generarCsvResumen(params.comprobantes))

  for (const comprobante of params.comprobantes) {
    carpeta.file(nombreArchivo(comprobante), textoComprobante(comprobante))
  }

  return zip.generateAsync({ type: 'blob' })
}

export function descargarBlob(blob: Blob, nombreArchivo: string) {
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombreArchivo
  document.body.appendChild(enlace)
  enlace.click()
  document.body.removeChild(enlace)
  URL.revokeObjectURL(url)
}
