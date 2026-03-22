'use client'

import { useActionState, useState } from 'react'
import { Plus, Pencil, Trash2, CreditCard, Check } from 'lucide-react'
import Modal from '@/components/Modal'
import SubmitButton from '@/components/SubmitButton'
import { createPayment, updatePayment, deletePayment, markPaymentPaid } from '@/app/actions/payments'
import type { Payment, Lease } from '@/types'

const input =
  'w-full border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 transition-colors'
const selectCls =
  'w-full border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 transition-colors bg-white'
const label = 'block text-xs font-medium text-zinc-600 mb-1.5'

const statusBadge: Record<string, string> = {
  paid: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  pending: 'bg-zinc-100 text-zinc-600',
  late: 'bg-red-50 text-red-700 border border-red-100',
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
        <p className="text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-md">
          {state.error}
        </p>
      )}
      <div className="grid grid-cols-2 gap-3">
        {!payment && (
          <div className="col-span-2">
            <label className={label}>Lease</label>
            <select name="lease_id" required defaultValue="" className={selectCls}>
              <option value="">Select lease…</option>
              {leases
                .filter((l) => l.status === 'active')
                .map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.tenant?.first_name} {l.tenant?.last_name} — {(l.unit as any)?.building?.name} Unit {l.unit?.unit_number}
                  </option>
                ))}
            </select>
          </div>
        )}
        <div>
          <label className={label}>Amount ($)</label>
          <input name="amount" type="number" required min="0" step="0.01" defaultValue={payment?.amount} className={input} placeholder="1500.00" />
        </div>
        <div>
          <label className={label}>Due date</label>
          <input name="due_date" type="date" required defaultValue={payment?.due_date} className={input} />
        </div>
        <div>
          <label className={label}>Paid date</label>
          <input name="paid_date" type="date" defaultValue={payment?.paid_date ?? ''} className={input} />
        </div>
        <div>
          <label className={label}>Status</label>
          <select name="status" defaultValue={payment?.status ?? 'pending'} className={selectCls}>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="late">Late</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className={label}>Payment method</label>
          <input name="payment_method" defaultValue={payment?.payment_method ?? ''} className={input} placeholder="Bank transfer, Check…" />
        </div>
        <div className="col-span-2">
          <label className={label}>Notes</label>
          <textarea name="notes" defaultValue={payment?.notes ?? ''} rows={2} className={`${input} resize-none`} />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-1 border-t border-zinc-100">
        <SubmitButton label={payment ? 'Save changes' : 'Add payment'} />
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
    if (!confirm('Delete this payment record?')) return
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
          <h1 className="text-xl font-semibold text-zinc-900">Payments</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            ${totalPaid.toLocaleString()} collected · ${totalPending.toLocaleString()} pending
          </p>
        </div>
        <button
          onClick={() => { setCreateKey((k) => k + 1); setShowCreate(true) }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 text-white text-sm font-medium rounded-md hover:bg-zinc-700 transition-colors"
        >
          <Plus size={14} />
          Add payment
        </button>
      </div>

      <div className="flex gap-1 mb-4">
        {(['all', 'pending', 'paid', 'late'] as const).map((f) => (
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
          <CreditCard size={28} className="mx-auto text-zinc-200 mb-3" />
          <p className="text-sm font-medium text-zinc-500">No payments found</p>
        </div>
      ) : (
        <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="text-left text-xs font-medium text-zinc-400 px-4 py-3">Tenant</th>
                <th className="text-left text-xs font-medium text-zinc-400 px-4 py-3">Unit</th>
                <th className="text-left text-xs font-medium text-zinc-400 px-4 py-3">Amount</th>
                <th className="text-left text-xs font-medium text-zinc-400 px-4 py-3">Due</th>
                <th className="text-left text-xs font-medium text-zinc-400 px-4 py-3">Paid</th>
                <th className="text-left text-xs font-medium text-zinc-400 px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-zinc-900">
                    {(p.lease as any)?.tenant?.first_name} {(p.lease as any)?.tenant?.last_name}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-500">
                    {(p.lease as any)?.unit?.building?.name}
                    <span className="text-zinc-300 mx-1">·</span>
                    Unit {(p.lease as any)?.unit?.unit_number}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-zinc-900 tabular-nums">
                    ${Number(p.amount).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-500 tabular-nums">{p.due_date}</td>
                  <td className="px-4 py-3 text-sm text-zinc-500 tabular-nums">
                    {p.paid_date ?? <span className="text-zinc-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge[p.status]}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {p.status !== 'paid' && (
                        <button
                          onClick={() => handleMarkPaid(p.id)}
                          title="Mark as paid"
                          className="p-1.5 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                        >
                          <Check size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => { setEditKey((k) => k + 1); setEditing(p) }}
                        className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-md transition-colors"
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
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add payment">
        <PaymentForm key={createKey} leases={leases} action={createAction} />
      </Modal>
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit payment">
        {editing && (
          <PaymentForm key={editKey} payment={editing} leases={leases} action={editAction} />
        )}
      </Modal>
    </div>
  )
}
