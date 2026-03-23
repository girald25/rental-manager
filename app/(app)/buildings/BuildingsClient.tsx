'use client'

import { useActionState, useState } from 'react'
import { Plus, Pencil, Trash2, Building2 } from 'lucide-react'
import Modal from '@/components/Modal'
import SubmitButton from '@/components/SubmitButton'
import { createBuilding, updateBuilding, deleteBuilding } from '@/app/actions/buildings'
import type { Building } from '@/types'

const input =
  'w-full border border-[#e8edf0] dark:border-[#2d3148] rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-slate-100 placeholder:text-[#94a3b8] dark:placeholder:text-slate-500 bg-white dark:bg-[#252836] focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors'
const label = 'block text-xs font-medium text-[#64748b] dark:text-slate-400 mb-1.5'

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
        <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 px-3 py-2 rounded-md">
          {state.error}
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="col-span-1 sm:col-span-2">
          <label className={label}>Nombre del edificio</label>
          <input name="name" required defaultValue={building?.name} className={input} placeholder="Cond. Los Robles" />
        </div>
        <div className="col-span-1 sm:col-span-2">
          <label className={label}>Dirección</label>
          <input name="address" required defaultValue={building?.address} className={input} placeholder="123 Calle Principal" />
        </div>
        <div>
          <label className={label}>Ciudad</label>
          <input name="city" required defaultValue={building?.city} className={input} placeholder="San Juan" />
        </div>
        <div>
          <label className={label}>Estado</label>
          <input name="state" required defaultValue={building?.state} className={input} placeholder="PR" />
        </div>
        <div>
          <label className={label}>Código postal</label>
          <input name="zip" required defaultValue={building?.zip} className={input} placeholder="00901" />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-1 border-t border-[#f0f4f0] dark:border-[#2d3148]">
        <SubmitButton label={building ? 'Guardar cambios' : 'Crear edificio'} />
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
    if (!confirm('¿Eliminar este edificio y todas sus unidades?')) return
    await deleteBuilding(id)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[#1a1a2e] dark:text-slate-100">Edificios</h1>
          <p className="text-sm text-[#64748b] dark:text-slate-400 mt-0.5">
            {buildings.length} edificio{buildings.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => { setCreateKey((k) => k + 1); setShowCreate(true) }}
          className="flex items-center gap-1.5 px-3 py-2.5 md:py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-500 transition-colors min-h-[44px] md:min-h-0"
        >
          <Plus size={14} />
          Añadir edificio
        </button>
      </div>

      {buildings.length === 0 ? (
        <div className="bg-white dark:bg-[#1e2130] border border-[#e8edf0] dark:border-[#2d3148] rounded-2xl p-8 md:p-16 text-center shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <Building2 size={28} className="mx-auto text-zinc-200 dark:text-slate-700 mb-3" />
          <p className="text-sm font-medium text-[#64748b] dark:text-slate-400">Sin edificios aún</p>
          <p className="text-xs text-[#94a3b8] dark:text-slate-500 mt-1">Agrega tu primer edificio para comenzar</p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {buildings.map((b) => (
              <div key={b.id} className="bg-white dark:bg-[#1e2130] border border-[#e8edf0] dark:border-[#2d3148] rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1a1a2e] dark:text-slate-100">{b.name}</p>
                    <p className="text-xs text-[#64748b] dark:text-slate-400 mt-0.5">{b.address}, {b.city}, {b.state} {b.zip}</p>
                    <p className="text-xs text-[#94a3b8] dark:text-slate-500 mt-1.5">{unitCounts[b.id] ?? 0} unidades</p>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      onClick={() => { setEditKey((k) => k + 1); setEditing(b) }}
                      className="p-2.5 text-zinc-400 dark:text-slate-500 hover:text-zinc-700 dark:hover:text-slate-100 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-md transition-colors"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(b.id)}
                      className="p-2.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-white dark:bg-[#1e2130] border border-[#e8edf0] dark:border-[#2d3148] rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#f0f4f0] dark:border-[#2d3148]">
                  <th className="text-left text-xs font-medium text-[#94a3b8] dark:text-slate-500 uppercase tracking-wide px-4 py-3">Nombre</th>
                  <th className="text-left text-xs font-medium text-[#94a3b8] dark:text-slate-500 uppercase tracking-wide px-4 py-3">Dirección</th>
                  <th className="text-left text-xs font-medium text-[#94a3b8] dark:text-slate-500 uppercase tracking-wide px-4 py-3">Unidades</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f8fafc] dark:divide-[#252836]">
                {buildings.map((b) => (
                  <tr key={b.id} className="hover:bg-[#fafbfc] dark:hover:bg-[#252836] transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-[#1a1a2e] dark:text-slate-100">{b.name}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#64748b] dark:text-slate-400">
                      {b.address}, {b.city}, {b.state} {b.zip}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#64748b] dark:text-slate-400">
                      {unitCounts[b.id] ?? 0}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setEditKey((k) => k + 1); setEditing(b) }}
                          className="p-1.5 text-zinc-400 dark:text-slate-500 hover:text-zinc-700 dark:hover:text-slate-100 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-md transition-colors"
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
        </>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Añadir edificio">
        <BuildingForm key={createKey} action={createAction} />
      </Modal>
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar edificio">
        {editing && <BuildingForm key={editKey} building={editing} action={editAction} />}
      </Modal>
    </div>
  )
}
