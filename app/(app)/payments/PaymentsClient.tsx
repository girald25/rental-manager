'use client'

import { useActionState, useState } from 'react'
import { Plus, Pencil, Trash2, CreditCard, Check } from 'lucide-react'
import Modal from '@/components/Modal'
import SubmitButton from '@/components/SubmitButton'
import { createPayment, updatePayment, deletePayment, markPaymentPaid } from '@/app/actions/payments'
import type { Payment, Lease } from '@/types'

const input =
  'w-full border border-[#e8edf0] dark:border-[#2d3148] rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-slate-100 placeholder:text-[#94a3b8] dark:placeholder:text-slate-500 bg-white dark:bg-[#252836] focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors'
const selectCls =
  'w-full border border-[#e8edf0] dark:border-[#2d3148] rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors bg-white dark:bg-[#252836]'
const label = 'block text-xs font-medium text-[#64748b] dark:text-slate-400 mb-1.5'

const statusBadge: Record<string, string> = {
  paid: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20',
  pending: 'bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-slate-400',
  late: 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-500/20',
}
const statusLabel: Record<string, string> = {
  paid: 'Pagado', pending: 'Pendiente', late: 'Atrasado',
}
const filterLabel: Record<string, string> = {
  all: 'Todos', paid: 'Pagado', pending: 'Pendiente', late: 'Atrasado',
}

function PaymentForm({
  payment,
  leases,
  action,
}: {
  payment?: Payment
  leases: Lease[]
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
        {!payment && (
          <div className="col-span-1 sm:col-span-2">
            <label className={label}>Contrato</label>
            <select name="lease_id" required defaultValue="" className={selectCls}>
              <option value="">Seleccionar contrato…</option>
              {leases
                .filter((l) => l.status === 'active')
                .map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.tenant?.first_name} {l.tenant?.last_name} — {(l.unit as any)?.building?.name} Unidad {l.unit?.unit_number}
                  </option>
                ))}
            </select>
          </div>
        )}
        <div>
          <label className={label}>Monto ($)</label>
          <input name="amount" type="number" required min="0" step="0.01" defaultValue={payment?.amount} className={input} placeholder="1500.00" />
        </div>
        <div>
          <label className={label}>Fecha de vencimiento</label>
          <input name="due_date" type="date" required defaultValue={payment?.due_date} className={input} />
        </div>
        <div>
          <label className={label}>Fecha de pago</label>
          <input name="paid_date" type="date" defaultValue={payment?.paid_date ?? ''} className={input} />
        </div>
        <div>
          <label className={label}>Estado</label>
          <select name="status" defaultValue={payment?.status ?? 'pending'} className={selectCls}>
            <option value="pending">Pendiente</option>
            <option value="paid">Pagado</option>
            <option value="late">Atrasado</option>
          </select>
        </div>
        <div className="col-span-1 sm:col-span-2">
          <label className={label}>Método de pago</label>
          <input name="payment_method" defaultValue={payment?.payment_method ?? ''} className={input} placeholder="Transferencia, Cheque…" />
        </div>
        <div className="col-span-1 sm:col-span-2">
          <label className={label}>Notas</label>
          <textarea name="notes" defaultValue={payment?.notes ?? ''} rows={2} className={`${input} resize-none`} />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-1 border-t border-[#f0f4f0] dark:border-[#2d3148]">
        <SubmitButton label={payment ? 'Guardar cambios' : 'Añadir pago'} />
      </div>
    </form>
  )
}

