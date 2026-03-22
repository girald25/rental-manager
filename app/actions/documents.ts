'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import type { ActionState } from '@/types'

export async function createDocument(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { error } = await supabase.from('documents').insert({
    building_id: (formData.get('building_id') as string) || null,
    unit_id: (formData.get('unit_id') as string) || null,
    tenant_id: (formData.get('tenant_id') as string) || null,
    name: formData.get('name') as string,
    description: (formData.get('description') as string) || null,
    category: formData.get('category') as string,
    file_url: formData.get('file_url') as string,
    file_type: (formData.get('file_type') as string) || null,
    file_size: formData.get('file_size') ? Number(formData.get('file_size')) : null,
  })

  if (error) return { error: error.message }
  revalidatePath('/documents')
  return { success: true }
}

export async function updateDocument(
  id: string,
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { error } = await supabase
    .from('documents')
    .update({
      building_id: (formData.get('building_id') as string) || null,
      unit_id: (formData.get('unit_id') as string) || null,
      tenant_id: (formData.get('tenant_id') as string) || null,
      name: formData.get('name') as string,
      description: (formData.get('description') as string) || null,
      category: formData.get('category') as string,
      file_url: formData.get('file_url') as string,
      file_type: (formData.get('file_type') as string) || null,
      file_size: formData.get('file_size') ? Number(formData.get('file_size')) : null,
    })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/documents')
  return { success: true }
}

export async function deleteDocument(id: string): Promise<ActionState> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { error } = await supabase.from('documents').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/documents')
  return { success: true }
}
