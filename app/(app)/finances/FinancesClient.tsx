'use client'

import { useActionState, useState } from 'react'
import dynamic from 'next/dynamic'
import { Plus, Pencil, Trash2, ExternalLink } from 'lucide-react'
import Modal from '@/components/Modal'
import SubmitButton from '@/components/SubmitButton'
import { createExpense, updateExpense, deleteExpense } from '@/app/actions/expenses'
import { createOtherIncome, updateOtherIncome, deleteOtherIncome } from '@/app/actions/other-income'
import { updateBuildingFinancials } from '@/app/actions/buildings'
import type {
  FinanceMetrics,
  MonthlyFinancialData,
  CategoryBreakdown,
  Expense,
  OtherIncome,
  Building,
} from '@/types'

// Dynamically import charts to avoid SSR issues with ResizeObserver
const IncomeExpenseChart = dynamic(
  () => import('./FinanceCharts').then((m) => ({ default: m.IncomeExpenseChart })),
  { ssr: false, loading: () => <div className="h-[220px] bg-zinc-50 animate-pulse rounded-lg" /> }
)
const NOITrendChart = dynamic(
  () => import('./FinanceCharts').then((m) => ({ default: m.NOITrendChart })),
  { ssr: false, loading: () => <div className="h-[220px] bg-zinc-50 animate-pulse rounded-lg" /> }
)
const ExpenseBreakdownChart = dynamic(
  () => import('./FinanceCharts').then((m) => ({ default: m.ExpenseBreakdownChart })),
  { ssr: false, loading: () => <div className="h-[220px] bg-zinc-50 animate-pulse rounded-lg" /> }
)

// ── Shared styles ─────────────────────────────────────────
const input =
  'w-full border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 transition-colors'
const selectCls =
  'w-full border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 transition-colors bg-white'
const lbl = 'block text-xs font-medium text-zinc-600 mb-1.5'

const EXPENSE_CATEGORIES = [
  'maintenance','utilities','insurance','taxes','repairs','capex','management','other',
] as const

const OTHER_INCOME_CATEGORIES = [
  'late_fee','parking','laundry','pet_fee','other',
] as const

function fmt(n: number, prefix = '$') {
  return `${prefix}${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}
function fmtPct(n: number | null) {
  return n == null ? '—' : `${n.toFixed(1)}%`
}
function fmtMultiple(n: number | null) {
  return n == null ? '—' : `${n.toFixed(2)}×`
}

// ── Metric card ───────────────────────────────────────────
function MetricCard({
  label,
  value,
  sub,
  highlight,
}: {
  label: string
  value: string
  sub?: string
  highlight?: boolean
}) {
  return (
    <div className={`bg-white border rounded-lg p-4 ${highlight ? 'border-zinc-900' : 'border-zinc-200'}`}>
      <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-2">{label}</p>
      <p className={`text-xl font-semibold tabular-nums ${highlight ? 'text-zinc-900' : 'text-zinc-900'}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-zinc-400 mt-1">{sub}</p>}
    </div>
  )
}

