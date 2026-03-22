'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import type { ActionState } from '@/types'

export async function createLease(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const unitId = formData.get('unit_id') as string

  const { error } = await supabase.from('leases').insert({
    unit_id: unitId,
    tenant_id: formData.get('tenant_id') as string,
    start_date: formData.get('start_date') as string,
    end_date: formData.get('end_date') as string,
    rent_amount: Number(formData.get('rent_amount')),
    deposit_amount: Number(formData.get('deposit_amount') || 0),
    status: 'active',
  })

  if (error) return { error: error.message }

  // Mark unit as occupied
  await supabase.from('units').update({ status: 'occupied' }).eq('id', unitId)

  revalidatePath('/leases')
  revalidatePath('/units')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function updateLease(
  id: string,
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { error } = await supabase
    .from('leases')
    .update({
      start_date: formData.get('start_date') as string,
      end_date: formData.get('end_date') as string,
      rent_amount: Number(formData.get('rent_amount')),
      deposit_amount: Number(formData.get('deposit_amount') || 0),
      status: formData.get('status') as string,
    })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/leases')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteLease(id: string, unitId: string): Promise<ActionState> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { error } = await supabase.from('leases').delete().eq('id', id)
  if (error) return { error: error.message }

  // Check if unit still has active leases
  const { data: activeLeases } = await supabase
    .from('leases')
    .select('id')
    .eq('unit_id', unitId)
    .eq('status', 'active')

  if (!activeLeases || activeLeases.length === 0) {
    await supabase.from('units').update({ status: 'vacant' }).eq('id', unitId)
  }

  revalidatePath('/leases')
  revalidatePath('/units')
  revalidatePath('/dashboard')
  return { success: true }
}
