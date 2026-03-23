import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import ReportsClient from './ReportsClient'

export default async function ReportsPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const [
    { data: units },
    { data: leases },
    { data: payments },
    { data: expenses },
    { data: otherIncome },
    { data: maintenance },
    { data: tenants },
    { data: buildings },
  ] = await Promise.all([
    supabase
      .from('units')
      .select('*, building:buildings(id, name)')
      .order('unit_number'),
    supabase
      .from('leases')
      .select('*, tenant:tenants(id, first_name, last_name, email, phone), unit:units(id, unit_number, building_id, building:buildings(id, name))')
      .order('created_at', { ascending: false }),
    supabase
      .from('payments')
      .select('id, amount, due_date, paid_date, status, payment_method, lease:leases(id, tenant:tenants(id, first_name, last_name), unit:units(id, unit_number, building:buildings(id, name)))')
      .order('due_date', { ascending: false }),
    supabase
      .from('expenses')
      .select('id, amount, date, category, description, building:buildings(id, name), unit:units(id, unit_number)')
      .order('date', { ascending: false }),
    supabase
      .from('other_income')
      .select('id, amount, date, category, description, building:buildings(id, name), unit:units(id, unit_number)')
      .order('date', { ascending: false }),
    supabase
      .from('maintenance_requests')
      .select('*, unit:units(id, unit_number, building:buildings(id, name))')
      .order('created_at', { ascending: false }),
    supabase
      .from('tenants')
      .select('id, first_name, last_name, email, phone')
      .order('last_name'),
    supabase
      .from('buildings')
      .select('*')
      .order('name'),
  ])

  return (
    <div className="p-4 md:p-8">
      <ReportsClient
        units={(units as any) ?? []}
        leases={(leases as any) ?? []}
        payments={(payments as any) ?? []}
        expenses={(expenses as any) ?? []}
        otherIncome={(otherIncome as any) ?? []}
        maintenance={(maintenance as any) ?? []}
        tenants={(tenants as any) ?? []}
        buildings={(buildings as any) ?? []}
      />
    </div>
  )
}
