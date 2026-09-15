import { createClient } from '@/lib/supabase/server'
import type { RolUsuario } from '@/types/database'

export async function getUsuarioActual() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: perfil } = await supabase
    .from('usuarios')
    .select('id, nombre, rol, activo')
    .eq('id', user.id)
    .single()

  return perfil
}

export function rutaPorRol(rol: RolUsuario) {
  switch (rol) {
    case 'mesero':
      return '/mesero'
    case 'cocina':
      return '/cocina'
    case 'admin':
    case 'superadmin':
      return '/admin'
  }
}
