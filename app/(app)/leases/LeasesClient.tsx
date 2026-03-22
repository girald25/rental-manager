'use client'

import { useActionState, useState } from 'react'
import { Plus, Pencil, Trash2, FileText } from 'lucide-react'
import Modal from '@/components/Modal'
import SubmitButton from '@/components/SubmitButton'
import { createLease, updateLease, deleteLease } from '@/app/actions/leases'
import type { Lease, Unit, Tenant, Building } from '@/types'

const input =
  'w-full border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 transition-colors'
const selectCls =
  'w-full border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 transition-colors bg-white'
const label = 'block text-xs font-medium text-zinc-600 mb-1.5'

const statusBadge: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  expired: 'bg-zinc-100 text-zinc-500',
  terminated: 'bg-red-50 text-red-600 border border-red-100',
}

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
        <p className="text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-md">
          {state.error}
        </p>
      )}
      <div className="grid grid-cols-2 gap-3">
        {!lease && (
          <>
            <div className="col-span-2">
              <label className={label}>Unit</label>
              <select name="unit_id" required defaultValue="" className={selectCls}>
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
              <label className={label}>Tenant</label>
              <select name="tenant_id" required defaultValue="" className={selectCls}>
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
          <label className={label}>Start date</label>
          <input name="start_date" type="date" required defaultValue={lease?.start_date} className={input} />
        </div>
        <div>
          <label className={label}>End date</label>
          <input name="end_date" type="date" required defaultValue={lease?.end_date} className={input} />
        </div>
        <div>
          <label className={label}>Monthly rent ($)</label>
          <input name="rent_amount" type="number" required min="0" step="0.01" defaultValue={lease?.rent_amount} className={input} placeholder="1500.00" />
        </div>
        <div>
          <label className={label}>Deposit ($)</label>
          <input name="deposit_amount" type="number" min="0" step="0.01" defaultValue={lease?.deposit_amount ?? 0} className={input} placeholder="1500.00" />
        </div>
        {lease && (
          <div className="col-span-2">
            <label className={label}>Status</label>
            <select name="status" defaultValue={lease.status} className={selectCls}>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="terminated">Terminated</option>
            </select>
          </div>
        )}
      </div>
      <div className="flex justify-end gap-2 pt-1 border-t border-zinc-100">
        <SubmitButton label={lease ? 'Save changes' : 'Create lease'} />
      </div>
    </form>
  )
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
          <h1 className="text-xl font-semibold text-zinc-900">Leases</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {leases.filter((l) => l.status === 'active').length} active
          </p>
        </div>
        <button
          onClick={() => { setCreateKey((k) => k + 1); setShowCreate(true) }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 text-white text-sm font-medium rounded-md hover:bg-zinc-700 transition-colors"
        >
          <Plus size={14} />
          New lease
        </button>
      </div>

      <div className="flex gap-1 mb-4">
        {(['all', 'active', 'expired', 'terminated'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              filter === f ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-lg p-16 text-center">
          <FileText size={28} className="mx-auto text-zinc-200 mb-3" />
          <p className="text-sm font-medium text-zinc-500">No leases found</p>
        </div>
      ) : (
        <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="text-left text-xs font-medium text-zinc-400 px-4 py-3">Tenant</th>
                <th className="text-left text-xs font-medium text-zinc-400 px-4 py-3">Unit</th>
                <th className="text-left text-xs font-medium text-zinc-400 px-4 py-3">Period</th>
                <th className="text-left text-xs font-medium text-zinc-400 px-4 py-3">Rent</th>
                <th className="text-left text-xs font-medium text-zinc-400 px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {filtered.map((l) => (
                <tr key={l.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 bg-zinc-100 rounded-full flex items-center justify-center shrink-0 text-zinc-600 text-[10px] font-semibold">
                        {l.tenant?.first_name?.[0]}{l.tenant?.last_name?.[0]}
                      </div>
                      <span className="text-sm font-medium text-zinc-900">
                        {l.tenant?.first_name} {l.tenant?.last_name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-500">
                    <span>{l.unit?.building?.name}</span>
                    <span className="text-zinc-300 mx-1">·</span>
                    <span>Unit {l.unit?.unit_number}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-500 tabular-nums">
                    {l.start_date} → {l.end_date}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-zinc-900 tabular-nums">
                      ${Number(l.rent_amount).toLocaleString()}
                    </span>
                    <span className="text-xs text-zinc-400">/mo</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge[l.status]}`}>
                      {l.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => { setEditKey((k) => k + 1); setEditing(l) }}
                        className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-md transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(l)}
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

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New lease">
        <LeaseForm key={createKey} units={units} tenants={tenants} action={createAction} />
      </Modal>
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit lease">
        {editing && (
          <LeaseForm key={editKey} lease={editing} units={units} tenants={tenants} action={editAction} />
        )}
      </Modal>
    </div>
  )
}
