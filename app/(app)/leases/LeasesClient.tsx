'use client'

import { useActionState, useState } from 'react'
import { Plus, Pencil, Trash2, FileText } from 'lucide-react'
import Modal from '@/components/Modal'
import SubmitButton from '@/components/SubmitButton'
import { createLease, updateLease, deleteLease } from '@/app/actions/leases'
import type { Lease, Unit, Tenant, Building } from '@/types'

const input =
  'w-full border border-[#e8edf0] dark:border-[#2d3148] rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-slate-100 placeholder:text-[#94a3b8] dark:placeholder:text-slate-500 bg-white dark:bg-[#252836] focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors'
const selectCls =
  'w-full border border-[#e8edf0] dark:border-[#2d3148] rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors bg-white dark:bg-[#252836]'
const label = 'block text-xs font-medium text-[#64748b] dark:text-slate-400 mb-1.5'

const statusBadge: Record<string, string> = {
  active: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20',
  expired: 'bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-slate-400',
  terminated: 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-500/20',
}
const statusLabel: Record<string, string> = {
  active: 'Activo',
  expired: 'Vencido',
  terminated: 'Terminado',
}
const filterLabel: Record<string, string> = {
  all: 'Todos', active: 'Activo', expired: 'Vencido', terminated: 'Terminado',
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
        <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 px-3 py-2 rounded-md">
          {state.error}
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {!lease && (
          <>
            <div className="col-span-1 sm:col-span-2">
              <label className={label}>Unidad</label>
              <select name="unit_id" required defaultValue="" className={selectCls}>
                <option value="">Seleccionar unidad…</option>
                {units
                  .filter((u) => u.status === 'vacant')
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.building?.name} — Unidad {u.unit_number}
                    </option>
                  ))}
              </select>
            </div>
            <div className="col-span-1 sm:col-span-2">
              <label className={label}>Inquilino</label>
              <select name="tenant_id" required defaultValue="" className={selectCls}>
                <option value="">Seleccionar inquilino…</option>
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
          <label className={label}>Fecha de inicio</label>
          <input name="start_date" type="date" required defaultValue={lease?.start_date} className={input} />
        </div>
        <div>
          <label className={label}>Fecha de fin</label>
          <input name="end_date" type="date" required defaultValue={lease?.end_date} className={input} />
        </div>
        <div>
          <label className={label}>Renta mensual ($)</label>
          <input name="rent_amount" type="number" required min="0" step="0.01" defaultValue={lease?.rent_amount} className={input} placeholder="1500.00" />
        </div>
        <div>
          <label className={label}>Depósito ($)</label>
          <input name="deposit_amount" type="number" min="0" step="0.01" defaultValue={lease?.deposit_amount ?? 0} className={input} placeholder="1500.00" />
        </div>
        {lease && (
          <div className="col-span-1 sm:col-span-2">
            <label className={label}>Estado</label>
            <select name="status" defaultValue={lease.status} className={selectCls}>
              <option value="active">Activo</option>
              <option value="expired">Vencido</option>
              <option value="terminated">Terminado</option>
            </select>
          </div>
        )}
      </div>
      <div className="flex justify-end gap-2 pt-1 border-t border-[#f0f4f0] dark:border-[#2d3148]">
        <SubmitButton label={lease ? 'Guardar cambios' : 'Crear contrato'} />
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
    if (!confirm('¿Eliminar este contrato?')) return
    await deleteLease(lease.id, lease.unit_id)
  }

  const filtered = filter === 'all' ? leases : leases.filter((l) => l.status === filter)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[#1a1a2e] dark:text-slate-100">Contratos</h1>
          <p className="text-sm text-[#64748b] dark:text-slate-400 mt-0.5">
            {leases.filter((l) => l.status === 'active').length} activos
          </p>
        </div>
        <button
          onClick={() => { setCreateKey((k) => k + 1); setShowCreate(true) }}
          className="flex items-center gap-1.5 px-3 py-2.5 md:py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-500 transition-colors min-h-[44px] md:min-h-0"
        >
          <Plus size={14} />
          Nuevo contrato
        </button>
      </div>

      <div className="flex gap-1 mb-4">
        {(['all', 'active', 'expired', 'terminated'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-full transition-colors min-h-[36px] ${
              filter === f ? 'bg-emerald-500 text-white' : 'text-zinc-600 dark:text-slate-400 hover:bg-zinc-100 dark:hover:bg-white/5'
            }`}
          >
            {filterLabel[f]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-[#1e2130] border border-[#e8edf0] dark:border-[#2d3148] rounded-2xl p-8 md:p-16 text-center shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <FileText size={28} className="mx-auto text-zinc-200 dark:text-slate-700 mb-3" />
          <p className="text-sm font-medium text-[#64748b] dark:text-slate-400">Sin contratos</p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {filtered.map((l) => (
              <div key={l.id} className="bg-white dark:bg-[#1e2130] border border-[#e8edf0] dark:border-[#2d3148] rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-[#1a1a2e] dark:text-slate-100">
                        {l.tenant?.first_name} {l.tenant?.last_name}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge[l.status]}`}>
                        {statusLabel[l.status] ?? l.status}
                      </span>
                    </div>
                    <p className="text-xs text-[#64748b] dark:text-slate-400 mt-0.5">
                      {l.unit?.building?.name} · Unidad {l.unit?.unit_number}
                    </p>
                    <p className="text-xs text-[#94a3b8] dark:text-slate-500 mt-1">
                      {l.start_date} → {l.end_date}
                    </p>
                    <p className="text-sm font-medium text-[#1a1a2e] dark:text-slate-100 mt-1 tabular-nums">
                      ${Number(l.rent_amount).toLocaleString()}<span className="text-xs text-[#94a3b8] dark:text-slate-500 font-normal">/mo</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      onClick={() => { setEditKey((k) => k + 1); setEditing(l) }}
                      className="p-2.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:text-slate-500 dark:hover:text-slate-100 dark:hover:bg-white/5 rounded-md transition-colors"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(l)}
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
                  <th className="text-left text-xs font-medium text-[#94a3b8] dark:text-slate-500 uppercase tracking-wide px-4 py-3">Inquilino</th>
                  <th className="text-left text-xs font-medium text-[#94a3b8] dark:text-slate-500 uppercase tracking-wide px-4 py-3">Unidad</th>
                  <th className="text-left text-xs font-medium text-[#94a3b8] dark:text-slate-500 uppercase tracking-wide px-4 py-3">Período</th>
                  <th className="text-left text-xs font-medium text-[#94a3b8] dark:text-slate-500 uppercase tracking-wide px-4 py-3">Renta</th>
                  <th className="text-left text-xs font-medium text-[#94a3b8] dark:text-slate-500 uppercase tracking-wide px-4 py-3">Estado</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f8fafc] dark:divide-[#252836]">
                {filtered.map((l) => (
                  <tr key={l.id} className="hover:bg-[#fafbfc] dark:hover:bg-[#252836] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 bg-zinc-100 dark:bg-white/10 rounded-full flex items-center justify-center shrink-0 text-zinc-600 dark:text-slate-300 text-[10px] font-semibold">
                          {l.tenant?.first_name?.[0]}{l.tenant?.last_name?.[0]}
                        </div>
                        <span className="text-sm font-medium text-[#1a1a2e] dark:text-slate-100">
                          {l.tenant?.first_name} {l.tenant?.last_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#64748b] dark:text-slate-400">
                      <span>{l.unit?.building?.name}</span>
                      <span className="text-zinc-300 dark:text-slate-600 mx-1">·</span>
                      <span>Unidad {l.unit?.unit_number}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#64748b] dark:text-slate-400 tabular-nums">
                      {l.start_date} → {l.end_date}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-[#1a1a2e] dark:text-slate-100 tabular-nums">
                        ${Number(l.rent_amount).toLocaleString()}
                      </span>
                      <span className="text-xs text-[#94a3b8] dark:text-slate-500">/mes</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge[l.status]}`}>
                        {statusLabel[l.status] ?? l.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setEditKey((k) => k + 1); setEditing(l) }}
                          className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:text-slate-500 dark:hover:text-slate-100 dark:hover:bg-white/5 rounded-md transition-colors"
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
        </>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nuevo contrato">
        <LeaseForm key={createKey} units={units} tenants={tenants} action={createAction} />
      </Modal>
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar contrato">
        {editing && (
          <LeaseForm key={editKey} lease={editing} units={units} tenants={tenants} action={editAction} />
        )}
      </Modal>
    </div>
  )
}
