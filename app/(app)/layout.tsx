import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import TopNav from '@/components/TopNav'
import { Analytics } from '@vercel/analytics/next'
import { getNotifications } from '@/app/actions/notifications'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const notifications = await getNotifications()

  return (
    <div className="flex flex-col h-full print-layout">
      <TopNav user={user} notifications={notifications} />
      <main className="flex-1 overflow-y-auto bg-[#f0f4f0] dark:bg-[#0f1117] pb-16 md:pb-0 print:overflow-visible print:bg-white print:h-auto">
        {children}
      </main>
      <Analytics />
    </div>
  )
}
