'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [cargando, setCargando] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setCargando(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    setCargando(false)

    if (error) {
      toast.error('Correo o contraseña incorrectos')
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-neutral-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-lg border border-neutral-200 bg-white p-8 shadow-sm"
      >
        <h1 className="mb-1 text-xl font-semibold">Restaurante Castillo</h1>
        <p className="mb-6 text-sm text-neutral-500">Ingresa con tu cuenta</p>

        <label className="mb-1 block text-sm font-medium">Correo o usuario</label>
        <input
          type="text"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 w-full rounded border border-neutral-300 px-3 py-2 text-sm"
        />

        <label className="mb-1 block text-sm font-medium">Contraseña / PIN</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-6 w-full rounded border border-neutral-300 px-3 py-2 text-sm"
        />

        <button
          type="submit"
          disabled={cargando}
          className="w-full rounded bg-neutral-900 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {cargando ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  )
}
