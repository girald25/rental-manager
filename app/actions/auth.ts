'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export type AuthState = { error?: string; message?: string } | null

export async function signIn(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data, error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })

  if (error) return { error: error.message }

  const role = data.user?.user_metadata?.role ?? 'owner'
  redirect(role === 'tenant' ? '/portal' : '/dashboard')
}

export async function signUp(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirm_password') as string

  if (password !== confirmPassword) {
    return { error: 'Las contraseñas no coinciden.' }
  }

  if (password.length < 6) {
    return { error: 'La contraseña debe tener al menos 6 caracteres.' }
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { role: 'owner' } },
  })

  if (error) return { error: error.message }

  return {
    message: '¡Cuenta creada! Revisa tu correo para confirmarla antes de iniciar sesión.',
  }
}

export async function signOut() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  await supabase.auth.signOut()
  redirect('/login')
}
