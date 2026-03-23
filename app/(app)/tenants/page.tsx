import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import TenantsClient from './TenantsClient'

export default async function TenantsPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const [{ data: tenants }, { data: invitations }] = await Promise.all([
    supabase.from('tenants').select('*, user_id').order('last_name'),
    supabase
      .from('tenant_invitations')
      .select('*')
      .order('created_at', { ascending: false }),
  ])

  // Build map: tenant_id → latest invitation
  const inviteMap: Record<string, { accepted_at: string | null; expires_at: string }> = {}
  for (const inv of invitations ?? []) {
    if (!inviteMap[inv.tenant_id]) inviteMap[inv.tenant_id] = inv
  }

  return (
    <div className="p-4 md:p-8">
      <TenantsClient tenants={tenants ?? []} inviteMap={inviteMap} />
    </div>
  )
}
