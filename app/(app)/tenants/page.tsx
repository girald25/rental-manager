import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import TenantsClient from './TenantsClient'

export default async function TenantsPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: tenants } = await supabase
    .from('tenants')
    .select('*')
    .order('last_name')

  return (
    <div className="p-8">
      <TenantsClient tenants={tenants ?? []} />
    </div>
  )
}
