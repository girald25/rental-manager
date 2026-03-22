'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import type { ActionState } from '@/types'

export async function createProject(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { error } = await supabase.from('projects').insert({
    building_id: (formData.get('building_id') as string) || null,
    unit_id: (formData.get('unit_id') as string) || null,
    title: formData.get('title') as string,
    description: (formData.get('description') as string) || null,
    status: formData.get('status') as string,
    priority: formData.get('priority') as string,
    budget: formData.get('budget') ? Number(formData.get('budget')) : null,
    actual_cost: formData.get('actual_cost') ? Number(formData.get('actual_cost')) : null,
    progress: Number(formData.get('progress') ?? 0),
    contractor_name: (formData.get('contractor_name') as string) || null,
    contractor_contact: (formData.get('contractor_contact') as string) || null,
    start_date: (formData.get('start_date') as string) || null,
    estimated_end_date: (formData.get('estimated_end_date') as string) || null,
    actual_end_date: (formData.get('actual_end_date') as string) || null,
  })

  if (error) return { error: error.message }
  revalidatePath('/projects')
  return { success: true }
}

export async function updateProject(
  id: string,
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { error } = await supabase
    .from('projects')
    .update({
      building_id: (formData.get('building_id') as string) || null,
      unit_id: (formData.get('unit_id') as string) || null,
      title: formData.get('title') as string,
      description: (formData.get('description') as string) || null,
      status: formData.get('status') as string,
      priority: formData.get('priority') as string,
      budget: formData.get('budget') ? Number(formData.get('budget')) : null,
      actual_cost: formData.get('actual_cost') ? Number(formData.get('actual_cost')) : null,
      progress: Number(formData.get('progress') ?? 0),
      contractor_name: (formData.get('contractor_name') as string) || null,
      contractor_contact: (formData.get('contractor_contact') as string) || null,
      start_date: (formData.get('start_date') as string) || null,
      estimated_end_date: (formData.get('estimated_end_date') as string) || null,
      actual_end_date: (formData.get('actual_end_date') as string) || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/projects')
  return { success: true }
}

export async function updateProjectStatus(
  id: string,
  status: string
): Promise<ActionState> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { error } = await supabase
    .from('projects')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/projects')
  return { success: true }
}

export async function deleteProject(id: string): Promise<ActionState> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/projects')
  return { success: true }
}

export async function addProjectNote(
  projectId: string,
  note: string
): Promise<ActionState> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { error } = await supabase.from('project_notes').insert({ project_id: projectId, note })
  if (error) return { error: error.message }
  revalidatePath('/projects')
  return { success: true }
}

export async function deleteProjectNote(id: string): Promise<ActionState> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { error } = await supabase.from('project_notes').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/projects')
  return { success: true }
}
