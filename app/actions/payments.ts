'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import type { ActionState } from '@/types'

export async function createPayment(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { error } = await supabase.from('payments').insert({
    lease_id: formData.get('lease_id') as string,
    amount: Number(formData.get('amount')),
    due_date: formData.get('due_date') as string,
    paid_date: (formData.get('paid_date') as string) || null,
    status: (formData.get('status') as string) || 'pending',
    payment_method: (formData.get('payment_method') as string) || null,
    notes: (formData.get('notes') as string) || null,
  })

  if (error) return { error: error.message }
  revalidatePath('/payments')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function markPaymentPaid(id: string): Promise<ActionState> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { error } = await supabase
    .from('payments')
    .update({
      status: 'paid',
      paid_date: new Date().toISOString().split('T')[0],
    })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/payments')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function updatePayment(
  id: string,
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { error } = await supabase
    .from('payments')
    .update({
      amount: Number(formData.get('amount')),
      due_date: formData.get('due_date') as string,
      paid_date: (formData.get('paid_date') as string) || null,
      status: formData.get('status') as string,
      payment_method: (formData.get('payment_method') as string) || null,
      notes: (formData.get('notes') as string) || null,
    })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/payments')
  return { success: true }
}

export async function deletePayment(id: string): Promise<ActionState> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { error } = await supabase.from('payments').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/payments')
  return { success: true }
}
