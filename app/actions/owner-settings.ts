'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export type SettingsState = { error?: string; success?: boolean } | null

export async function getOwnerSettings() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('owner_settings')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return data
}

export async function saveOwnerSettings(
  prevState: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado.' }

  const payload = {
    user_id: user.id,
    ath_movil_phone: formData.get('ath_movil_phone') as string || null,
    bank_name: formData.get('bank_name') as string || null,
    bank_routing: formData.get('bank_routing') as string || null,
    bank_account: formData.get('bank_account') as string || null,
    bank_account_name: formData.get('bank_account_name') as string || null,
    accept_cash: formData.get('accept_cash') === 'true',
    accept_check: formData.get('accept_check') === 'true',
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('owner_settings')
    .upsert(payload, { onConflict: 'user_id' })

  if (error) return { error: error.message }

  revalidatePath('/configuracion')
  return { success: true }
}
