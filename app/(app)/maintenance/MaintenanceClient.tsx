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
  'w-full border border-[#e8edf0] dark:border-[#2d3148] rounded-md px-3 py-2 text-sm text-zinc-900 dark:text-slate-100 placeholder:text-zinc-400 dark:placeholder:text-slate-500 bg-white dark:bg-[#252836] focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:focus:ring-emerald-500 focus:border-emerald-500 dark:focus:border-emerald-500 transition-colors'
const selectCls =
  'w-full border border-[#e8edf0] dark:border-[#2d3148] rounded-md px-3 py-2 text-sm text-zinc-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:focus:ring-emerald-500 focus:border-emerald-500 dark:focus:border-emerald-500 transition-colors bg-white dark:bg-[#252836]'
const label = 'block text-xs font-medium text-zinc-600 dark:text-slate-400 mb-1.5'

const priorityBadge: Record<string, string> = {
  urgent: 'bg-red-50 text-red-700 border border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20',
  high: 'bg-orange-50 text-orange-700 border border-orange-100 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20',
  medium: 'bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
  low: 'bg-zinc-100 text-zinc-500 dark:bg-white/5 dark:text-slate-400',
}
const priorityLabel: Record<string, string> = {
  urgent: 'Urgente', high: 'Alta', medium: 'Media', low: 'Baja',
}

