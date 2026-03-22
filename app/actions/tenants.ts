'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import type { ActionState } from '@/types'

export async function createTenant(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { error } = await supabase.from('tenants').insert({
    first_name: formData.get('first_name') as string,
    last_name: formData.get('last_name') as string,
    email: (formData.get('email') as string) || null,
    phone: (formData.get('phone') as string) || null,
    emergency_contact: (formData.get('emergency_contact') as string) || null,
    emergency_phone: (formData.get('emergency_phone') as string) || null,
  })

  if (error) return { error: error.message }
  revalidatePath('/tenants')
  return { success: true }
}

export async function updateTenant(
  id: string,
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { error } = await supabase
    .from('tenants')
    .update({
      first_name: formData.get('first_name') as string,
      last_name: formData.get('last_name') as string,
      email: (formData.get('email') as string) || null,
      phone: (formData.get('phone') as string) || null,
      emergency_contact: (formData.get('emergency_contact') as string) || null,
      emergency_phone: (formData.get('emergency_phone') as string) || null,
    })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/tenants')
  return { success: true }
}

export async function deleteTenant(id: string): Promise<ActionState> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { error } = await supabase.from('tenants').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/tenants')
  return { success: true }
}
