'use client'

import { useActionState, useState } from 'react'
import { Plus, Pencil, Trash2, DoorOpen } from 'lucide-react'
import Modal from '@/components/Modal'
import SubmitButton from '@/components/SubmitButton'
import { createUnit, updateUnit, deleteUnit } from '@/app/actions/units'
import type { Unit, Building } from '@/types'

const input =
  'w-full border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 transition-colors'
const selectCls =
  'w-full border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 transition-colors bg-white'
const label = 'block text-xs font-medium text-zinc-600 mb-1.5'

const statusBadge: Record<string, string> = {
  occupied: 'bg-blue-50 text-blue-700 border border-blue-100',
  vacant: 'bg-zinc-100 text-zinc-600',
}

function UnitForm({
  unit,
  buildings,
  action,
}: {
  unit?: Unit
  buildings: Building[]
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
        <div className="col-span-2">
          <label className={label}>Building</label>
          <select name="building_id" required defaultValue={unit?.building_id ?? ''} className={selectCls}>
            <option value="">Select building…</option>
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Unit number</label>
          <input name="unit_number" required defaultValue={unit?.unit_number} className={input} placeholder="1A" />
        </div>
        <div>
          <label className={label}>Floor</label>
          <input name="floor" type="number" defaultValue={unit?.floor ?? ''} className={input} placeholder="1" />
        </div>
        <div>
          <label className={label}>Bedrooms</label>
          <input name="bedrooms" type="number" required min="0" defaultValue={unit?.bedrooms ?? 1} className={input} />
        </div>
        <div>
          <label className={label}>Bathrooms</label>
          <input name="bathrooms" type="number" required min="0" step="0.5" defaultValue={unit?.bathrooms ?? 1} className={input} />
        </div>
        <div>
          <label className={label}>Sq ft</label>
          <input name="sqft" type="number" defaultValue={unit?.sqft ?? ''} className={input} placeholder="750" />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-1 border-t border-zinc-100">
        <SubmitButton label={unit ? 'Save changes' : 'Create unit'} />
      </div>
    </form>
  )
}

export default function UnitsClient({
  units,
  buildings,
}: {
  units: Unit[]
  buildings: Building[]
}) {
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<Unit | null>(null)
  const [createKey, setCreateKey] = useState(0)
  const [editKey, setEditKey] = useState(0)
  const [filter, setFilter] = useState<'all' | 'vacant' | 'occupied'>('all')

  const createAction = async (prevState: any, formData: FormData) => {
    const result = await createUnit(prevState, formData)
    if (result?.success) setShowCreate(false)
    return result
  }
  const editAction = async (prevState: any, formData: FormData) => {
    if (!editing) return prevState
    const result = await updateUnit(editing.id, prevState, formData)
    if (result?.success) setEditing(null)
    return result
  }
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this unit?')) return
    await deleteUnit(id)
  }

  const filtered = filter === 'all' ? units : units.filter((u) => u.status === filter)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Units</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {units.length} total · {units.filter((u) => u.status === 'vacant').length} vacant
          </p>
        </div>
        <button
          onClick={() => { setCreateKey((k) => k + 1); setShowCreate(true) }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 text-white text-sm font-medium rounded-md hover:bg-zinc-700 transition-colors"
        >
          <Plus size={14} />
          Add unit
        </button>
      </div>

      <div className="flex gap-1 mb-4">
        {(['all', 'occupied', 'vacant'] as const).map((f) => (
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
          <DoorOpen size={28} className="mx-auto text-zinc-200 mb-3" />
          <p className="text-sm font-medium text-zinc-500">No units found</p>
        </div>
      ) : (
        <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="text-left text-xs font-medium text-zinc-400 px-4 py-3">Unit</th>
                <th className="text-left text-xs font-medium text-zinc-400 px-4 py-3">Building</th>
                <th className="text-left text-xs font-medium text-zinc-400 px-4 py-3">Details</th>
                <th className="text-left text-xs font-medium text-zinc-400 px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-zinc-900">
                    Unit {u.unit_number}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-500">{u.building?.name}</td>
                  <td className="px-4 py-3 text-sm text-zinc-500">
                    {u.bedrooms}bd · {u.bathrooms}ba
                    {u.sqft ? ` · ${u.sqft.toLocaleString()} sqft` : ''}
                    {u.floor ? ` · Fl ${u.floor}` : ''}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge[u.status]}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => { setEditKey((k) => k + 1); setEditing(u) }}
                        className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-md transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(u.id)}
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

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add unit">
        <UnitForm key={createKey} buildings={buildings} action={createAction} />
      </Modal>
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit unit">
        {editing && <UnitForm key={editKey} unit={editing} buildings={buildings} action={editAction} />}
      </Modal>
    </div>
  )
}
