'use client'

import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import type { ComprobanteCompleto } from '@/lib/queries/comprobantes'
import { DATOS_RESTAURANTE } from '@/lib/config'

export function ReciboImprimible({
  comprobante,
  anchoMm,
}: {
  comprobante: ComprobanteCompleto
  anchoMm: 58 | 80
}) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const yaImprimioRef = useRef(false)

  const pedido = comprobante.pedidos
  const items = pedido?.pedido_items ?? []

  useEffect(() => {
    const contenidoQr = `${comprobante.serie}-${comprobante.correlativo}|TOTAL:${comprobante.total.toFixed(2)}`
    QRCode.toDataURL(contenidoQr, { margin: 0, width: 120 }).then(setQrDataUrl)
  }, [comprobante])

  useEffect(() => {
    if (yaImprimioRef.current) return
    yaImprimioRef.current = true
    const timeout = setTimeout(() => window.print(), 300)
    return () => clearTimeout(timeout)
  }, [])

  const fecha = new Date(comprobante.created_at)

  return (
    <div className="flex flex-col items-center bg-neutral-100 py-6 print:bg-white print:py-0">
      <style>{`
        @page { size: ${anchoMm}mm auto; margin: 0; }
        @media print {
          body { background: white; }
          .no-imprimir { display: none !important; }
        }
      `}</style>

      <div
        className="bg-white p-3 font-mono text-[11px] leading-snug text-black shadow print:shadow-none"
        style={{ width: `${anchoMm}mm` }}
      >
        <div className="mb-2 text-center">
          <p className="text-sm font-bold">{DATOS_RESTAURANTE.nombre}</p>
          <p>RUC: {DATOS_RESTAURANTE.ruc}</p>
          <p>{DATOS_RESTAURANTE.direccion}</p>
        </div>

        <div className="my-1 border-t border-dashed border-black" />

        <p className="text-center font-semibold">
          BOLETA DE VENTA
          <br />
          {comprobante.serie}-{String(comprobante.correlativo).padStart(6, '0')}
        </p>

        <div className="my-1 border-t border-dashed border-black" />

        <p>Fecha: {fecha.toLocaleDateString('es-PE')} {fecha.toLocaleTimeString('es-PE')}</p>
        <p>{pedido?.mesas ? `Mesa: ${pedido.mesas.numero}` : 'Delivery'}</p>
        <p>Pago: {pedido?.metodo_pago ?? '-'}</p>

        <div className="my-1 border-t border-dashed border-black" />

        {items.map((item, i) => (
          <div key={i} className="mb-1">
            <div className="flex justify-between">
              <span>
                {item.cantidad}x {item.productos?.nombre}
              </span>
              <span>S/ {(item.cantidad * item.precio_unitario).toFixed(2)}</span>
            </div>
            {item.nota && <div className="pl-2 text-[10px] italic">- {item.nota}</div>}
          </div>
        ))}

        <div className="my-1 border-t border-dashed border-black" />

        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>S/ {comprobante.subtotal.toFixed(2)}</span>
        </div>
        {pedido && pedido.descuento_pct > 0 && (
          <div className="flex justify-between">
            <span>Descuento ({pedido.descuento_pct}%)</span>
            <span>
              -S/ {(comprobante.subtotal * (pedido.descuento_pct / 100)).toFixed(2)}
            </span>
          </div>
        )}
        <div className="flex justify-between font-bold">
          <span>TOTAL</span>
          <span>S/ {comprobante.total.toFixed(2)}</span>
        </div>

        <div className="my-2 flex flex-col items-center">
          {qrDataUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- data: URL generado en runtime, no optimizable por next/image
            <img src={qrDataUrl} alt="QR comprobante" width={90} height={90} />
          )}
        </div>

        <p className="text-center text-[10px]">Gracias por su preferencia</p>
      </div>

      <button
        onClick={() => window.print()}
        className="no-imprimir mt-4 rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
      >
        Imprimir de nuevo
      </button>
    </div>
  )
}