// ── Expense form ──────────────────────────────────────────
function ExpenseForm({
  expense,
  buildings,
  units,
  action,
}: {
  expense?: Expense
  buildings: Building[]
  units: any[]
  action: (prevState: any, formData: FormData) => Promise<any>
}) {
  const [state, formAction] = useActionState(action, null)
  const [selectedBuilding, setSelectedBuilding] = useState(expense?.building_id ?? '')
  const filteredUnits = units.filter((u) => !selectedBuilding || u.building_id === selectedBuilding)

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-md">
          {state.error}
        </p>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={lbl}>Date</label>
          <input name="date" type="date" required defaultValue={expense?.date} className={input} />
        </div>
        <div>
          <label className={lbl}>Amount ($)</label>
          <input name="amount" type="number" required min="0" step="0.01" defaultValue={expense?.amount} className={input} placeholder="0.00" />
        </div>
        <div className="col-span-2">
          <label className={lbl}>Category</label>
          <select name="category" required defaultValue={expense?.category ?? ''} className={selectCls}>
            <option value="">Select category…</option>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
        </div>
        <div className="col-span-2">
          <label className={lbl}>Description</label>
          <input name="description" required defaultValue={expense?.description} className={input} placeholder="Water heater replacement…" />
        </div>
        <div>
          <label className={lbl}>Building (optional)</label>
          <select
            name="building_id"
            defaultValue={expense?.building_id ?? ''}
            className={selectCls}
            onChange={(e) => setSelectedBuilding(e.target.value)}
          >
            <option value="">All buildings</option>
            {buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div>
          <label className={lbl}>Unit (optional)</label>
          <select name="unit_id" defaultValue={expense?.unit_id ?? ''} className={selectCls}>
            <option value="">No specific unit</option>
            {filteredUnits.map((u: any) => (
              <option key={u.id} value={u.id}>Unit {u.unit_number}</option>
            ))}
          </select>
        </div>
        <div className="col-span-2">
          <label className={lbl}>Receipt URL (optional)</label>
          <input name="receipt_url" type="url" defaultValue={expense?.receipt_url ?? ''} className={input} placeholder="https://…" />
        </div>
      </div>
      <div className="flex justify-end pt-1 border-t border-zinc-100">
        <SubmitButton label={expense ? 'Save changes' : 'Add expense'} />
      </div>
    </form>
  )
}

