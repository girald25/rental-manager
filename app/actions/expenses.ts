'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import type { ActionState } from '@/types'

export async function createExpense(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { error } = await supabase.from('expenses').insert({
    building_id: (formData.get('building_id') as string) || null,
    unit_id: (formData.get('unit_id') as string) || null,
    category: formData.get('category') as string,
    description: formData.get('description') as string,
    amount: Number(formData.get('amount')),
    date: formData.get('date') as string,
    receipt_url: (formData.get('receipt_url') as string) || null,
  })

  if (error) return { error: error.message }
  revalidatePath('/finances')
  return { success: true }
}

export async function updateExpense(
  id: string,
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { error } = await supabase
    .from('expenses')
    .update({
      building_id: (formData.get('building_id') as string) || null,
      unit_id: (formData.get('unit_id') as string) || null,
      category: formData.get('category') as string,
      description: formData.get('description') as string,
      amount: Number(formData.get('amount')),
      date: formData.get('date') as string,
      receipt_url: (formData.get('receipt_url') as string) || null,
    })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/finances')
  return { success: true }
}

export async function deleteExpense(id: string): Promise<ActionState> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { error } = await supabase.from('expenses').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/finances')
  return { success: true }
}
