import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import type { RolUsuario } from '@/types/database'

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { data: perfilSolicitante } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (perfilSolicitante?.rol !== 'superadmin') {
    return NextResponse.json({ error: 'Solo el superadmin puede crear usuarios' }, { status: 403 })
  }

  const body = await req.json()
  const { nombre, email, password, rol } = body as {
    nombre: string
    email: string
    password: string
    rol: RolUsuario
  }

  if (!nombre || !email || !password || !rol) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Admin/gerente requiere verificación de correo; mesero/cocina se crean ya confirmados
  // (no gestionan su propio correo, lo administra el superadmin/gerencia).
  const requiereVerificacion = rol === 'admin' || rol === 'superadmin'

  const { data: nuevoAuthUser, error: errorAuth } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: !requiereVerificacion,
  })

  if (errorAuth || !nuevoAuthUser.user) {
    return NextResponse.json({ error: errorAuth?.message ?? 'Error creando usuario' }, { status: 400 })
  }

  const { error: errorPerfil } = await admin.from('usuarios').insert({
    id: nuevoAuthUser.user.id,
    nombre,
    rol,
    creado_por: user.id,
  })

  if (errorPerfil) {
    await admin.auth.admin.deleteUser(nuevoAuthUser.user.id)
    return NextResponse.json({ error: errorPerfil.message }, { status: 400 })
  }

  if (requiereVerificacion) {
    await admin.auth.admin.inviteUserByEmail(email)
  }

  return NextResponse.json({ ok: true, id: nuevoAuthUser.user.id })
}
