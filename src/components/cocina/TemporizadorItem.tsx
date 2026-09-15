'use client'

import { useEffect, useState } from 'react'

export function TemporizadorItem({ desde }: { desde: string }) {
  const [segundos, setSegundos] = useState(() =>
    Math.floor((Date.now() - new Date(desde).getTime()) / 1000)
  )

  useEffect(() => {
    const interval = setInterval(() => {
      setSegundos(Math.floor((Date.now() - new Date(desde).getTime()) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [desde])

  const minutos = Math.floor(segundos / 60)
  const restoSegundos = segundos % 60

  return (
    <span className={minutos >= 15 ? 'font-semibold text-red-600' : 'text-neutral-500'}>
      {minutos}:{restoSegundos.toString().padStart(2, '0')}
    </span>
  )
}
