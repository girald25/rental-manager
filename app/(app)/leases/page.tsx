import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import LeasesClient from './LeasesClient'

export default async function LeasesPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const [{ data: leases }, { data: units }, { data: tenants }] = await Promise.all([
    supabase
      .from('leases')
      .select('*, unit:units(id, unit_number, status, building:buildings(id, name)), tenant:tenants(*)')
      .order('created_at', { ascending: false }),
    supabase
      .from('units')
      .select('*, building:buildings(id, name)')
      .order('unit_number'),
    supabase.from('tenants').select('*').order('last_name'),
  ])

  return (
    <div className="p-4 md:p-8">
      <LeasesClient leases={leases ?? []} units={units ?? []} tenants={tenants ?? []} />
    </div>
  )
}
