'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import type { ActionState } from '@/types'

export async function createBuilding(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { error } = await supabase.from('buildings').insert({
    name: formData.get('name') as string,
    address: formData.get('address') as string,
    city: formData.get('city') as string,
    state: formData.get('state') as string,
    zip: formData.get('zip') as string,
  })

  if (error) return { error: error.message }
  revalidatePath('/buildings')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function updateBuilding(
  id: string,
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { error } = await supabase
    .from('buildings')
    .update({
      name: formData.get('name') as string,
      address: formData.get('address') as string,
      city: formData.get('city') as string,
      state: formData.get('state') as string,
      zip: formData.get('zip') as string,
    })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/buildings')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteBuilding(id: string): Promise<ActionState> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { error } = await supabase.from('buildings').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/buildings')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function updateBuildingFinancials(
  id: string,
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const investment = formData.get('investment_value')
  const market = formData.get('market_value')

  const { error } = await supabase
    .from('buildings')
    .update({
      investment_value: investment ? Number(investment) : null,
      market_value: market ? Number(market) : null,
    })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/finances')
  return { success: true }
}
