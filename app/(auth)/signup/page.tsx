'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { Building2 } from 'lucide-react'
import { signUp } from '@/app/actions/auth'
import SubmitButton from '@/components/SubmitButton'

const input =
  'w-full border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 transition-colors'

export default function SignupPage() {
  const [state, formAction] = useActionState(signUp, null)

  if (state?.message) {
    return (
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8">
          <Building2 size={18} className="text-zinc-900" />
          <span className="text-sm font-semibold text-zinc-900 tracking-tight">RentManager</span>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-7 text-center">
          <div className="w-9 h-9 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 size={16} className="text-zinc-600" />
          </div>
          <h2 className="text-sm font-semibold text-zinc-900 mb-1.5">Check your email</h2>
          <p className="text-xs text-zinc-500 leading-relaxed">{state.message}</p>
          <Link
            href="/login"
            className="inline-block mt-5 text-xs font-medium text-zinc-900 hover:underline"
          >
            Back to sign in →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8">
        <Building2 size={18} className="text-zinc-900" />
        <span className="text-sm font-semibold text-zinc-900 tracking-tight">RentManager</span>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl p-7">
        <h1 className="text-base font-semibold text-zinc-900 mb-0.5">Create account</h1>
        <p className="text-sm text-zinc-500 mb-6">Start managing your properties</p>

        {state?.error && (
          <div className="mb-4 px-3 py-2.5 bg-red-50 border border-red-100 rounded-md text-xs text-red-700">
            {state.error}
          </div>
        )}

        <form action={formAction} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1.5">Email</label>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className={input}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1.5">Password</label>
            <input
              name="password"
              type="password"
              required
              autoComplete="new-password"
              className={input}
              placeholder="At least 6 characters"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1.5">Confirm password</label>
            <input
              name="confirm_password"
              type="password"
              required
              autoComplete="new-password"
              className={input}
              placeholder="••••••••"
            />
          </div>
          <SubmitButton
            label="Create account"
            pendingLabel="Creating account…"
            className="w-full px-3 py-2 bg-zinc-900 text-white text-sm font-medium rounded-md hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-1"
          />
        </form>
      </div>

      <p className="text-center text-xs text-zinc-500 mt-5">
        Already have an account?{' '}
        <Link href="/login" className="text-zinc-900 font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
