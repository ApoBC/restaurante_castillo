import { createClient } from '@/lib/supabase/client'

export async function listarProductosDisponibles() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .eq('disponible', true)
    .order('tipo')
    .order('nombre')

  if (error) throw error
  return data
}
