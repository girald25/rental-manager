'use client'

import { useActionState, useState } from 'react'
import { Plus, Pencil, Trash2, CreditCard, CheckCircle } from 'lucide-react'
import Modal from '@/components/Modal'
import SubmitButton from '@/components/SubmitButton'
import { createPayment, updatePayment, deletePayment, markPaymentPaid } from '@/app/actions/payments'
import type { Payment, Lease } from '@/types'

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
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{state.error}</p>
      )}
      <div className="grid grid-cols-2 gap-4">
        {!payment && (
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Lease</label>
            <select
              name="lease_id"
              required
              defaultValue=""
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select lease…</option>
              {leases
                .filter((l) => l.status === 'active')
                .map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.tenant?.first_name} {l.tenant?.last_name} — {l.unit?.building?.name} Unit {l.unit?.unit_number}
                  </option>
                ))}
            </select>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
          <input
            name="amount"
            type="number"
            required
            min="0"
            step="0.01"
            defaultValue={payment?.amount}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="1500.00"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
          <input
            name="due_date"
            type="date"
            required
            defaultValue={payment?.due_date}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Paid Date</label>
          <input
            name="paid_date"
            type="date"
            defaultValue={payment?.paid_date ?? ''}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            name="status"
            defaultValue={payment?.status ?? 'pending'}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="late">Late</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
          <input
            name="payment_method"
            defaultValue={payment?.payment_method ?? ''}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Bank transfer, Check, etc."
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            name="notes"
            defaultValue={payment?.notes ?? ''}
            rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <SubmitButton label={payment ? 'Save Changes' : 'Add Payment'} />
      </div>
    </form>
  )
}

const statusColors: Record<string, string> = {
  paid: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  late: 'bg-red-100 text-red-700',
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
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-500 mt-1">
            ${totalPaid.toLocaleString()} collected · ${totalPending.toLocaleString()} pending
          </p>
        </div>
        <button
          onClick={() => { setCreateKey((k) => k + 1); setShowCreate(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus size={16} />
          Add Payment
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        {(['all', 'pending', 'paid', 'late'] as const).map((f) => (
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
          <CreditCard size={40} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">No payments found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Tenant</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Unit</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Amount</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Due</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Paid</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Status</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-900 text-sm">
                      {(p.lease as any)?.tenant?.first_name} {(p.lease as any)?.tenant?.last_name}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div>{(p.lease as any)?.unit?.building?.name}</div>
                    <div className="text-gray-400">Unit {(p.lease as any)?.unit?.unit_number}</div>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                    ${Number(p.amount).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{p.due_date}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {p.paid_date ?? <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[p.status]}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {p.status !== 'paid' && (
                        <button
                          onClick={() => handleMarkPaid(p.id)}
                          title="Mark as paid"
                          className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        >
                          <CheckCircle size={15} />
                        </button>
                      )}
                      <button
                        onClick={() => { setEditKey((k) => k + 1); setEditing(p) }}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
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

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add Payment">
        <PaymentForm key={createKey} leases={leases} action={createAction} />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Payment">
        {editing && (
          <PaymentForm key={editKey} payment={editing} leases={leases} action={editAction} />
        )}
      </Modal>
    </div>
  )
}
