'use client'

import { useActionState, useState } from 'react'
import { Plus, Pencil, Trash2, DoorOpen } from 'lucide-react'
import Modal from '@/components/Modal'
import SubmitButton from '@/components/SubmitButton'
import { createUnit, updateUnit, deleteUnit } from '@/app/actions/units'
import type { Unit, Building } from '@/types'

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
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{state.error}</p>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Building</label>
          <select
            name="building_id"
            required
            defaultValue={unit?.building_id ?? ''}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select building…</option>
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Unit Number</label>
          <input
            name="unit_number"
            required
            defaultValue={unit?.unit_number}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="1A"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Floor</label>
          <input
            name="floor"
            type="number"
            defaultValue={unit?.floor ?? ''}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bedrooms</label>
          <input
            name="bedrooms"
            type="number"
            required
            min="0"
            defaultValue={unit?.bedrooms ?? 1}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bathrooms</label>
          <input
            name="bathrooms"
            type="number"
            required
            min="0"
            step="0.5"
            defaultValue={unit?.bathrooms ?? 1}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sq Ft</label>
          <input
            name="sqft"
            type="number"
            defaultValue={unit?.sqft ?? ''}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="750"
          />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <SubmitButton label={unit ? 'Save Changes' : 'Create Unit'} />
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
          <h1 className="text-2xl font-bold text-gray-900">Units</h1>
          <p className="text-gray-500 mt-1">{units.length} total · {units.filter(u => u.status === 'vacant').length} vacant</p>
        </div>
        <button
          onClick={() => { setCreateKey((k) => k + 1); setShowCreate(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus size={16} />
          Add Unit
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        {(['all', 'occupied', 'vacant'] as const).map((f) => (
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
          <DoorOpen size={40} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">No units found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Unit</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Building</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Details</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Status</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                        <DoorOpen size={14} className="text-slate-600" />
                      </div>
                      <span className="font-medium text-gray-900">Unit {u.unit_number}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{u.building?.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {u.bedrooms}bd · {u.bathrooms}ba{u.sqft ? ` · ${u.sqft.toLocaleString()} sqft` : ''}
                    {u.floor ? ` · Floor ${u.floor}` : ''}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block text-xs px-2.5 py-1 rounded-full font-medium ${
                        u.status === 'occupied'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => { setEditKey((k) => k + 1); setEditing(u) }}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(u.id)}
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

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add Unit">
        <UnitForm key={createKey} buildings={buildings} action={createAction} />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Unit">
        {editing && (
          <UnitForm key={editKey} unit={editing} buildings={buildings} action={editAction} />
        )}
      </Modal>
    </div>
  )
}
