import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import UnitsClient from './UnitsClient'

export default async function UnitsPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const [{ data: units }, { data: buildings }] = await Promise.all([
    supabase
      .from('units')
      .select('*, building:buildings(id, name)')
      .order('unit_number'),
    supabase.from('buildings').select('*').order('name'),
  ])

  return (
    <div className="p-8">
      <UnitsClient units={units ?? []} buildings={buildings ?? []} />
    </div>
  )
}
