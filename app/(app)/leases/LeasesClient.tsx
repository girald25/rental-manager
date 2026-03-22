'use client'

import { useActionState, useState } from 'react'
import { Plus, Pencil, Trash2, FileText } from 'lucide-react'
import Modal from '@/components/Modal'
import SubmitButton from '@/components/SubmitButton'
import { createLease, updateLease, deleteLease } from '@/app/actions/leases'
import type { Lease, Unit, Tenant, Building } from '@/types'

function LeaseForm({
  lease,
  units,
  tenants,
  action,
}: {
  lease?: Lease
  units: (Unit & { building?: Building })[]
  tenants: Tenant[]
  action: (prevState: any, formData: FormData) => Promise<any>
}) {
  const [state, formAction] = useActionState(action, null)
  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{state.error}</p>
      )}
      <div className="grid grid-cols-2 gap-4">
        {!lease && (
          <>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
              <select
                name="unit_id"
                required
                defaultValue=""
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select unit…</option>
                {units
                  .filter((u) => u.status === 'vacant')
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.building?.name} — Unit {u.unit_number}
                    </option>
                  ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tenant</label>
              <select
                name="tenant_id"
                required
                defaultValue=""
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select tenant…</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.first_name} {t.last_name}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input
            name="start_date"
            type="date"
            required
            defaultValue={lease?.start_date}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input
            name="end_date"
            type="date"
            required
            defaultValue={lease?.end_date}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Rent ($)</label>
          <input
            name="rent_amount"
            type="number"
            required
            min="0"
            step="0.01"
            defaultValue={lease?.rent_amount}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="1500.00"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Deposit ($)</label>
          <input
            name="deposit_amount"
            type="number"
            min="0"
            step="0.01"
            defaultValue={lease?.deposit_amount ?? 0}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="1500.00"
          />
        </div>
        {lease && (
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              name="status"
              defaultValue={lease.status}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="terminated">Terminated</option>
            </select>
          </div>
        )}
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <SubmitButton label={lease ? 'Save Changes' : 'Create Lease'} />
      </div>
    </form>
  )
}

const statusColors: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  expired: 'bg-gray-100 text-gray-600',
  terminated: 'bg-red-100 text-red-700',
}

export default function LeasesClient({
  leases,
  units,
  tenants,
}: {
  leases: Lease[]
  units: (Unit & { building?: Building })[]
  tenants: Tenant[]
}) {
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<Lease | null>(null)
  const [createKey, setCreateKey] = useState(0)
  const [editKey, setEditKey] = useState(0)
  const [filter, setFilter] = useState<'all' | 'active' | 'expired' | 'terminated'>('all')

  const createAction = async (prevState: any, formData: FormData) => {
    const result = await createLease(prevState, formData)
    if (result?.success) setShowCreate(false)
    return result
  }

  const editAction = async (prevState: any, formData: FormData) => {
    if (!editing) return prevState
    const result = await updateLease(editing.id, prevState, formData)
    if (result?.success) setEditing(null)
    return result
  }

  const handleDelete = async (lease: Lease) => {
    if (!confirm('Delete this lease?')) return
    await deleteLease(lease.id, lease.unit_id)
  }

  const filtered = filter === 'all' ? leases : leases.filter((l) => l.status === filter)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leases</h1>
          <p className="text-gray-500 mt-1">
            {leases.filter((l) => l.status === 'active').length} active
          </p>
        </div>
        <button
          onClick={() => { setCreateKey((k) => k + 1); setShowCreate(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus size={16} />
          New Lease
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        {(['all', 'active', 'expired', 'terminated'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              filter === f
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <FileText size={40} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">No leases found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Tenant</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Unit</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Period</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Rent</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Status</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center shrink-0 text-indigo-700 font-semibold text-sm">
                        {l.tenant?.first_name?.[0]}{l.tenant?.last_name?.[0]}
                      </div>
                      <span className="font-medium text-gray-900">
                        {l.tenant?.first_name} {l.tenant?.last_name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div>{l.unit?.building?.name}</div>
                    <div className="text-gray-400">Unit {l.unit?.unit_number}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div>{l.start_date}</div>
                    <div className="text-gray-400">→ {l.end_date}</div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    ${Number(l.rent_amount).toLocaleString()}/mo
                    <div className="text-xs text-gray-400 font-normal">
                      ${Number(l.deposit_amount).toLocaleString()} dep.
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[l.status]}`}>
                      {l.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => { setEditKey((k) => k + 1); setEditing(l) }}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(l)}
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

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Lease">
        <LeaseForm key={createKey} units={units} tenants={tenants} action={createAction} />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Lease">
        {editing && (
          <LeaseForm key={editKey} lease={editing} units={units} tenants={tenants} action={editAction} />
        )}
      </Modal>
    </div>
  )
}
