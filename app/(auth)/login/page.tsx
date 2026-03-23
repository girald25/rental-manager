'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { Building2 } from 'lucide-react'
import { signIn } from '@/app/actions/auth'
import SubmitButton from '@/components/SubmitButton'

const input =
  'w-full border border-[#2d3148] rounded-lg px-3 py-2.5 text-sm text-slate-100 bg-[#252836] placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors'

export default function LoginPage() {
  const [state, formAction] = useActionState(signIn, null)

  return (
    <div className="w-full max-w-sm">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8">
        <Building2 size={18} className="text-emerald-400" />
        <span className="text-sm font-semibold text-white tracking-tight">RentManager</span>
      </div>

      <div className="bg-[#1e2130] border border-[#2d3148] rounded-xl p-7">
        <h1 className="text-base font-semibold text-white mb-0.5">Iniciar sesión</h1>
        <p className="text-sm text-slate-400 mb-6">Ingresa tus credenciales para continuar</p>

        {state?.error && (
          <div className="mb-4 px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-md text-xs text-red-400">
            {state.error}
          </div>
        )}

        <form action={formAction} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Correo electrónico</label>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className={input}
              placeholder="tu@ejemplo.com"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Contraseña</label>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className={input}
              placeholder="••••••••"
            />
          </div>
          <SubmitButton
            label="Iniciar sesión"
            pendingLabel="Iniciando…"
            className="w-full px-3 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-1"
          />
        </form>
      </div>

      <p className="text-center text-xs text-slate-500 mt-5">
        ¿No tienes cuenta?{' '}
        <Link href="/signup" className="text-emerald-400 font-medium hover:text-emerald-300">
          Regístrate
        </Link>
      </p>
    </div>
  )
}
