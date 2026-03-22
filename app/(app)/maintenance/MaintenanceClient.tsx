'use client'

import { useActionState, useState } from 'react'
import { Plus, Pencil, Trash2, Wrench } from 'lucide-react'
import Modal from '@/components/Modal'
import SubmitButton from '@/components/SubmitButton'
import {
  createMaintenanceRequest,
  updateMaintenanceRequest,
  deleteMaintenanceRequest,
} from '@/app/actions/maintenance'
import type { MaintenanceRequest, Unit, Building } from '@/types'

const input =
  'w-full border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 transition-colors'
const selectCls =
  'w-full border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 transition-colors bg-white'
const label = 'block text-xs font-medium text-zinc-600 mb-1.5'

const priorityBadge: Record<string, string> = {
  urgent: 'bg-red-50 text-red-700 border border-red-100',
  high: 'bg-orange-50 text-orange-700 border border-orange-100',
  medium: 'bg-amber-50 text-amber-700 border border-amber-100',
  low: 'bg-zinc-100 text-zinc-500',
}

const statusBadge: Record<string, string> = {
  open: 'bg-zinc-100 text-zinc-600',
  in_progress: 'bg-blue-50 text-blue-700 border border-blue-100',
  completed: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
}

function MaintenanceForm({
  request,
  units,
  action,
}: {
  request?: MaintenanceRequest
  units: (Unit & { building?: Building })[]
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
        {!request && (
          <div className="col-span-2">
            <label className={label}>Unit</label>
            <select name="unit_id" required defaultValue="" className={selectCls}>
              <option value="">Select unit…</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.building?.name} — Unit {u.unit_number}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="col-span-2">
          <label className={label}>Title</label>
          <input name="title" required defaultValue={request?.title} className={input} placeholder="Leaking faucet in bathroom" />
        </div>
        <div className="col-span-2">
          <label className={label}>Description</label>
          <textarea name="description" defaultValue={request?.description ?? ''} rows={3} className={`${input} resize-none`} placeholder="Additional details…" />
        </div>
        <div>
          <label className={label}>Priority</label>
          <select name="priority" defaultValue={request?.priority ?? 'medium'} className={selectCls}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        {request && (
          <div>
            <label className={label}>Status</label>
            <select name="status" defaultValue={request.status} className={selectCls}>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        )}
        {request && (
          <div className="col-span-2">
            <label className={label}>Notes</label>
            <textarea name="notes" defaultValue={request?.notes ?? ''} rows={2} className={`${input} resize-none`} placeholder="Resolution notes, parts ordered…" />
          </div>
        )}
      </div>
      <div className="flex justify-end gap-2 pt-1 border-t border-zinc-100">
        <SubmitButton label={request ? 'Save changes' : 'Submit request'} />
      </div>
    </form>
  )
}

export default function MaintenanceClient({
  requests,
  units,
}: {
  requests: MaintenanceRequest[]
  units: (Unit & { building?: Building })[]
}) {
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<MaintenanceRequest | null>(null)
  const [createKey, setCreateKey] = useState(0)
  const [editKey, setEditKey] = useState(0)
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in_progress' | 'completed'>('all')
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'urgent' | 'high' | 'medium' | 'low'>('all')

  const createAction = async (prevState: any, formData: FormData) => {
    const result = await createMaintenanceRequest(prevState, formData)
    if (result?.success) setShowCreate(false)
    return result
  }
  const editAction = async (prevState: any, formData: FormData) => {
    if (!editing) return prevState
    const result = await updateMaintenanceRequest(editing.id, prevState, formData)
    if (result?.success) setEditing(null)
    return result
  }
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this request?')) return
    await deleteMaintenanceRequest(id)
  }

  const filtered = requests.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false
    if (priorityFilter !== 'all' && r.priority !== priorityFilter) return false
    return true
  })

  const openCount = requests.filter((r) => r.status === 'open').length
  const inProgressCount = requests.filter((r) => r.status === 'in_progress').length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Maintenance</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {openCount} open · {inProgressCount} in progress
          </p>
        </div>
        <button
          onClick={() => { setCreateKey((k) => k + 1); setShowCreate(true) }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 text-white text-sm font-medium rounded-md hover:bg-zinc-700 transition-colors"
        >
          <Plus size={14} />
          New request
        </button>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="flex gap-1">
          {(['all', 'open', 'in_progress', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                statusFilter === f ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'
              }`}
            >
              {f === 'in_progress' ? 'In progress' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div className="h-4 w-px bg-zinc-200" />
        <div className="flex gap-1">
          {(['all', 'urgent', 'high', 'medium', 'low'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                priorityFilter === p ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:bg-zinc-100'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-lg p-16 text-center">
          <Wrench size={28} className="mx-auto text-zinc-200 mb-3" />
          <p className="text-sm font-medium text-zinc-500">No requests found</p>
        </div>
      ) : (
        <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="text-left text-xs font-medium text-zinc-400 px-4 py-3">Issue</th>
                <th className="text-left text-xs font-medium text-zinc-400 px-4 py-3">Unit</th>
                <th className="text-left text-xs font-medium text-zinc-400 px-4 py-3">Priority</th>
                <th className="text-left text-xs font-medium text-zinc-400 px-4 py-3">Status</th>
                <th className="text-left text-xs font-medium text-zinc-400 px-4 py-3">Created</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-zinc-900">{r.title}</p>
                    {r.description && (
                      <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">{r.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-500">
                    {r.unit?.building?.name}
                    <span className="text-zinc-300 mx-1">·</span>
                    Unit {r.unit?.unit_number}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityBadge[r.priority]}`}>
                      {r.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge[r.status]}`}>
                      {r.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-400 tabular-nums">
                    {new Date(r.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => { setEditKey((k) => k + 1); setEditing(r) }}
                        className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-md transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(r.id)}
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

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New maintenance request">
        <MaintenanceForm key={createKey} units={units} action={createAction} />
      </Modal>
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Update request">
        {editing && (
          <MaintenanceForm key={editKey} request={editing} units={units} action={editAction} />
        )}
      </Modal>
    </div>
  )
}
