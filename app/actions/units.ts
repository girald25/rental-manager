'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import type { ActionState } from '@/types'

export async function createUnit(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { error } = await supabase.from('units').insert({
    building_id: formData.get('building_id') as string,
    unit_number: formData.get('unit_number') as string,
    floor: formData.get('floor') ? Number(formData.get('floor')) : null,
    bedrooms: Number(formData.get('bedrooms')),
    bathrooms: Number(formData.get('bathrooms')),
    sqft: formData.get('sqft') ? Number(formData.get('sqft')) : null,
  })

  if (error) return { error: error.message }
  revalidatePath('/units')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function updateUnit(
  id: string,
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { error } = await supabase
    .from('units')
    .update({
      building_id: formData.get('building_id') as string,
      unit_number: formData.get('unit_number') as string,
      floor: formData.get('floor') ? Number(formData.get('floor')) : null,
      bedrooms: Number(formData.get('bedrooms')),
      bathrooms: Number(formData.get('bathrooms')),
      sqft: formData.get('sqft') ? Number(formData.get('sqft')) : null,
    })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/units')
  return { success: true }
}

export async function deleteUnit(id: string): Promise<ActionState> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { error } = await supabase.from('units').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/units')
  revalidatePath('/dashboard')
  return { success: true }
}
