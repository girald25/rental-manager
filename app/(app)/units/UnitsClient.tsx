'use client'

import { useActionState, useState } from 'react'
import { Plus, Pencil, Trash2, DoorOpen } from 'lucide-react'
import Modal from '@/components/Modal'
import SubmitButton from '@/components/SubmitButton'
import { createUnit, updateUnit, deleteUnit } from '@/app/actions/units'
import type { Unit, Building } from '@/types'

const input =
  'w-full border border-[#e8edf0] dark:border-[#2d3148] rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-slate-100 placeholder:text-[#94a3b8] dark:placeholder:text-slate-500 bg-white dark:bg-[#252836] focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors'
const selectCls =
  'w-full border border-[#e8edf0] dark:border-[#2d3148] rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors bg-white dark:bg-[#252836]'
const label = 'block text-xs font-medium text-[#64748b] dark:text-slate-400 mb-1.5'

const statusBadge: Record<string, string> = {
  occupied: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20',
  vacant: 'bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-slate-400',
}
const statusLabel: Record<string, string> = {
  occupied: 'Ocupado',
  vacant: 'Vacante',
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
        <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 px-3 py-2 rounded-md">
          {state.error}
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="col-span-1 sm:col-span-2">
          <label className={label}>Edificio</label>
          <select name="building_id" required defaultValue={unit?.building_id ?? ''} className={selectCls}>
            <option value="">Seleccionar edificio…</option>
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Número de unidad</label>
          <input name="unit_number" required defaultValue={unit?.unit_number} className={input} placeholder="1A" />
        </div>
        <div>
          <label className={label}>Piso</label>
          <input name="floor" type="number" defaultValue={unit?.floor ?? ''} className={input} placeholder="1" />
        </div>
        <div>
          <label className={label}>Habitaciones</label>
          <input name="bedrooms" type="number" required min="0" defaultValue={unit?.bedrooms ?? 1} className={input} />
        </div>
        <div>
          <label className={label}>Baños</label>
          <input name="bathrooms" type="number" required min="0" step="0.5" defaultValue={unit?.bathrooms ?? 1} className={input} />
        </div>
        <div>
          <label className={label}>Pies cuadrados</label>
          <input name="sqft" type="number" defaultValue={unit?.sqft ?? ''} className={input} placeholder="750" />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-1 border-t border-[#f0f4f0] dark:border-[#2d3148]">
        <SubmitButton label={unit ? 'Guardar cambios' : 'Crear unidad'} />
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
    if (!confirm('¿Eliminar esta unidad?')) return
    await deleteUnit(id)
  }

  const filtered = filter === 'all' ? units : units.filter((u) => u.status === filter)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[#1a1a2e] dark:text-slate-100">Unidades</h1>
          <p className="text-sm text-[#64748b] dark:text-slate-400 mt-0.5">
            {units.length} total · {units.filter((u) => u.status === 'vacant').length} vacantes
          </p>
        </div>
        <button
          onClick={() => { setCreateKey((k) => k + 1); setShowCreate(true) }}
          className="flex items-center gap-1.5 px-3 py-2.5 md:py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-500 transition-colors min-h-[44px] md:min-h-0"
        >
          <Plus size={14} />
          Añadir unidad
        </button>
      </div>

      <div className="flex gap-1 mb-4">
        {(['all', 'occupied', 'vacant'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-full transition-colors min-h-[36px] ${
              filter === f ? 'bg-emerald-500 text-white' : 'text-zinc-600 dark:text-slate-400 hover:bg-zinc-100 dark:hover:bg-white/5'
            }`}
          >
            {f === 'all' ? 'Todos' : f === 'occupied' ? 'Ocupado' : 'Vacante'}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-[#1e2130] border border-[#e8edf0] dark:border-[#2d3148] rounded-2xl p-8 md:p-16 text-center shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <DoorOpen size={28} className="mx-auto text-zinc-200 dark:text-slate-700 mb-3" />
          <p className="text-sm font-medium text-[#64748b] dark:text-slate-400">Sin unidades</p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {filtered.map((u) => (
              <div key={u.id} className="bg-white dark:bg-[#1e2130] border border-[#e8edf0] dark:border-[#2d3148] rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-[#1a1a2e] dark:text-slate-100">Unidad {u.unit_number}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge[u.status]}`}>
                        {statusLabel[u.status] ?? u.status}
                      </span>
                    </div>
                    <p className="text-xs text-[#64748b] dark:text-slate-400 mt-0.5">{u.building?.name}</p>
                    <p className="text-xs text-[#94a3b8] dark:text-slate-500 mt-1">
                      {u.bedrooms}hab · {u.bathrooms}ba
                      {u.sqft ? ` · ${u.sqft.toLocaleString()} pie²` : ''}
                      {u.floor ? ` · Piso ${u.floor}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      onClick={() => { setEditKey((k) => k + 1); setEditing(u) }}
                      className="p-2.5 text-zinc-400 dark:text-slate-500 hover:text-zinc-700 dark:hover:text-slate-100 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-md transition-colors"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(u.id)}
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
                  <th className="text-left text-xs font-medium text-[#94a3b8] dark:text-slate-500 uppercase tracking-wide px-4 py-3">Unidad</th>
                  <th className="text-left text-xs font-medium text-[#94a3b8] dark:text-slate-500 uppercase tracking-wide px-4 py-3">Edificio</th>
                  <th className="text-left text-xs font-medium text-[#94a3b8] dark:text-slate-500 uppercase tracking-wide px-4 py-3">Detalles</th>
                  <th className="text-left text-xs font-medium text-[#94a3b8] dark:text-slate-500 uppercase tracking-wide px-4 py-3">Estado</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f8fafc] dark:divide-[#252836]">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-[#fafbfc] dark:hover:bg-[#252836] transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-[#1a1a2e] dark:text-slate-100">
                      Unidad {u.unit_number}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#64748b] dark:text-slate-400">{u.building?.name}</td>
                    <td className="px-4 py-3 text-sm text-[#64748b] dark:text-slate-400">
                      {u.bedrooms}hab · {u.bathrooms}ba
                      {u.sqft ? ` · ${u.sqft.toLocaleString()} pie²` : ''}
                      {u.floor ? ` · Piso ${u.floor}` : ''}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge[u.status]}`}>
                        {statusLabel[u.status] ?? u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setEditKey((k) => k + 1); setEditing(u) }}
                          className="p-1.5 text-zinc-400 dark:text-slate-500 hover:text-zinc-700 dark:hover:text-slate-100 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-md transition-colors"
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
        </>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Añadir unidad">
        <UnitForm key={createKey} buildings={buildings} action={createAction} />
      </Modal>
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar unidad">
        {editing && <UnitForm key={editKey} unit={editing} buildings={buildings} action={editAction} />}
      </Modal>
    </div>
  )
}
