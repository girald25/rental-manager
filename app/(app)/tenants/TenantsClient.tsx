'use client'

import { useActionState, useState } from 'react'
import { Plus, Pencil, Trash2, Users } from 'lucide-react'
import Modal from '@/components/Modal'
import SubmitButton from '@/components/SubmitButton'
import { createTenant, updateTenant, deleteTenant } from '@/app/actions/tenants'
import type { Tenant } from '@/types'

const input =
  'w-full border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 transition-colors'
const label = 'block text-xs font-medium text-zinc-600 mb-1.5'

function TenantForm({
  tenant,
  action,
}: {
  tenant?: Tenant
  action: (prevState: any, formData: FormData) => Promise<any>
}) {
  const [state, formAction] = useActionState(action, null)
  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-md">
          {state.error}
        </p>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label}>First name</label>
          <input name="first_name" required defaultValue={tenant?.first_name} className={input} placeholder="Jane" />
        </div>
        <div>
          <label className={label}>Last name</label>
          <input name="last_name" required defaultValue={tenant?.last_name} className={input} placeholder="Smith" />
        </div>
        <div className="col-span-2">
          <label className={label}>Email</label>
          <input name="email" type="email" defaultValue={tenant?.email ?? ''} className={input} placeholder="jane@example.com" />
        </div>
        <div className="col-span-2">
          <label className={label}>Phone</label>
          <input name="phone" type="tel" defaultValue={tenant?.phone ?? ''} className={input} placeholder="(512) 555-0100" />
        </div>
        <div className="col-span-2 pt-1 border-t border-zinc-100">
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-3">Emergency contact</p>
        </div>
        <div>
          <label className={label}>Name</label>
          <input name="emergency_contact" defaultValue={tenant?.emergency_contact ?? ''} className={input} placeholder="John Smith" />
        </div>
        <div>
          <label className={label}>Phone</label>
          <input name="emergency_phone" type="tel" defaultValue={tenant?.emergency_phone ?? ''} className={input} placeholder="(512) 555-0101" />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-1 border-t border-zinc-100">
        <SubmitButton label={tenant ? 'Save changes' : 'Add tenant'} />
      </div>
    </form>
  )
}

export default function TenantsClient({ tenants }: { tenants: Tenant[] }) {
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<Tenant | null>(null)
  const [createKey, setCreateKey] = useState(0)
  const [editKey, setEditKey] = useState(0)
  const [search, setSearch] = useState('')

  const createAction = async (prevState: any, formData: FormData) => {
    const result = await createTenant(prevState, formData)
    if (result?.success) setShowCreate(false)
    return result
  }
  const editAction = async (prevState: any, formData: FormData) => {
    if (!editing) return prevState
    const result = await updateTenant(editing.id, prevState, formData)
    if (result?.success) setEditing(null)
    return result
  }
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this tenant?')) return
    await deleteTenant(id)
  }

  const filtered = tenants.filter((t) => {
    const q = search.toLowerCase()
    return (
      !q ||
      t.first_name.toLowerCase().includes(q) ||
      t.last_name.toLowerCase().includes(q) ||
      t.email?.toLowerCase().includes(q)
    )
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Tenants</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {tenants.length} tenant{tenants.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => { setCreateKey((k) => k + 1); setShowCreate(true) }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 text-white text-sm font-medium rounded-md hover:bg-zinc-700 transition-colors"
        >
          <Plus size={14} />
          Add tenant
        </button>
      </div>

      <div className="mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-xs border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 transition-colors bg-white"
          placeholder="Search tenants…"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-lg p-16 text-center">
          <Users size={28} className="mx-auto text-zinc-200 mb-3" />
          <p className="text-sm font-medium text-zinc-500">
            {search ? 'No results found' : 'No tenants yet'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="text-left text-xs font-medium text-zinc-400 px-4 py-3">Name</th>
                <th className="text-left text-xs font-medium text-zinc-400 px-4 py-3">Email</th>
                <th className="text-left text-xs font-medium text-zinc-400 px-4 py-3">Phone</th>
                <th className="text-left text-xs font-medium text-zinc-400 px-4 py-3">Emergency</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 bg-zinc-100 rounded-full flex items-center justify-center shrink-0 text-zinc-600 text-xs font-semibold">
                        {t.first_name[0]}{t.last_name[0]}
                      </div>
                      <span className="text-sm font-medium text-zinc-900">
                        {t.first_name} {t.last_name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-500">
                    {t.email ?? <span className="text-zinc-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-500">
                    {t.phone ?? <span className="text-zinc-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-500">
                    {t.emergency_contact ? (
                      <span>{t.emergency_contact}</span>
                    ) : (
                      <span className="text-zinc-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => { setEditKey((k) => k + 1); setEditing(t) }}
                        className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-md transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add tenant">
        <TenantForm key={createKey} action={createAction} />
      </Modal>
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit tenant">
        {editing && <TenantForm key={editKey} tenant={editing} action={editAction} />}
      </Modal>
    </div>
  )
}
