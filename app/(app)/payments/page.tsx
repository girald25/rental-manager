import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import PaymentsClient from './PaymentsClient'

export default async function PaymentsPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const [{ data: payments }, { data: leases }] = await Promise.all([
    supabase
      .from('payments')
      .select(
        '*, lease:leases(id, status, rent_amount, tenant:tenants(first_name, last_name), unit:units(unit_number, building:buildings(name)))'
      )
      .order('due_date', { ascending: false }),
    supabase
      .from('leases')
      .select('*, tenant:tenants(*), unit:units(*, building:buildings(*))')
      .order('created_at', { ascending: false }),
  ])

  return (
    <div className="p-8">
      <PaymentsClient payments={payments ?? []} leases={leases ?? []} />
    </div>
  )
}
