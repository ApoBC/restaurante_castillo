import { redirect } from 'next/navigation'
import { getUsuarioActual, rutaPorRol } from '@/lib/auth'

export default async function Home() {
  const usuario = await getUsuarioActual()

  if (!usuario) {
    redirect('/login')
  }

  redirect(rutaPorRol(usuario.rol))
}
