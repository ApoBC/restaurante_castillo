import { createClient } from '@/lib/supabase/client'

export async function listarMesas() {
  const supabase = createClient()
  const { data, error } = await supabase.from('mesas').select('*').order('numero')

  if (error) throw error
  return data
}

export async function obtenerMesaPorNumero(numero: number) {
  const supabase = createClient()
  const { data, error } = await supabase.from('mesas').select('*').eq('numero', numero).single()

  if (error) throw error
  return data
}
