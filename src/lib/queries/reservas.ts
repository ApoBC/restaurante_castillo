import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'

export type ReservaConMesa = Database['public']['Tables']['reservas']['Row'] & {
  mesas: { numero: number } | null
}

export async function listarReservas() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('reservas')
    .select('*, mesas(numero)')
    .order('fecha', { ascending: true })
    .order('hora', { ascending: true })
    .returns<ReservaConMesa[]>()

  if (error) throw error
  return data
}

export async function crearReserva(params: {
  nombreCliente: string
  telefono: string
  fecha: string
  hora: string
  numComensales: number
  mesaId: number | null
  creadoPor: string
}) {
  const supabase = createClient()
  const { error } = await supabase.from('reservas').insert({
    nombre_cliente: params.nombreCliente,
    telefono: params.telefono,
    fecha: params.fecha,
    hora: params.hora,
    num_comensales: params.numComensales,
    mesa_id: params.mesaId,
    creado_por: params.creadoPor,
  })
  if (error) throw error
}

export async function actualizarEstadoReserva(
  id: number,
  estado: 'pendiente' | 'confirmada' | 'cancelada' | 'completada'
) {
  const supabase = createClient()
  const { error } = await supabase.from('reservas').update({ estado }).eq('id', id)
  if (error) throw error
}
