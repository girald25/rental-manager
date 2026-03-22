'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import type { ActionState } from '@/types'

export async function createMaintenanceRequest(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { error } = await supabase.from('maintenance_requests').insert({
    unit_id: formData.get('unit_id') as string,
    title: formData.get('title') as string,
    description: (formData.get('description') as string) || null,
    priority: (formData.get('priority') as string) || 'medium',
    status: 'open',
  })

  if (error) return { error: error.message }
  revalidatePath('/maintenance')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function updateMaintenanceRequest(
  id: string,
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const status = formData.get('status') as string
  const completedAt = status === 'completed' ? new Date().toISOString() : null

  const { error } = await supabase
    .from('maintenance_requests')
    .update({
      title: formData.get('title') as string,
      description: (formData.get('description') as string) || null,
      priority: formData.get('priority') as string,
      status,
      notes: (formData.get('notes') as string) || null,
      completed_at: completedAt,
    })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/maintenance')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteMaintenanceRequest(id: string): Promise<ActionState> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { error } = await supabase.from('maintenance_requests').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/maintenance')
  return { success: true }
}
