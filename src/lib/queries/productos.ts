import { createClient } from '@/lib/supabase/client'
import type { Database, TipoProducto } from '@/types/database'

type ProductoRow = Database['public']['Tables']['productos']['Row']

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

/** Todos los productos (incluye no disponibles), para el panel de administración. */
export async function listarTodosLosProductos() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .order('tipo')
    .order('nombre')

  if (error) throw error
  return data
}

export async function crearProducto(params: {
  nombre: string
  descripcion: string | null
  precio: number
  tipo: TipoProducto
  controlaInventario: boolean
}) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('productos')
    .insert({
      nombre: params.nombre,
      descripcion: params.descripcion,
      precio: params.precio,
      tipo: params.tipo,
      controla_inventario: params.controlaInventario,
    })
    .select()
    .single()

  if (error) throw error

  if (params.controlaInventario) {
    const { error: errorInventario } = await supabase.from('inventario').insert({
      producto_id: data.id,
      stock_actual: 0,
      stock_minimo: 0,
      unidad: 'unidad',
    })
    if (errorInventario) throw errorInventario
  }

  return data
}

export async function actualizarProducto(id: number, cambios: Partial<ProductoRow>) {
  const supabase = createClient()
  const { error } = await supabase.from('productos').update(cambios).eq('id', id)
  if (error) throw error
}
