import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import DocumentsClient from './DocumentsClient'
import type { Document, Building, Tenant } from '@/types'

export default async function DocumentsPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const [{ data: documents }, { data: buildings }, { data: units }, { data: tenants }] =
    await Promise.all([
      supabase
        .from('documents')
        .select(`
          *,
          building:buildings(id, name),
          unit:units(id, unit_number),
          tenant:tenants(id, first_name, last_name)
        `)
        .order('created_at', { ascending: false }),
      supabase.from('buildings').select('id, name').order('name'),
      supabase
        .from('units')
        .select('id, unit_number, building_id, building:buildings(id, name)')
        .order('unit_number'),
      supabase
        .from('tenants')
        .select('id, first_name, last_name')
        .order('last_name'),
    ])

  const docs = (documents ?? []) as Document[]
  const totalSize = docs.reduce((s, d) => s + (d.file_size ? Number(d.file_size) : 0), 0)

  return (
    <div className="p-4 md:p-8">
      <DocumentsClient
        documents={docs}
        buildings={(buildings ?? []) as Building[]}
        units={(units as any) ?? []}
        tenants={(tenants ?? []) as Tenant[]}
        totalSize={totalSize}
      />
    </div>
  )
}
