import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import BuildingsClient from './BuildingsClient'

export default async function BuildingsPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: buildings } = await supabase
    .from('buildings')
    .select('*')
    .order('name')

  // Get unit counts per building
  const { data: units } = await supabase.from('units').select('building_id')
  const unitCounts: Record<string, number> = {}
  for (const u of units ?? []) {
    unitCounts[u.building_id] = (unitCounts[u.building_id] ?? 0) + 1
  }

  return (
    <div className="p-8">
      <BuildingsClient buildings={buildings ?? []} unitCounts={unitCounts} />
    </div>
  )
}
