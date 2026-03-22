import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import Sidebar from '@/components/Sidebar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="flex h-full print-layout">
      <Sidebar user={user} />
      <main className="flex-1 overflow-y-auto bg-zinc-50 print:overflow-visible print:bg-white print:h-auto">
        {children}
      </main>
    </div>
  )
}