const statusBadge: Record<string, string> = {
  open: 'bg-zinc-100 text-zinc-600 dark:bg-white/5 dark:text-slate-400',
  in_progress: 'bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
  completed: 'bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
}
const statusLabel: Record<string, string> = {
  open: 'Abierto', in_progress: 'En proceso', completed: 'Completado',
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
        <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 px-3 py-2 rounded-md">
          {state.error}
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {!request && (
          <div className="col-span-1 sm:col-span-2">
            <label className={label}>Unidad</label>
            <select name="unit_id" required defaultValue="" className={selectCls}>
              <option value="">Seleccionar unidad…</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.building?.name} — Unidad {u.unit_number}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="col-span-1 sm:col-span-2">
          <label className={label}>Título</label>
          <input name="title" required defaultValue={request?.title} className={input} placeholder="Grifo con fuga en el baño" />
        </div>
        <div className="col-span-1 sm:col-span-2">
          <label className={label}>Descripción</label>
          <textarea name="description" defaultValue={request?.description ?? ''} rows={3} className={`${input} resize-none`} placeholder="Detalles adicionales…" />
        </div>
        <div>
          <label className={label}>Prioridad</label>
          <select name="priority" defaultValue={request?.priority ?? 'medium'} className={selectCls}>
            <option value="low">Baja</option>
            <option value="medium">Media</option>
            <option value="high">Alta</option>
            <option value="urgent">Urgente</option>
          </select>
        </div>
        {request && (
          <div>
            <label className={label}>Estado</label>
            <select name="status" defaultValue={request.status} className={selectCls}>
              <option value="open">Abierto</option>
              <option value="in_progress">En proceso</option>
              <option value="completed">Completado</option>
            </select>
          </div>
        )}
        {request && (
          <div className="col-span-1 sm:col-span-2">
            <label className={label}>Notas</label>
            <textarea name="notes" defaultValue={request?.notes ?? ''} rows={2} className={`${input} resize-none`} placeholder="Notas de resolución, piezas pedidas…" />
          </div>
        )}
      </div>
      <div className="flex justify-end gap-2 pt-1 border-t border-[#f0f4f0] dark:border-[#2d3148]">
        <SubmitButton label={request ? 'Guardar cambios' : 'Enviar solicitud'} />
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
    if (!confirm('¿Eliminar esta solicitud?')) return
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
          <h1 className="text-xl font-semibold text-[#1a1a2e] dark:text-slate-100">Mantenimiento</h1>
          <p className="text-sm text-[#64748b] dark:text-slate-400 mt-0.5">
            {openCount} abiertos · {inProgressCount} en proceso
          </p>
        </div>
        <button
          onClick={() => { setCreateKey((k) => k + 1); setShowCreate(true) }}
          className="flex items-center gap-1.5 px-3 py-2.5 md:py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-500 transition-colors min-h-[44px] md:min-h-0"
        >
          <Plus size={14} />
          Nueva solicitud
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-4">
        <div className="flex gap-1 flex-wrap">
          {(['all', 'open', 'in_progress', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-full transition-colors min-h-[36px] ${
                statusFilter === f ? 'bg-emerald-600 text-white' : 'text-zinc-600 dark:text-slate-400 hover:bg-zinc-100 dark:hover:bg-white/5'
              }`}
            >
              {statusLabel[f] ?? (f === 'all' ? 'Todos' : f)}
            </button>
          ))}
        </div>
        <div className="hidden sm:block h-4 w-px bg-[#e8edf0] dark:bg-[#2d3148]" />
        <div className="flex gap-1 flex-wrap">
          {(['all', 'urgent', 'high', 'medium', 'low'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-full transition-colors min-h-[36px] ${
                priorityFilter === p ? 'bg-emerald-600 text-white' : 'text-zinc-500 dark:text-slate-400 hover:bg-zinc-100 dark:hover:bg-white/5'
              }`}
            >
              {priorityLabel[p] ?? (p === 'all' ? 'Todos' : p)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-[#1e2130] border border-[#e8edf0] dark:border-[#2d3148] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-8 md:p-16 text-center">
          <Wrench size={28} className="mx-auto text-zinc-200 dark:text-slate-700 mb-3" />
          <p className="text-sm font-medium text-[#64748b] dark:text-slate-400">Sin solicitudes</p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {filtered.map((r) => (
              <div key={r.id} className="bg-white dark:bg-[#1e2130] border border-[#e8edf0] dark:border-[#2d3148] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1a1a2e] dark:text-slate-100">{r.title}</p>
                    {r.description && (
                      <p className="text-xs text-[#94a3b8] dark:text-slate-500 mt-0.5 line-clamp-2">{r.description}</p>
                    )}
                    <p className="text-xs text-[#64748b] dark:text-slate-400 mt-1">
                      {r.unit?.building?.name} · Unidad {r.unit?.unit_number}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityBadge[r.priority]}`}>
                        {priorityLabel[r.priority] ?? r.priority}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge[r.status]}`}>
                        {statusLabel[r.status] ?? r.status}
                      </span>
                      <span className="text-xs text-[#94a3b8] dark:text-slate-500">
                        {new Date(r.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      onClick={() => { setEditKey((k) => k + 1); setEditing(r) }}
                      className="p-2.5 text-zinc-400 dark:text-slate-500 hover:text-zinc-700 dark:hover:text-slate-100 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-md transition-colors"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(r.id)}
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
          <div className="hidden md:block bg-white dark:bg-[#1e2130] border border-[#e8edf0] dark:border-[#2d3148] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#f0f4f0] dark:border-[#2d3148]">
                  <th className="text-left text-[11px] font-medium text-[#94a3b8] dark:text-slate-500 uppercase tracking-wide px-4 py-3">Problema</th>
                  <th className="text-left text-[11px] font-medium text-[#94a3b8] dark:text-slate-500 uppercase tracking-wide px-4 py-3">Unidad</th>
                  <th className="text-left text-[11px] font-medium text-[#94a3b8] dark:text-slate-500 uppercase tracking-wide px-4 py-3">Prioridad</th>
                  <th className="text-left text-[11px] font-medium text-[#94a3b8] dark:text-slate-500 uppercase tracking-wide px-4 py-3">Estado</th>
                  <th className="text-left text-[11px] font-medium text-[#94a3b8] dark:text-slate-500 uppercase tracking-wide px-4 py-3">Creado</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f8fafc] dark:divide-[#252836]">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-[#fafbfc] dark:hover:bg-[#252836] transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-[#1a1a2e] dark:text-slate-100">{r.title}</p>
                      {r.description && (
                        <p className="text-xs text-[#94a3b8] dark:text-slate-500 mt-0.5 line-clamp-1">{r.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#64748b] dark:text-slate-400">
                      {r.unit?.building?.name}
                      <span className="text-zinc-300 dark:text-slate-600 mx-1">·</span>
                      Unidad {r.unit?.unit_number}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityBadge[r.priority]}`}>
                        {priorityLabel[r.priority] ?? r.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge[r.status]}`}>
                        {statusLabel[r.status] ?? r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#94a3b8] dark:text-slate-500 tabular-nums">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setEditKey((k) => k + 1); setEditing(r) }}
                          className="p-1.5 text-zinc-400 dark:text-slate-500 hover:text-zinc-700 dark:hover:text-slate-100 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-md transition-colors"
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
        </>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nueva solicitud de mantenimiento">
        <MaintenanceForm key={createKey} units={units} action={createAction} />
      </Modal>
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Actualizar solicitud">
        {editing && (
          <MaintenanceForm key={editKey} request={editing} units={units} action={editAction} />
        )}
      </Modal>
    </div>
  )
}
