'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function getNotifications() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(30)

  return data ?? []
}

export async function markAllRead() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', user.id)
    .eq('read', false)

  revalidatePath('/', 'layout')
}

export async function createNotification({
  userId,
  title,
  body,
  type = 'info',
  link,
}: {
  userId: string
  title: string
  body: string
  type?: 'info' | 'success' | 'warning' | 'error'
  link?: string
}) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  await supabase.from('notifications').insert({ user_id: userId, title, body, type, link })
}
