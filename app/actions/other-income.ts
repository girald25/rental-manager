'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import type { ActionState } from '@/types'

export async function createOtherIncome(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { error } = await supabase.from('other_income').insert({
    building_id: (formData.get('building_id') as string) || null,
    unit_id: (formData.get('unit_id') as string) || null,
    category: formData.get('category') as string,
    description: formData.get('description') as string,
    amount: Number(formData.get('amount')),
    date: formData.get('date') as string,
  })

  if (error) return { error: error.message }
  revalidatePath('/finances')
  return { success: true }
}

export async function updateOtherIncome(
  id: string,
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { error } = await supabase
    .from('other_income')
    .update({
      building_id: (formData.get('building_id') as string) || null,
      unit_id: (formData.get('unit_id') as string) || null,
      category: formData.get('category') as string,
      description: formData.get('description') as string,
      amount: Number(formData.get('amount')),
      date: formData.get('date') as string,
    })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/finances')
  return { success: true }
}

export async function deleteOtherIncome(id: string): Promise<ActionState> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { error } = await supabase.from('other_income').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/finances')
  return { success: true }
}
