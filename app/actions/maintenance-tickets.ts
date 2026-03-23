'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export type TicketState = { error?: string; success?: boolean } | null

export async function createMaintenanceTicket(
  prevState: TicketState,
  formData: FormData
): Promise<TicketState> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado.' }

  // Get tenant record linked to this user
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!tenant) return { error: 'No se encontró el perfil de inquilino.' }

  const { error } = await supabase.from('maintenance_tickets').insert({
    tenant_id: tenant.id,
    unit_id: formData.get('unit_id') as string,
    title: formData.get('title') as string,
    description: formData.get('description') as string || null,
    priority: formData.get('priority') as string || 'medium',
  })

  if (error) return { error: error.message }

  revalidatePath('/portal/mantenimiento')
  return { success: true }
}

export async function updateTicketStatus(
  ticketId: string,
  status: 'open' | 'in_progress' | 'completed',
  notes?: string
) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const updates: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  }
  if (notes !== undefined) updates.notes = notes
  if (status === 'completed') updates.completed_at = new Date().toISOString()

  const { error } = await supabase
    .from('maintenance_tickets')
    .update(updates)
    .eq('id', ticketId)

  if (error) return { error: error.message }

  revalidatePath('/portal/mantenimiento')
  revalidatePath('/maintenance')
  return { success: true }
}

export async function getPortalTickets() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!tenant) return []

  const { data } = await supabase
    .from('maintenance_tickets')
    .select('*, unit:units(unit_number, building:buildings(name))')
    .eq('tenant_id', tenant.id)
    .order('created_at', { ascending: false })

  return data ?? []
}

export async function getAllMaintenanceTickets() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data } = await supabase
    .from('maintenance_tickets')
    .select('*, tenant:tenants(first_name, last_name), unit:units(unit_number, building:buildings(name))')
    .order('created_at', { ascending: false })

  return data ?? []
}
