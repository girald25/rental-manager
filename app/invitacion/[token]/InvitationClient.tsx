'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, CheckCircle, AlertTriangle } from 'lucide-react'
import { acceptInvitation } from '@/app/actions/invitations'

const input =
  'w-full border border-[#2d3148] rounded-lg px-3 py-2.5 text-sm text-slate-100 bg-[#252836] placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors'

export default function InvitationClient({
  token,
  invitation,
  isExpired,
  isAccepted,
}: {
  token: string
  invitation: {
    email: string
    tenant?: { first_name: string; last_name: string; email: string | null } | null
  }
  isExpired: boolean
  isAccepted: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const tenantName = invitation.tenant
    ? `${invitation.tenant.first_name} ${invitation.tenant.last_name}`
    : 'Inquilino'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    startTransition(async () => {
      const result = await acceptInvitation(token, password)
      if (result?.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        setTimeout(() => router.push('/portal'), 1500)
      }
    })
  }

  if (isAccepted) {
    return (
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8">
          <Building2 size={18} className="text-emerald-400" />
          <span className="text-sm font-semibold text-white tracking-tight">RentManager</span>
        </div>
        <div className="bg-[#1e2130] border border-[#2d3148] rounded-xl p-7 text-center">
          <div className="w-9 h-9 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={16} className="text-amber-400" />
          </div>
          <h2 className="text-sm font-semibold text-white mb-1.5">Invitación ya utilizada</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Esta invitación ya fue aceptada. Inicia sesión con tu cuenta.
          </p>
          <a
            href="/login"
            className="inline-block mt-5 text-xs font-medium text-emerald-400 hover:text-emerald-300"
          >
            Ir a iniciar sesión →
          </a>
        </div>
      </div>
    )
  }

  if (isExpired) {
    return (
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8">
          <Building2 size={18} className="text-emerald-400" />
          <span className="text-sm font-semibold text-white tracking-tight">RentManager</span>
        </div>
        <div className="bg-[#1e2130] border border-[#2d3148] rounded-xl p-7 text-center">
          <div className="w-9 h-9 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={16} className="text-red-400" />
          </div>
          <h2 className="text-sm font-semibold text-white mb-1.5">Invitación expirada</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Este enlace ha expirado. Pide a tu propietario que te envíe una nueva invitación.
          </p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8">
          <Building2 size={18} className="text-emerald-400" />
          <span className="text-sm font-semibold text-white tracking-tight">RentManager</span>
        </div>
        <div className="bg-[#1e2130] border border-[#2d3148] rounded-xl p-7 text-center">
          <div className="w-9 h-9 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={16} className="text-emerald-400" />
          </div>
          <h2 className="text-sm font-semibold text-white mb-1.5">¡Cuenta creada!</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Redirigiendo a tu portal...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm">
      <div className="flex items-center gap-2 mb-8">
        <Building2 size={18} className="text-emerald-400" />
        <span className="text-sm font-semibold text-white tracking-tight">RentManager</span>
      </div>

      <div className="bg-[#1e2130] border border-[#2d3148] rounded-xl p-7">
        <h1 className="text-base font-semibold text-white mb-0.5">Hola, {tenantName}</h1>
        <p className="text-sm text-slate-400 mb-6">
          Crea tu contraseña para acceder al portal de inquilinos con{' '}
          <span className="text-slate-300">{invitation.email}</span>.
        </p>

        {error && (
          <div className="mb-4 px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-md text-xs text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className={input}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Confirmar contraseña</label>
            <input
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              className={input}
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="w-full px-3 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-1"
          >
            {pending ? 'Creando cuenta…' : 'Crear mi cuenta'}
          </button>
        </form>
      </div>
    </div>
  )
}
