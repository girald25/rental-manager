import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import PortalNav from '@/components/PortalNav'
import { getNotifications } from '@/app/actions/notifications'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const role = user.user_metadata?.role ?? 'owner'
  if (role !== 'tenant') redirect('/dashboard')

  const notifications = await getNotifications()

  return (
    <div className="min-h-screen bg-[#f8fafb] dark:bg-[#0f1117]">
      <PortalNav user={user} notifications={notifications} />
      <main className="max-w-2xl mx-auto px-4 py-6 pb-24">
        {children}
      </main>
    </div>
  )
}
