import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export function useUsuarioActual() {
  return useQuery({
    queryKey: ['usuario-actual'],
    queryFn: async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return null

      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nombre, rol, activo')
        .eq('id', user.id)
        .single()

      if (error) throw error
      return data
    },
  })
}
