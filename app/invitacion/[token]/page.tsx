import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import InvitationClient from './InvitationClient'

export default async function InvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: inv } = await supabase
    .from('tenant_invitations')
    .select('*, tenant:tenants(first_name, last_name, email)')
    .eq('token', token)
    .single()

  if (!inv) notFound()

  const isExpired = new Date(inv.expires_at) < new Date()
  const isAccepted = !!inv.accepted_at

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center p-4">
      <InvitationClient
        token={token}
        invitation={inv}
        isExpired={isExpired}
        isAccepted={isAccepted}
      />
    </div>
  )
}
