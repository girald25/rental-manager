import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import PortalMaintenanceClient from './PortalMaintenanceClient'
import { getPortalTickets } from '@/app/actions/maintenance-tickets'

export default async function PortalMantenimientoPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()

  // Get tenant's unit for the form
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, lease:leases(unit_id, status, unit:units(id, unit_number, building:buildings(name)))')
    .eq('user_id', user!.id)
    .single()

  const activeLease = tenant?.lease?.find((l: { status: string }) => l.status === 'active') ?? tenant?.lease?.[0]
  const unit = activeLease?.unit as { id: string; unit_number: string; building: { name: string } | null } | null | undefined

  const tickets = await getPortalTickets()

  return (
    <PortalMaintenanceClient
      tenantId={tenant?.id ?? ''}
      unitId={unit?.id ?? ''}
      unitLabel={unit ? `Unidad ${unit.unit_number} – ${unit.building?.name}` : ''}
      tickets={tickets}
    />
  )
}