// ── Other income form ─────────────────────────────────────
function OtherIncomeForm({
  item,
  buildings,
  units,
  action,
}: {
  item?: OtherIncome
  buildings: Building[]
  units: any[]
  action: (prevState: any, formData: FormData) => Promise<any>
}) {
  const [state, formAction] = useActionState(action, null)
  const [selectedBuilding, setSelectedBuilding] = useState(item?.building_id ?? '')
  const filteredUnits = units.filter((u) => !selectedBuilding || u.building_id === selectedBuilding)

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-md">
          {state.error}
        </p>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={lbl}>Date</label>
          <input name="date" type="date" required defaultValue={item?.date} className={input} />
        </div>
        <div>
          <label className={lbl}>Amount ($)</label>
          <input name="amount" type="number" required min="0" step="0.01" defaultValue={item?.amount} className={input} placeholder="0.00" />
        </div>
        <div className="col-span-2">
          <label className={lbl}>Category</label>
          <select name="category" required defaultValue={item?.category ?? ''} className={selectCls}>
            <option value="">Select category…</option>
            {OTHER_INCOME_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</option>
            ))}
          </select>
        </div>
        <div className="col-span-2">
          <label className={lbl}>Description</label>
          <input name="description" required defaultValue={item?.description} className={input} placeholder="Late fee — Unit 3B…" />
        </div>
        <div>
          <label className={lbl}>Building (optional)</label>
          <select
            name="building_id"
            defaultValue={item?.building_id ?? ''}
            className={selectCls}
            onChange={(e) => setSelectedBuilding(e.target.value)}
          >
            <option value="">All buildings</option>
            {buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div>
          <label className={lbl}>Unit (optional)</label>
          <select name="unit_id" defaultValue={item?.unit_id ?? ''} className={selectCls}>
            <option value="">No specific unit</option>
            {filteredUnits.map((u: any) => (
              <option key={u.id} value={u.id}>Unit {u.unit_number}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex justify-end pt-1 border-t border-zinc-100">
        <SubmitButton label={item ? 'Save changes' : 'Add income'} />
      </div>
    </form>
  )
}

// ── Building financials form ───────────────────────────────
function BuildingFinancialsForm({ building }: { building: Building }) {
  const action = async (prevState: any, formData: FormData) =>
    updateBuildingFinancials(building.id, prevState, formData)
  const [state, formAction] = useActionState(action, null)

  return (
    <form action={formAction}>
      <div className="bg-white border border-zinc-200 rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-zinc-900">{building.name}</p>
          {state?.success && (
            <span className="text-xs text-emerald-600">Saved</span>
          )}
          {state?.error && (
            <span className="text-xs text-red-600">{state.error}</span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={lbl}>Total investment ($)</label>
            <input
              name="investment_value"
              type="number"
              min="0"
              step="1000"
              defaultValue={building.investment_value ?? ''}
              className={input}
              placeholder="e.g. 2500000"
            />
          </div>
          <div>
            <label className={lbl}>Market value ($)</label>
            <input
              name="market_value"
              type="number"
              min="0"
              step="1000"
              defaultValue={building.market_value ?? ''}
              className={input}
              placeholder="e.g. 3200000"
            />
          </div>
        </div>
        <div className="flex justify-end mt-3">
          <SubmitButton label="Save" />
        </div>
      </div>
    </form>
  )
}

// ── Tabs ──────────────────────────────────────────────────
const TABS = ['Overview', 'Income', 'Expenses', 'Settings'] as const
type Tab = (typeof TABS)[number]

// ── Main component ────────────────────────────────────────
interface Props {
  metrics: FinanceMetrics
  monthlyData: MonthlyFinancialData[]
  categoryBreakdown: CategoryBreakdown[]
  allExpenses: Expense[]
  allOtherIncome: OtherIncome[]
  allPaidPayments: any[]
  buildings: Building[]
  units: any[]
}

export default function FinancesClient({
  metrics,
  monthlyData,
  categoryBreakdown,
  allExpenses,
  allOtherIncome,
  allPaidPayments,
  buildings,
  units,
}: Props) {
  const [tab, setTab] = useState<Tab>('Overview')

  // Expense CRUD state
  const [showCreateExpense, setShowCreateExpense] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [expenseCreateKey, setExpenseCreateKey] = useState(0)
  const [expenseEditKey, setExpenseEditKey] = useState(0)
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('all')

  // Other income CRUD state
  const [showCreateIncome, setShowCreateIncome] = useState(false)
  const [editingIncome, setEditingIncome] = useState<OtherIncome | null>(null)
  const [incomeCreateKey, setIncomeCreateKey] = useState(0)
  const [incomeEditKey, setIncomeEditKey] = useState(0)

  const createExpenseAction = async (prevState: any, fd: FormData) => {
    const r = await createExpense(prevState, fd)
    if (r?.success) setShowCreateExpense(false)
    return r
  }
  const editExpenseAction = async (prevState: any, fd: FormData) => {
    if (!editingExpense) return prevState
    const r = await updateExpense(editingExpense.id, prevState, fd)
    if (r?.success) setEditingExpense(null)
    return r
  }
  const createIncomeAction = async (prevState: any, fd: FormData) => {
    const r = await createOtherIncome(prevState, fd)
    if (r?.success) setShowCreateIncome(false)
    return r
  }
  const editIncomeAction = async (prevState: any, fd: FormData) => {
    if (!editingIncome) return prevState
    const r = await updateOtherIncome(editingIncome.id, prevState, fd)
    if (r?.success) setEditingIncome(null)
    return r
  }

  const filteredExpenses =
    expenseCategoryFilter === 'all'
      ? allExpenses
      : allExpenses.filter((e) => e.category === expenseCategoryFilter)

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-900">Finances</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Financial overview · last 12 months
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-0 border-b border-zinc-200 mb-7">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === t ? 'text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            {t}
            {tab === t && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900 rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === 'Overview' && (
        <div className="space-y-6">
          {/* Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            <MetricCard
              label="NOI"
              value={fmt(metrics.noi)}
              sub="Income − Expenses"
              highlight
            />
            <MetricCard
              label="Cash on Cash"
              value={fmtPct(metrics.cashOnCash)}
              sub={metrics.totalInvestment > 0 ? `${fmt(metrics.totalInvestment)} invested` : 'Set in Settings'}
            />
            <MetricCard
              label="GRM"
              value={fmtMultiple(metrics.grm)}
              sub="Value / Annual rent"
            />
            <MetricCard
              label="Vacancy"
              value={fmtPct(metrics.vacancyRate)}
              sub="Of total units"
            />
            <MetricCard
              label="Exp. Ratio"
              value={fmtPct(metrics.oer)}
              sub="Expenses / Income"
            />
            <MetricCard
              label="Cap Rate"
              value={fmtPct(metrics.capRate)}
              sub={metrics.totalMarketValue > 0 ? `${fmt(metrics.totalMarketValue)} value` : 'Set in Settings'}
            />
          </div>

          {/* Income vs Expenses bar chart */}
          <div className="bg-white border border-zinc-200 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-zinc-900 mb-4">Income vs Expenses</h2>
            <IncomeExpenseChart data={monthlyData} />
          </div>

          {/* Breakdown + NOI trend side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white border border-zinc-200 rounded-lg p-5">
              <h2 className="text-sm font-semibold text-zinc-900 mb-4">Expense Breakdown</h2>
              <ExpenseBreakdownChart data={categoryBreakdown} />
            </div>
            <div className="bg-white border border-zinc-200 rounded-lg p-5">
              <h2 className="text-sm font-semibold text-zinc-900 mb-1">NOI Trend</h2>
              <p className="text-xs text-zinc-400 mb-4">Dashed line = cumulative balance</p>
              <NOITrendChart data={monthlyData} />
            </div>
          </div>

          {/* Cash flow table */}
          <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100">
              <h2 className="text-sm font-semibold text-zinc-900">Monthly Cash Flow</h2>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-100">
                  <th className="text-left text-xs font-medium text-zinc-400 px-5 py-3">Month</th>
                  <th className="text-right text-xs font-medium text-zinc-400 px-5 py-3">Income</th>
                  <th className="text-right text-xs font-medium text-zinc-400 px-5 py-3">Expenses</th>
                  <th className="text-right text-xs font-medium text-zinc-400 px-5 py-3">NOI</th>
                  <th className="text-right text-xs font-medium text-zinc-400 px-5 py-3">Running Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {monthlyData.map((row) => (
                  <tr key={row.month} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-5 py-3 text-sm text-zinc-700">{row.month}</td>
                    <td className="px-5 py-3 text-sm text-right text-zinc-700 tabular-nums">
                      {row.income > 0 ? fmt(row.income) : <span className="text-zinc-300">—</span>}
                    </td>
                    <td className="px-5 py-3 text-sm text-right text-zinc-700 tabular-nums">
                      {row.expenses > 0 ? fmt(row.expenses) : <span className="text-zinc-300">—</span>}
                    </td>
                    <td className={`px-5 py-3 text-sm text-right font-medium tabular-nums ${row.noi >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                      {row.noi >= 0 ? '+' : ''}{fmt(row.noi)}
                    </td>
                    <td className="px-5 py-3 text-sm text-right font-medium text-zinc-900 tabular-nums">
                      {fmt(row.runningBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-zinc-200 bg-zinc-50">
                  <td className="px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Total</td>
                  <td className="px-5 py-3 text-sm text-right font-semibold text-zinc-900 tabular-nums">
                    {fmt(metrics.annualIncome)}
                  </td>
                  <td className="px-5 py-3 text-sm text-right font-semibold text-zinc-900 tabular-nums">
                    {fmt(metrics.annualExpenses)}
                  </td>
                  <td className={`px-5 py-3 text-sm text-right font-semibold tabular-nums ${metrics.noi >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                    {metrics.noi >= 0 ? '+' : ''}{fmt(metrics.noi)}
                  </td>
                  <td className="px-5 py-3" />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ── INCOME ── */}
      {tab === 'Income' && (
        <div className="space-y-6">
          {/* Rent payments */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-zinc-900">Rent Payments</h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {fmt(allPaidPayments.reduce((s: number, p: any) => s + Number(p.amount), 0))} total collected
                </p>
              </div>
            </div>
            {allPaidPayments.length === 0 ? (
              <div className="bg-white border border-zinc-200 rounded-lg p-10 text-center">
                <p className="text-sm text-zinc-400">No paid payments yet</p>
              </div>
            ) : (
              <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-100">
                      <th className="text-left text-xs font-medium text-zinc-400 px-4 py-3">Tenant</th>
                      <th className="text-left text-xs font-medium text-zinc-400 px-4 py-3">Unit</th>
                      <th className="text-left text-xs font-medium text-zinc-400 px-4 py-3">Date</th>
                      <th className="text-right text-xs font-medium text-zinc-400 px-4 py-3">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {allPaidPayments.map((p: any) => (
                      <tr key={p.id} className="hover:bg-zinc-50">
                        <td className="px-4 py-3 text-sm text-zinc-700">
                          {p.lease?.tenant?.first_name} {p.lease?.tenant?.last_name}
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-500">
                          {p.lease?.unit?.building?.name}
                          <span className="text-zinc-300 mx-1">·</span>
                          Unit {p.lease?.unit?.unit_number}
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-500 tabular-nums">
                          {p.paid_date}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-zinc-900 tabular-nums">
                          {fmt(Number(p.amount))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Other income */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-zinc-900">Other Income</h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Late fees, parking, laundry, etc.
                </p>
              </div>
              <button
                onClick={() => { setIncomeCreateKey((k) => k + 1); setShowCreateIncome(true) }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 text-white text-sm font-medium rounded-md hover:bg-zinc-700 transition-colors"
              >
                <Plus size={14} />
                Add income
              </button>
            </div>
            {allOtherIncome.length === 0 ? (
              <div className="bg-white border border-zinc-200 rounded-lg p-10 text-center">
                <p className="text-sm text-zinc-400">No other income recorded yet</p>
              </div>
            ) : (
              <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-100">
                      <th className="text-left text-xs font-medium text-zinc-400 px-4 py-3">Date</th>
                      <th className="text-left text-xs font-medium text-zinc-400 px-4 py-3">Category</th>
                      <th className="text-left text-xs font-medium text-zinc-400 px-4 py-3">Description</th>
                      <th className="text-left text-xs font-medium text-zinc-400 px-4 py-3">Building</th>
                      <th className="text-right text-xs font-medium text-zinc-400 px-4 py-3">Amount</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {allOtherIncome.map((item) => (
                      <tr key={item.id} className="hover:bg-zinc-50">
                        <td className="px-4 py-3 text-sm text-zinc-500 tabular-nums">{item.date}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 capitalize font-medium">
                            {item.category.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-700">{item.description}</td>
                        <td className="px-4 py-3 text-sm text-zinc-500">
                          {item.building?.name ?? <span className="text-zinc-300">—</span>}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-zinc-900 tabular-nums">
                          {fmt(Number(item.amount))}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => { setIncomeEditKey((k) => k + 1); setEditingIncome(item) }}
                              className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-md transition-colors"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={async () => {
                                if (!confirm('Delete this income record?')) return
                                await deleteOtherIncome(item.id)
                              }}
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
          </div>
        </div>
      )}

      {/* ── EXPENSES ── */}
      {tab === 'Expenses' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">
                {allExpenses.length} expense{allExpenses.length !== 1 ? 's' : ''}
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                {fmt(allExpenses.reduce((s, e) => s + Number(e.amount), 0))} total
              </p>
            </div>
            <button
              onClick={() => { setExpenseCreateKey((k) => k + 1); setShowCreateExpense(true) }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 text-white text-sm font-medium rounded-md hover:bg-zinc-700 transition-colors"
            >
              <Plus size={14} />
              Add expense
            </button>
          </div>

          {/* Category filter */}
          <div className="flex flex-wrap gap-1 mb-4">
            {['all', ...EXPENSE_CATEGORIES].map((c) => (
              <button
                key={c}
                onClick={() => setExpenseCategoryFilter(c)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors capitalize ${
                  expenseCategoryFilter === c
                    ? 'bg-zinc-900 text-white'
                    : 'text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {filteredExpenses.length === 0 ? (
            <div className="bg-white border border-zinc-200 rounded-lg p-16 text-center">
              <p className="text-sm text-zinc-400">No expenses found</p>
            </div>
          ) : (
            <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-100">
                    <th className="text-left text-xs font-medium text-zinc-400 px-4 py-3">Date</th>
                    <th className="text-left text-xs font-medium text-zinc-400 px-4 py-3">Category</th>
                    <th className="text-left text-xs font-medium text-zinc-400 px-4 py-3">Description</th>
                    <th className="text-left text-xs font-medium text-zinc-400 px-4 py-3">Building</th>
                    <th className="text-right text-xs font-medium text-zinc-400 px-4 py-3">Amount</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {filteredExpenses.map((e) => (
                    <tr key={e.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-zinc-500 tabular-nums">{e.date}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 capitalize font-medium">
                          {e.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-700">{e.description}</td>
                      <td className="px-4 py-3 text-sm text-zinc-500">
                        {e.building?.name ?? <span className="text-zinc-300">—</span>}
                        {e.unit && <span className="text-zinc-300"> · Unit {e.unit.unit_number}</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-zinc-900 tabular-nums">
                        {fmt(Number(e.amount))}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {e.receipt_url && (
                            <a
                              href={e.receipt_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-md transition-colors"
                            >
                              <ExternalLink size={14} />
                            </a>
                          )}
                          <button
                            onClick={() => { setExpenseEditKey((k) => k + 1); setEditingExpense(e) }}
                            className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-md transition-colors"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={async () => {
                              if (!confirm('Delete this expense?')) return
                              await deleteExpense(e.id)
                            }}
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
        </div>
      )}

      {/* ── SETTINGS ── */}
      {tab === 'Settings' && (
        <div>
          <div className="mb-5">
            <h2 className="text-sm font-semibold text-zinc-900">Property Financials</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Set investment and market values per building — used to calculate Cap Rate, GRM, and Cash on Cash return.
            </p>
          </div>
          {buildings.length === 0 ? (
            <div className="bg-white border border-zinc-200 rounded-lg p-10 text-center">
              <p className="text-sm text-zinc-400">Add buildings first</p>
            </div>
          ) : (
            <div className="space-y-3 max-w-xl">
              {buildings.map((b) => (
                <BuildingFinancialsForm key={b.id} building={b} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <Modal open={showCreateExpense} onClose={() => setShowCreateExpense(false)} title="Add expense">
        <ExpenseForm key={expenseCreateKey} buildings={buildings} units={units} action={createExpenseAction} />
      </Modal>
      <Modal open={!!editingExpense} onClose={() => setEditingExpense(null)} title="Edit expense">
        {editingExpense && (
          <ExpenseForm key={expenseEditKey} expense={editingExpense} buildings={buildings} units={units} action={editExpenseAction} />
        )}
      </Modal>
      <Modal open={showCreateIncome} onClose={() => setShowCreateIncome(false)} title="Add other income">
        <OtherIncomeForm key={incomeCreateKey} buildings={buildings} units={units} action={createIncomeAction} />
      </Modal>
      <Modal open={!!editingIncome} onClose={() => setEditingIncome(null)} title="Edit income">
        {editingIncome && (
          <OtherIncomeForm key={incomeEditKey} item={editingIncome} buildings={buildings} units={units} action={editIncomeAction} />
        )}
      </Modal>
    </div>
  )
}
