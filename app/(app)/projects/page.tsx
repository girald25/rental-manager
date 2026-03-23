import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import ProjectsClient from './ProjectsClient'
import type { Project, Building } from '@/types'

export default async function ProjectsPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const [{ data: projects }, { data: buildings }, { data: units }] = await Promise.all([
    supabase
      .from('projects')
      .select(`
        *,
        building:buildings(id, name),
        unit:units(id, unit_number),
        notes:project_notes(id, project_id, note, created_at)
      `)
      .order('updated_at', { ascending: false }),
    supabase.from('buildings').select('id, name').order('name'),
    supabase
      .from('units')
      .select('id, unit_number, building_id, building:buildings(id, name)')
      .order('unit_number'),
  ])

  const allProjects = (projects ?? []) as Project[]

  const active = allProjects.filter((p) => p.status === 'in_progress').length
  const totalBudget = allProjects.reduce((s, p) => s + (p.budget ? Number(p.budget) : 0), 0)
  const totalSpent = allProjects.reduce((s, p) => s + (p.actual_cost ? Number(p.actual_cost) : 0), 0)
  const avgProgress =
    allProjects.length > 0
      ? Math.round(allProjects.reduce((s, p) => s + p.progress, 0) / allProjects.length)
      : 0

  return (
    <div className="p-4 md:p-8">
      <ProjectsClient
        projects={allProjects}
        buildings={(buildings ?? []) as Building[]}
        units={(units as any) ?? []}
        stats={{ active, totalBudget, totalSpent, avgProgress, total: allProjects.length }}
      />
    </div>
  )
}
