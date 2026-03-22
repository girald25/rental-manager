import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import MaintenanceClient from './MaintenanceClient'

export default async function MaintenancePage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const [{ data: requests }, { data: units }] = await Promise.all([
    supabase
      .from('maintenance_requests')
      .select('*, unit:units(id, unit_number, building:buildings(name))')
      .order('created_at', { ascending: false }),
    supabase
      .from('units')
      .select('*, building:buildings(id, name)')
      .order('unit_number'),
  ])

  return (
    <div className="p-8">
      <MaintenanceClient requests={requests ?? []} units={units ?? []} />
    </div>
  )
}
