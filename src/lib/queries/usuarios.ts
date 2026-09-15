import { createClient } from '@/lib/supabase/client'

export async function listarUsuarios() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function desactivarUsuario(id: string, activo: boolean) {
  const supabase = createClient()
  const { error } = await supabase.from('usuarios').update({ activo }).eq('id', id)
  if (error) throw error
}