export default function PaymentsClient({
  payments,
  leases,
}: {
  payments: Payment[]
  leases: Lease[]
}) {
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<Payment | null>(null)
  const [createKey, setCreateKey] = useState(0)
  const [editKey, setEditKey] = useState(0)
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'late'>('all')

  const createAction = async (prevState: any, formData: FormData) => {
    const result = await createPayment(prevState, formData)
    if (result?.success) setShowCreate(false)
    return result
  }
  const editAction = async (prevState: any, formData: FormData) => {
    if (!editing) return prevState
    const result = await updatePayment(editing.id, prevState, formData)
    if (result?.success) setEditing(null)
    return result
  }
  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este registro de pago?')) return
    await deletePayment(id)
  }
  const handleMarkPaid = async (id: string) => {
    await markPaymentPaid(id)
  }

  const filtered = filter === 'all' ? payments : payments.filter((p) => p.status === filter)
  const totalPaid = payments.filter((p) => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0)
  const totalPending = payments.filter((p) => p.status === 'pending').reduce((s, p) => s + Number(p.amount), 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[#1a1a2e] dark:text-slate-100">Pagos</h1>
          <p className="text-sm text-[#64748b] dark:text-slate-400 mt-0.5">
            ${totalPaid.toLocaleString()} cobrado · ${totalPending.toLocaleString()} pendiente
          </p>
        </div>
        <button
          onClick={() => { setCreateKey((k) => k + 1); setShowCreate(true) }}
          className="flex items-center gap-1.5 px-3 py-2.5 md:py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-500 transition-colors min-h-[44px] md:min-h-0"
        >
          <Plus size={14} />
          Añadir pago
        </button>
      </div>

      <div className="flex gap-1 mb-4">
        {(['all', 'pending', 'paid', 'late'] as const).map((f) => (
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
          <CreditCard size={28} className="mx-auto text-zinc-200 dark:text-slate-700 mb-3" />
          <p className="text-sm font-medium text-[#64748b] dark:text-slate-400">Sin pagos</p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {filtered.map((p) => (
              <div key={p.id} className="bg-white dark:bg-[#1e2130] border border-[#e8edf0] dark:border-[#2d3148] rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-[#1a1a2e] dark:text-slate-100">
                        {(p.lease as any)?.tenant?.first_name} {(p.lease as any)?.tenant?.last_name}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge[p.status]}`}>
                        {statusLabel[p.status] ?? p.status}
                      </span>
                    </div>
                    <p className="text-xs text-[#64748b] dark:text-slate-400 mt-0.5">
                      {(p.lease as any)?.unit?.building?.name} · Unidad {(p.lease as any)?.unit?.unit_number}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-sm font-semibold text-[#1a1a2e] dark:text-slate-100 tabular-nums">
                        ${Number(p.amount).toLocaleString()}
                      </span>
                      <span className="text-xs text-[#94a3b8] dark:text-slate-500">Vence {p.due_date}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    {p.status !== 'paid' && (
                      <button
                        onClick={() => handleMarkPaid(p.id)}
                        title="Marcar como pagado"
                        className="p-2.5 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                      >
                        <Check size={15} />
                      </button>
                    )}
                    <button
                      onClick={() => { setEditKey((k) => k + 1); setEditing(p) }}
                      className="p-2.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:text-slate-500 dark:hover:text-slate-100 dark:hover:bg-white/5 rounded-md transition-colors"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
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
                  <th className="text-left text-xs font-medium text-[#94a3b8] dark:text-slate-500 uppercase tracking-wide px-4 py-3">Monto</th>
                  <th className="text-left text-xs font-medium text-[#94a3b8] dark:text-slate-500 uppercase tracking-wide px-4 py-3">Vencimiento</th>
                  <th className="text-left text-xs font-medium text-[#94a3b8] dark:text-slate-500 uppercase tracking-wide px-4 py-3">Pagado</th>
                  <th className="text-left text-xs font-medium text-[#94a3b8] dark:text-slate-500 uppercase tracking-wide px-4 py-3">Estado</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f8fafc] dark:divide-[#252836]">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-[#fafbfc] dark:hover:bg-[#252836] transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-[#1a1a2e] dark:text-slate-100">
                      {(p.lease as any)?.tenant?.first_name} {(p.lease as any)?.tenant?.last_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#64748b] dark:text-slate-400">
                      {(p.lease as any)?.unit?.building?.name}
                      <span className="text-zinc-300 dark:text-slate-600 mx-1">·</span>
                      Unidad {(p.lease as any)?.unit?.unit_number}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-[#1a1a2e] dark:text-slate-100 tabular-nums">
                      ${Number(p.amount).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#64748b] dark:text-slate-400 tabular-nums">{p.due_date}</td>
                    <td className="px-4 py-3 text-sm text-[#64748b] dark:text-slate-400 tabular-nums">
                      {p.paid_date ?? <span className="text-zinc-300 dark:text-slate-600">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge[p.status]}`}>
                        {statusLabel[p.status] ?? p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {p.status !== 'paid' && (
                          <button
                            onClick={() => handleMarkPaid(p.id)}
                            title="Marcar como pagado"
                            className="p-1.5 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                          >
                            <Check size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => { setEditKey((k) => k + 1); setEditing(p) }}
                          className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:text-slate-500 dark:hover:text-slate-100 dark:hover:bg-white/5 rounded-md transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
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

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Añadir pago">
        <PaymentForm key={createKey} leases={leases} action={createAction} />
      </Modal>
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar pago">
        {editing && (
          <PaymentForm key={editKey} payment={editing} leases={leases} action={editAction} />
        )}
      </Modal>
    </div>
  )
}
