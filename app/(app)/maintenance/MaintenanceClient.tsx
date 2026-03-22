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
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{state.error}</p>
      )}
      <div className="grid grid-cols-2 gap-4">
        {!request && (
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
            <select
              name="unit_id"
              required
              defaultValue=""
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            name="title"
            required
            defaultValue={request?.title}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Leaking faucet in bathroom"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            name="description"
            defaultValue={request?.description ?? ''}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            placeholder="Additional details about the issue…"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
          <select
            name="priority"
            defaultValue={request?.priority ?? 'medium'}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        {request && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              name="status"
              defaultValue={request.status}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        )}
        {request && (
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              name="notes"
              defaultValue={request?.notes ?? ''}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="Resolution notes, parts ordered, etc."
            />
          </div>
        )}
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <SubmitButton label={request ? 'Save Changes' : 'Submit Request'} />
      </div>
    </form>
  )
}

const priorityColors: Record<string, string> = {
  urgent: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-gray-100 text-gray-600',
}

const statusColors: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-indigo-100 text-indigo-700',
  completed: 'bg-emerald-100 text-emerald-700',
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
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'completed'>('all')
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
    if (!confirm('Delete this maintenance request?')) return
    await deleteMaintenanceRequest(id)
  }

  const filtered = requests.filter((r) => {
    if (filter !== 'all' && r.status !== filter) return false
    if (priorityFilter !== 'all' && r.priority !== priorityFilter) return false
    return true
  })

  const openCount = requests.filter((r) => r.status === 'open').length
  const inProgressCount = requests.filter((r) => r.status === 'in_progress').length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Maintenance</h1>
          <p className="text-gray-500 mt-1">
            {openCount} open · {inProgressCount} in progress
          </p>
        </div>
        <button
          onClick={() => { setCreateKey((k) => k + 1); setShowCreate(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus size={16} />
          New Request
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <div className="flex gap-1.5">
          {(['all', 'open', 'in_progress', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                filter === f
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f === 'in_progress' ? 'In Progress' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5 ml-auto">
          {(['all', 'urgent', 'high', 'medium', 'low'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                priorityFilter === p
                  ? 'bg-slate-700 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <Wrench size={40} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">No maintenance requests found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Issue</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Unit</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Priority</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Created</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{r.title}</p>
                      {r.description && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{r.description}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div>{r.unit?.building?.name}</div>
                    <div className="text-gray-400">Unit {r.unit?.unit_number}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-medium ${priorityColors[r.priority]}`}>
                      {r.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[r.status]}`}>
                      {r.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(r.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => { setEditKey((k) => k + 1); setEditing(r) }}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(r.id)}
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

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Maintenance Request">
        <MaintenanceForm key={createKey} units={units} action={createAction} />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Update Request">
        {editing && (
          <MaintenanceForm key={editKey} request={editing} units={units} action={editAction} />
        )}
      </Modal>
    </div>
  )
}
