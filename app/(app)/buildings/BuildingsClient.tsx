'use client'

import { useActionState, useState } from 'react'
import { Plus, Pencil, Trash2, Building2 } from 'lucide-react'
import Modal from '@/components/Modal'
import SubmitButton from '@/components/SubmitButton'
import { createBuilding, updateBuilding, deleteBuilding } from '@/app/actions/buildings'
import type { Building } from '@/types'

const input =
  'w-full border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 transition-colors'
const label = 'block text-xs font-medium text-zinc-600 mb-1.5'

function BuildingForm({
  building,
  action,
}: {
  building?: Building
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
          <label className={label}>Building name</label>
          <input name="name" required defaultValue={building?.name} className={input} placeholder="Maple Apartments" />
        </div>
        <div className="col-span-2">
          <label className={label}>Address</label>
          <input name="address" required defaultValue={building?.address} className={input} placeholder="123 Main St" />
        </div>
        <div>
          <label className={label}>City</label>
          <input name="city" required defaultValue={building?.city} className={input} placeholder="Austin" />
        </div>
        <div>
          <label className={label}>State</label>
          <input name="state" required defaultValue={building?.state} className={input} placeholder="TX" />
        </div>
        <div>
          <label className={label}>ZIP</label>
          <input name="zip" required defaultValue={building?.zip} className={input} placeholder="78701" />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-1 border-t border-zinc-100">
        <SubmitButton label={building ? 'Save changes' : 'Create building'} />
      </div>
    </form>
  )
}

export default function BuildingsClient({
  buildings,
  unitCounts,
}: {
  buildings: Building[]
  unitCounts: Record<string, number>
}) {
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<Building | null>(null)
  const [createKey, setCreateKey] = useState(0)
  const [editKey, setEditKey] = useState(0)

  const createAction = async (prevState: any, formData: FormData) => {
    const result = await createBuilding(prevState, formData)
    if (result?.success) setShowCreate(false)
    return result
  }
  const editAction = async (prevState: any, formData: FormData) => {
    if (!editing) return prevState
    const result = await updateBuilding(editing.id, prevState, formData)
    if (result?.success) setEditing(null)
    return result
  }
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this building and all its units?')) return
    await deleteBuilding(id)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Buildings</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {buildings.length} building{buildings.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => { setCreateKey((k) => k + 1); setShowCreate(true) }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 text-white text-sm font-medium rounded-md hover:bg-zinc-700 transition-colors"
        >
          <Plus size={14} />
          Add building
        </button>
      </div>

      {buildings.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-lg p-16 text-center">
          <Building2 size={28} className="mx-auto text-zinc-200 mb-3" />
          <p className="text-sm font-medium text-zinc-500">No buildings yet</p>
          <p className="text-xs text-zinc-400 mt-1">Add your first building to get started</p>
        </div>
      ) : (
        <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="text-left text-xs font-medium text-zinc-400 px-4 py-3">Name</th>
                <th className="text-left text-xs font-medium text-zinc-400 px-4 py-3">Address</th>
                <th className="text-left text-xs font-medium text-zinc-400 px-4 py-3">Units</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {buildings.map((b) => (
                <tr key={b.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-zinc-900">{b.name}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-500">
                    {b.address}, {b.city}, {b.state} {b.zip}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-500">
                    {unitCounts[b.id] ?? 0}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => { setEditKey((k) => k + 1); setEditing(b) }}
                        className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-md transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(b.id)}
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

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add building">
        <BuildingForm key={createKey} action={createAction} />
      </Modal>
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit building">
        {editing && <BuildingForm key={editKey} building={editing} action={editAction} />}
      </Modal>
    </div>
  )
}
