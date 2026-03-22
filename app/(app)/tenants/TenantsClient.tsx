'use client'

import { useActionState, useState } from 'react'
import { Plus, Pencil, Trash2, Users } from 'lucide-react'
import Modal from '@/components/Modal'
import SubmitButton from '@/components/SubmitButton'
import { createTenant, updateTenant, deleteTenant } from '@/app/actions/tenants'
import type { Tenant } from '@/types'

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
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{state.error}</p>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
          <input
            name="first_name"
            required
            defaultValue={tenant?.first_name}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Jane"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
          <input
            name="last_name"
            required
            defaultValue={tenant?.last_name}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Smith"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            name="email"
            type="email"
            defaultValue={tenant?.email ?? ''}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="jane@example.com"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input
            name="phone"
            type="tel"
            defaultValue={tenant?.phone ?? ''}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="(512) 555-0100"
          />
        </div>
        <div className="col-span-2 border-t border-gray-100 pt-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Emergency Contact</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            name="emergency_contact"
            defaultValue={tenant?.emergency_contact ?? ''}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="John Smith"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input
            name="emergency_phone"
            type="tel"
            defaultValue={tenant?.emergency_phone ?? ''}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="(512) 555-0101"
          />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <SubmitButton label={tenant ? 'Save Changes' : 'Add Tenant'} />
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
          <h1 className="text-2xl font-bold text-gray-900">Tenants</h1>
          <p className="text-gray-500 mt-1">{tenants.length} tenant{tenants.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => { setCreateKey((k) => k + 1); setShowCreate(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus size={16} />
          Add Tenant
        </button>
      </div>

      <div className="mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-xs border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          placeholder="Search tenants…"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <Users size={40} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">{search ? 'No results found' : 'No tenants yet'}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Name</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Contact</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Emergency</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center shrink-0 text-indigo-700 font-semibold text-sm">
                        {t.first_name[0]}{t.last_name[0]}
                      </div>
                      <span className="font-medium text-gray-900">
                        {t.first_name} {t.last_name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div>{t.email ?? <span className="text-gray-400">—</span>}</div>
                    <div>{t.phone ?? ''}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {t.emergency_contact ? (
                      <div>
                        <div>{t.emergency_contact}</div>
                        <div className="text-gray-400">{t.emergency_phone ?? ''}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => { setEditKey((k) => k + 1); setEditing(t) }}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add Tenant">
        <TenantForm key={createKey} action={createAction} />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Tenant">
        {editing && <TenantForm key={editKey} tenant={editing} action={editAction} />}
      </Modal>
    </div>
  )
}
