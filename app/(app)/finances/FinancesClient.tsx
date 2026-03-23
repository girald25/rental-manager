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
  { ssr: false, loading: () => <div className="h-[220px] bg-zinc-50 dark:bg-[#141520] animate-pulse rounded-xl" /> }
)
const NOITrendChart = dynamic(
  () => import('./FinanceCharts').then((m) => ({ default: m.NOITrendChart })),
  { ssr: false, loading: () => <div className="h-[220px] bg-zinc-50 dark:bg-[#141520] animate-pulse rounded-xl" /> }
)
const ExpenseBreakdownChart = dynamic(
  () => import('./FinanceCharts').then((m) => ({ default: m.ExpenseBreakdownChart })),
  { ssr: false, loading: () => <div className="h-[220px] bg-zinc-50 dark:bg-[#141520] animate-pulse rounded-xl" /> }
)

// ── Shared styles ─────────────────────────────────────────
const input =
  'w-full border border-[#e8edf0] dark:border-[#2d3148] rounded-md px-3 py-2 text-sm text-zinc-900 dark:text-slate-100 placeholder:text-zinc-400 dark:placeholder:text-slate-500 bg-white dark:bg-[#252836] focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:focus:ring-emerald-500 focus:border-emerald-500 dark:focus:border-emerald-500 transition-colors'
const selectCls =
  'w-full border border-[#e8edf0] dark:border-[#2d3148] rounded-md px-3 py-2 text-sm text-zinc-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:focus:ring-emerald-500 focus:border-emerald-500 dark:focus:border-emerald-500 transition-colors bg-white dark:bg-[#252836]'
const lbl = 'block text-xs font-medium text-zinc-600 dark:text-slate-400 mb-1.5'

const EXPENSE_CATEGORIES = [
  'maintenance','utilities','insurance','taxes','repairs','capex','management','other',
] as const

const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  maintenance: 'Mantenimiento',
  utilities:   'Servicios',
  insurance:   'Seguro',
  taxes:       'Impuestos',
  repairs:     'Reparaciones',
  capex:       'Capex',
  management:  'Administración',
  other:       'Otro',
}

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
    <div className={`bg-white dark:bg-[#1e2130] border rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-4 ${highlight ? 'border-zinc-900 dark:border-emerald-600' : 'border-[#e8edf0] dark:border-[#2d3148]'}`}>
      <p className="text-xs font-medium text-[#94a3b8] dark:text-slate-500 uppercase tracking-wide mb-2">{label}</p>
      <p className={`text-xl font-semibold tabular-nums ${highlight ? 'text-[#1a1a2e] dark:text-slate-100' : 'text-[#1a1a2e] dark:text-slate-100'}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-[#94a3b8] dark:text-slate-500 mt-1">{sub}</p>}
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
        <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50 px-3 py-2 rounded-md">
          {state.error}
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={lbl}>Fecha</label>
          <input name="date" type="date" required defaultValue={expense?.date} className={input} />
        </div>
        <div>
          <label className={lbl}>Monto ($)</label>
          <input name="amount" type="number" required min="0" step="0.01" defaultValue={expense?.amount} className={input} placeholder="0.00" />
        </div>
        <div className="col-span-1 sm:col-span-2">
          <label className={lbl}>Categoría</label>
          <select name="category" required defaultValue={expense?.category ?? ''} className={selectCls}>
            <option value="">Seleccionar categoría…</option>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>{EXPENSE_CATEGORY_LABELS[c] ?? (c.charAt(0).toUpperCase() + c.slice(1))}</option>
            ))}
          </select>
        </div>
        <div className="col-span-1 sm:col-span-2">
          <label className={lbl}>Descripción</label>
          <input name="description" required defaultValue={expense?.description} className={input} placeholder="Reemplazo de calentador de agua…" />
        </div>
        <div>
          <label className={lbl}>Edificio (opcional)</label>
          <select
            name="building_id"
            defaultValue={expense?.building_id ?? ''}
            className={selectCls}
            onChange={(e) => setSelectedBuilding(e.target.value)}
          >
            <option value="">Todos los edificios</option>
            {buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div>
          <label className={lbl}>Unidad (opcional)</label>
          <select name="unit_id" defaultValue={expense?.unit_id ?? ''} className={selectCls}>
            <option value="">Sin unidad específica</option>
            {filteredUnits.map((u: any) => (
              <option key={u.id} value={u.id}>Unit {u.unit_number}</option>
            ))}
          </select>
        </div>
        <div className="col-span-1 sm:col-span-2">
          <label className={lbl}>URL del Recibo (opcional)</label>
          <input name="receipt_url" type="url" defaultValue={expense?.receipt_url ?? ''} className={input} placeholder="https://…" />
        </div>
      </div>
      <div className="flex justify-end pt-1 border-t border-[#f0f4f0] dark:border-[#2d3148]">
        <SubmitButton label={expense ? 'Guardar cambios' : 'Añadir gasto'} />
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
        <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50 px-3 py-2 rounded-md">
          {state.error}
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={lbl}>Fecha</label>
          <input name="date" type="date" required defaultValue={item?.date} className={input} />
        </div>
        <div>
          <label className={lbl}>Monto ($)</label>
          <input name="amount" type="number" required min="0" step="0.01" defaultValue={item?.amount} className={input} placeholder="0.00" />
        </div>
        <div className="col-span-1 sm:col-span-2">
          <label className={lbl}>Categoría</label>
          <select name="category" required defaultValue={item?.category ?? ''} className={selectCls}>
            <option value="">Seleccionar categoría…</option>
            {OTHER_INCOME_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</option>
            ))}
          </select>
        </div>
        <div className="col-span-1 sm:col-span-2">
          <label className={lbl}>Descripción</label>
          <input name="description" required defaultValue={item?.description} className={input} placeholder="Cargo tardío — Unidad 3B…" />
        </div>
        <div>
          <label className={lbl}>Edificio (opcional)</label>
          <select
            name="building_id"
            defaultValue={item?.building_id ?? ''}
            className={selectCls}
            onChange={(e) => setSelectedBuilding(e.target.value)}
          >
            <option value="">Todos los edificios</option>
            {buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div>
          <label className={lbl}>Unidad (opcional)</label>
          <select name="unit_id" defaultValue={item?.unit_id ?? ''} className={selectCls}>
            <option value="">Sin unidad específica</option>
            {filteredUnits.map((u: any) => (
              <option key={u.id} value={u.id}>Unit {u.unit_number}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex justify-end pt-1 border-t border-[#f0f4f0] dark:border-[#2d3148]">
        <SubmitButton label={item ? 'Guardar cambios' : 'Añadir ingreso'} />
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
      <div className="bg-white dark:bg-[#1e2130] border border-[#e8edf0] dark:border-[#2d3148] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-[#1a1a2e] dark:text-slate-100">{building.name}</p>
          {state?.success && (
            <span className="text-xs text-emerald-600">Guardado</span>
          )}
          {state?.error && (
            <span className="text-xs text-red-600 dark:text-red-400">{state.error}</span>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={lbl}>Inversión total ($)</label>
            <input
              name="investment_value"
              type="number"
              min="0"
              step="1000"
              defaultValue={building.investment_value ?? ''}
              className={input}
              placeholder="ej. 2500000"
            />
          </div>
          <div>
            <label className={lbl}>Valor de mercado ($)</label>
            <input
              name="market_value"
              type="number"
              min="0"
              step="1000"
              defaultValue={building.market_value ?? ''}
              className={input}
              placeholder="ej. 3200000"
            />
          </div>
        </div>
        <div className="flex justify-end mt-3">
          <SubmitButton label="Guardar" />
        </div>
      </div>
    </form>
  )
}

// ── Tabs ──────────────────────────────────────────────────
const TABS = ['Resumen', 'Ingresos', 'Gastos', 'Configuración'] as const
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
  const [tab, setTab] = useState<Tab>('Resumen')

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
        <h1 className="text-xl font-semibold text-[#1a1a2e] dark:text-slate-100">Finanzas</h1>
        <p className="text-sm text-[#64748b] dark:text-slate-400 mt-0.5">
          Resumen financiero · últimos 12 meses
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-0 border-b border-[#e8edf0] dark:border-[#2d3148] mb-7">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === t ? 'text-[#1a1a2e] dark:text-slate-100' : 'text-[#64748b] dark:text-slate-400 hover:text-zinc-700 dark:hover:text-slate-100'
            }`}
          >
            {t}
            {tab === t && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900 dark:bg-emerald-500 rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      {/* ── RESUMEN ── */}
      {tab === 'Resumen' && (
        <div className="space-y-6">
          {/* Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            <MetricCard
              label="INO"
              value={fmt(metrics.noi)}
              sub="Ingresos − Gastos"
              highlight
            />
            <MetricCard
              label="Retorno sobre Inversión"
              value={fmtPct(metrics.cashOnCash)}
              sub={metrics.totalInvestment > 0 ? `${fmt(metrics.totalInvestment)} invertido` : 'Configurar en Ajustes'}
            />
            <MetricCard
              label="GRM"
              value={fmtMultiple(metrics.grm)}
              sub="Valor / Renta anual"
            />
            <MetricCard
              label="Tasa de Vacancia"
              value={fmtPct(metrics.vacancyRate)}
              sub="Del total de unidades"
            />
            <MetricCard
              label="Ratio de Gastos"
              value={fmtPct(metrics.oer)}
              sub="Gastos / Ingresos"
            />
            <MetricCard
              label="Tasa de Capitalización"
              value={fmtPct(metrics.capRate)}
              sub={metrics.totalMarketValue > 0 ? `${fmt(metrics.totalMarketValue)} valor` : 'Configurar en Ajustes'}
            />
          </div>

          {/* Income vs Expenses bar chart */}
          <div className="bg-white dark:bg-[#1e2130] border border-[#e8edf0] dark:border-[#2d3148] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-5">
            <h2 className="text-sm font-semibold text-[#1a1a2e] dark:text-slate-100 mb-4">Ingresos vs Gastos</h2>
            <IncomeExpenseChart data={monthlyData} />
          </div>

          {/* Breakdown + NOI trend side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-[#1e2130] border border-[#e8edf0] dark:border-[#2d3148] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-5">
              <h2 className="text-sm font-semibold text-[#1a1a2e] dark:text-slate-100 mb-4">Desglose de Gastos</h2>
              <ExpenseBreakdownChart data={categoryBreakdown} />
            </div>
            <div className="bg-white dark:bg-[#1e2130] border border-[#e8edf0] dark:border-[#2d3148] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-5">
              <h2 className="text-sm font-semibold text-[#1a1a2e] dark:text-slate-100 mb-1">Tendencia del INO</h2>
              <p className="text-xs text-[#94a3b8] dark:text-slate-500 mb-4">Línea discontinua = balance acumulado</p>
              <NOITrendChart data={monthlyData} />
            </div>
          </div>

          {/* Cash flow table */}
          <div className="bg-white dark:bg-[#1e2130] border border-[#e8edf0] dark:border-[#2d3148] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#f0f4f0] dark:border-[#2d3148]">
              <h2 className="text-sm font-semibold text-[#1a1a2e] dark:text-slate-100">Flujo de Efectivo Mensual</h2>
            </div>
            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-[#f8fafc] dark:divide-[#252836]">
              {monthlyData.map((row) => (
                <div key={row.month} className="px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-zinc-700 dark:text-slate-300">{row.month}</span>
                    <span className={`text-sm font-semibold tabular-nums ${row.noi >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                      {row.noi >= 0 ? '+' : ''}{fmt(row.noi)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-[#94a3b8] dark:text-slate-500">
                    <span>Ent: {row.income > 0 ? fmt(row.income) : '—'}</span>
                    <span>Sal: {row.expenses > 0 ? fmt(row.expenses) : '—'}</span>
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop table */}
            <table className="hidden md:table w-full">
              <thead>
                <tr className="border-b border-[#f0f4f0] dark:border-[#2d3148]">
                  <th className="text-left text-[11px] font-medium text-[#94a3b8] dark:text-slate-500 uppercase tracking-wide px-5 py-3">Mes</th>
                  <th className="text-right text-[11px] font-medium text-[#94a3b8] dark:text-slate-500 uppercase tracking-wide px-5 py-3">Ingresos</th>
                  <th className="text-right text-[11px] font-medium text-[#94a3b8] dark:text-slate-500 uppercase tracking-wide px-5 py-3">Gastos</th>
                  <th className="text-right text-[11px] font-medium text-[#94a3b8] dark:text-slate-500 uppercase tracking-wide px-5 py-3">INO</th>
                  <th className="text-right text-[11px] font-medium text-[#94a3b8] dark:text-slate-500 uppercase tracking-wide px-5 py-3">Balance Acumulado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f8fafc] dark:divide-[#252836]">
                {monthlyData.map((row) => (
                  <tr key={row.month} className="hover:bg-[#fafbfc] dark:hover:bg-[#252836] transition-colors">
                    <td className="px-5 py-3 text-sm text-zinc-700 dark:text-slate-300">{row.month}</td>
                    <td className="px-5 py-3 text-sm text-right text-zinc-700 dark:text-slate-300 tabular-nums">
                      {row.income > 0 ? fmt(row.income) : <span className="text-zinc-300 dark:text-slate-600">—</span>}
                    </td>
                    <td className="px-5 py-3 text-sm text-right text-zinc-700 dark:text-slate-300 tabular-nums">
                      {row.expenses > 0 ? fmt(row.expenses) : <span className="text-zinc-300 dark:text-slate-600">—</span>}
                    </td>
                    <td className={`px-5 py-3 text-sm text-right font-medium tabular-nums ${row.noi >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                      {row.noi >= 0 ? '+' : ''}{fmt(row.noi)}
                    </td>
                    <td className="px-5 py-3 text-sm text-right font-medium text-[#1a1a2e] dark:text-slate-100 tabular-nums">
                      {fmt(row.runningBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-[#e8edf0] dark:border-[#2d3148] bg-zinc-50 dark:bg-[#141520]">
                  <td className="px-5 py-3 text-xs font-semibold text-[#64748b] dark:text-slate-400 uppercase tracking-wide">Total</td>
                  <td className="px-5 py-3 text-sm text-right font-semibold text-[#1a1a2e] dark:text-slate-100 tabular-nums">
                    {fmt(metrics.annualIncome)}
                  </td>
                  <td className="px-5 py-3 text-sm text-right font-semibold text-[#1a1a2e] dark:text-slate-100 tabular-nums">
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

      {/* ── INGRESOS ── */}
      {tab === 'Ingresos' && (
        <div className="space-y-6">
          {/* Rent payments */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-[#1a1a2e] dark:text-slate-100">Pagos de Renta</h2>
                <p className="text-xs text-[#94a3b8] dark:text-slate-500 mt-0.5">
                  {fmt(allPaidPayments.reduce((s: number, p: any) => s + Number(p.amount), 0))} total recaudado
                </p>
              </div>
            </div>
            {allPaidPayments.length === 0 ? (
              <div className="bg-white dark:bg-[#1e2130] border border-[#e8edf0] dark:border-[#2d3148] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-10 text-center">
                <p className="text-sm text-[#94a3b8] dark:text-slate-500">Sin pagos registrados aún</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-[#1e2130] border border-[#e8edf0] dark:border-[#2d3148] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
                {/* Mobile cards */}
                <div className="md:hidden divide-y divide-[#f8fafc] dark:divide-[#252836]">
                  {allPaidPayments.map((p: any) => (
                    <div key={p.id} className="px-4 py-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-[#1a1a2e] dark:text-slate-100">
                          {p.lease?.tenant?.first_name} {p.lease?.tenant?.last_name}
                        </p>
                        <p className="text-xs text-[#94a3b8] dark:text-slate-500 mt-0.5">
                          {p.lease?.unit?.building?.name} · Unidad {p.lease?.unit?.unit_number}
                        </p>
                        <p className="text-xs text-[#94a3b8] dark:text-slate-500">{p.paid_date}</p>
                      </div>
                      <span className="text-sm font-medium text-[#1a1a2e] dark:text-slate-100 tabular-nums shrink-0">{fmt(Number(p.amount))}</span>
                    </div>
                  ))}
                </div>
                {/* Desktop table */}
                <table className="hidden md:table w-full">
                  <thead>
                    <tr className="border-b border-[#f0f4f0] dark:border-[#2d3148]">
                      <th className="text-left text-[11px] font-medium text-[#94a3b8] dark:text-slate-500 uppercase tracking-wide px-4 py-3">Inquilino</th>
                      <th className="text-left text-[11px] font-medium text-[#94a3b8] dark:text-slate-500 uppercase tracking-wide px-4 py-3">Unidad</th>
                      <th className="text-left text-[11px] font-medium text-[#94a3b8] dark:text-slate-500 uppercase tracking-wide px-4 py-3">Fecha</th>
                      <th className="text-right text-[11px] font-medium text-[#94a3b8] dark:text-slate-500 uppercase tracking-wide px-4 py-3">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f8fafc] dark:divide-[#252836]">
                    {allPaidPayments.map((p: any) => (
                      <tr key={p.id} className="hover:bg-[#fafbfc] dark:hover:bg-[#252836]">
                        <td className="px-4 py-3 text-sm text-zinc-700 dark:text-slate-300">
                          {p.lease?.tenant?.first_name} {p.lease?.tenant?.last_name}
                        </td>
                        <td className="px-4 py-3 text-sm text-[#64748b] dark:text-slate-400">
                          {p.lease?.unit?.building?.name}
                          <span className="text-zinc-300 dark:text-slate-600 mx-1">·</span>
                          Unidad {p.lease?.unit?.unit_number}
                        </td>
                        <td className="px-4 py-3 text-sm text-[#64748b] dark:text-slate-400 tabular-nums">
                          {p.paid_date}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-[#1a1a2e] dark:text-slate-100 tabular-nums">
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
                <h2 className="text-sm font-semibold text-[#1a1a2e] dark:text-slate-100">Otros Ingresos</h2>
                <p className="text-xs text-[#94a3b8] dark:text-slate-500 mt-0.5">
                  Cargos tardíos, estacionamiento, lavandería, etc.
                </p>
              </div>
              <button
                onClick={() => { setIncomeCreateKey((k) => k + 1); setShowCreateIncome(true) }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-500 transition-colors"
              >
                <Plus size={14} />
                Añadir ingreso
              </button>
            </div>
            {allOtherIncome.length === 0 ? (
              <div className="bg-white dark:bg-[#1e2130] border border-[#e8edf0] dark:border-[#2d3148] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-10 text-center">
                <p className="text-sm text-[#94a3b8] dark:text-slate-500">Sin otros ingresos registrados aún</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-[#1e2130] border border-[#e8edf0] dark:border-[#2d3148] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
                {/* Mobile cards */}
                <div className="md:hidden divide-y divide-[#f8fafc] dark:divide-[#252836]">
                  {allOtherIncome.map((item) => (
                    <div key={item.id} className="px-4 py-3 flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-700 dark:text-slate-300">{item.description}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-slate-400 capitalize font-medium">
                            {item.category.replace('_', ' ')}
                          </span>
                          <span className="text-xs text-[#94a3b8] dark:text-slate-500">{item.date}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-sm font-medium text-[#1a1a2e] dark:text-slate-100 tabular-nums">{fmt(Number(item.amount))}</span>
                        <button
                          onClick={() => { setIncomeEditKey((k) => k + 1); setEditingIncome(item) }}
                          className="p-2 text-zinc-400 dark:text-slate-500 hover:text-zinc-700 dark:hover:text-slate-100 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-md transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={async () => {
                            if (!confirm('¿Eliminar este registro de ingreso?')) return
                            await deleteOtherIncome(item.id)
                          }}
                          className="p-2 text-zinc-400 dark:text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-md transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Desktop table */}
                <table className="hidden md:table w-full">
                  <thead>
                    <tr className="border-b border-[#f0f4f0] dark:border-[#2d3148]">
                      <th className="text-left text-[11px] font-medium text-[#94a3b8] dark:text-slate-500 uppercase tracking-wide px-4 py-3">Fecha</th>
                      <th className="text-left text-[11px] font-medium text-[#94a3b8] dark:text-slate-500 uppercase tracking-wide px-4 py-3">Categoría</th>
                      <th className="text-left text-[11px] font-medium text-[#94a3b8] dark:text-slate-500 uppercase tracking-wide px-4 py-3">Descripción</th>
                      <th className="text-left text-[11px] font-medium text-[#94a3b8] dark:text-slate-500 uppercase tracking-wide px-4 py-3">Edificio</th>
                      <th className="text-right text-[11px] font-medium text-[#94a3b8] dark:text-slate-500 uppercase tracking-wide px-4 py-3">Monto</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f8fafc] dark:divide-[#252836]">
                    {allOtherIncome.map((item) => (
                      <tr key={item.id} className="hover:bg-[#fafbfc] dark:hover:bg-[#252836]">
                        <td className="px-4 py-3 text-sm text-[#64748b] dark:text-slate-400 tabular-nums">{item.date}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-slate-400 capitalize font-medium">
                            {item.category.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-700 dark:text-slate-300">{item.description}</td>
                        <td className="px-4 py-3 text-sm text-[#64748b] dark:text-slate-400">
                          {item.building?.name ?? <span className="text-zinc-300 dark:text-slate-600">—</span>}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-[#1a1a2e] dark:text-slate-100 tabular-nums">
                          {fmt(Number(item.amount))}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => { setIncomeEditKey((k) => k + 1); setEditingIncome(item) }}
                              className="p-1.5 text-zinc-400 dark:text-slate-500 hover:text-zinc-700 dark:hover:text-slate-100 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-md transition-colors"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={async () => {
                                if (!confirm('¿Eliminar este registro de ingreso?')) return
                                await deleteOtherIncome(item.id)
                              }}
                              className="p-1.5 text-zinc-400 dark:text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-md transition-colors"
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

      {/* ── GASTOS ── */}
      {tab === 'Gastos' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-[#1a1a2e] dark:text-slate-100">
                {allExpenses.length} gasto{allExpenses.length !== 1 ? 's' : ''}
              </h2>
              <p className="text-xs text-[#94a3b8] dark:text-slate-500 mt-0.5">
                {fmt(allExpenses.reduce((s, e) => s + Number(e.amount), 0))} total
              </p>
            </div>
            <button
              onClick={() => { setExpenseCreateKey((k) => k + 1); setShowCreateExpense(true) }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-500 transition-colors"
            >
              <Plus size={14} />
              Añadir gasto
            </button>
          </div>

          {/* Category filter */}
          <div className="flex flex-wrap gap-1 mb-4">
            {(['all', ...EXPENSE_CATEGORIES] as const).map((c) => (
              <button
                key={c}
                onClick={() => setExpenseCategoryFilter(c)}
                className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors capitalize ${
                  expenseCategoryFilter === c
                    ? 'bg-emerald-600 text-white'
                    : 'text-zinc-600 dark:text-slate-400 hover:bg-zinc-100 dark:hover:bg-white/5'
                }`}
              >
                {c === 'all' ? 'Todos' : (EXPENSE_CATEGORY_LABELS[c] ?? c)}
              </button>
            ))}
          </div>

          {filteredExpenses.length === 0 ? (
            <div className="bg-white dark:bg-[#1e2130] border border-[#e8edf0] dark:border-[#2d3148] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-16 text-center">
              <p className="text-sm text-[#94a3b8] dark:text-slate-500">Sin datos de gastos</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#1e2130] border border-[#e8edf0] dark:border-[#2d3148] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-[#f8fafc] dark:divide-[#252836]">
                {filteredExpenses.map((e) => (
                  <div key={e.id} className="px-4 py-3 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-700 dark:text-slate-300">{e.description}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-slate-400 capitalize font-medium">
                          {EXPENSE_CATEGORY_LABELS[e.category] ?? e.category}
                        </span>
                        <span className="text-xs text-[#94a3b8] dark:text-slate-500">{e.date}</span>
                        {e.building?.name && <span className="text-xs text-[#94a3b8] dark:text-slate-500">{e.building.name}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-sm font-medium text-[#1a1a2e] dark:text-slate-100 tabular-nums">{fmt(Number(e.amount))}</span>
                      <button
                        onClick={() => { setExpenseEditKey((k) => k + 1); setEditingExpense(e) }}
                        className="p-2 text-zinc-400 dark:text-slate-500 hover:text-zinc-700 dark:hover:text-slate-100 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-md transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={async () => {
                          if (!confirm('¿Eliminar este gasto?')) return
                          await deleteExpense(e.id)
                        }}
                        className="p-2 text-zinc-400 dark:text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-md transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {/* Desktop table */}
              <table className="hidden md:table w-full">
                <thead>
                  <tr className="border-b border-[#f0f4f0] dark:border-[#2d3148]">
                    <th className="text-left text-[11px] font-medium text-[#94a3b8] dark:text-slate-500 uppercase tracking-wide px-4 py-3">Fecha</th>
                    <th className="text-left text-[11px] font-medium text-[#94a3b8] dark:text-slate-500 uppercase tracking-wide px-4 py-3">Categoría</th>
                    <th className="text-left text-[11px] font-medium text-[#94a3b8] dark:text-slate-500 uppercase tracking-wide px-4 py-3">Descripción</th>
                    <th className="text-left text-[11px] font-medium text-[#94a3b8] dark:text-slate-500 uppercase tracking-wide px-4 py-3">Edificio</th>
                    <th className="text-right text-[11px] font-medium text-[#94a3b8] dark:text-slate-500 uppercase tracking-wide px-4 py-3">Monto</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f8fafc] dark:divide-[#252836]">
                  {filteredExpenses.map((e) => (
                    <tr key={e.id} className="hover:bg-[#fafbfc] dark:hover:bg-[#252836] transition-colors">
                      <td className="px-4 py-3 text-sm text-[#64748b] dark:text-slate-400 tabular-nums">{e.date}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-slate-400 capitalize font-medium">
                          {EXPENSE_CATEGORY_LABELS[e.category] ?? e.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-700 dark:text-slate-300">{e.description}</td>
                      <td className="px-4 py-3 text-sm text-[#64748b] dark:text-slate-400">
                        {e.building?.name ?? <span className="text-zinc-300 dark:text-slate-600">—</span>}
                        {e.unit && <span className="text-zinc-300 dark:text-slate-600"> · Unit {e.unit.unit_number}</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-[#1a1a2e] dark:text-slate-100 tabular-nums">
                        {fmt(Number(e.amount))}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {e.receipt_url && (
                            <a
                              href={e.receipt_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-zinc-400 dark:text-slate-500 hover:text-zinc-700 dark:hover:text-slate-100 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-md transition-colors"
                            >
                              <ExternalLink size={14} />
                            </a>
                          )}
                          <button
                            onClick={() => { setExpenseEditKey((k) => k + 1); setEditingExpense(e) }}
                            className="p-1.5 text-zinc-400 dark:text-slate-500 hover:text-zinc-700 dark:hover:text-slate-100 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-md transition-colors"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={async () => {
                              if (!confirm('¿Eliminar este gasto?')) return
                              await deleteExpense(e.id)
                            }}
                            className="p-1.5 text-zinc-400 dark:text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-md transition-colors"
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

      {/* ── CONFIGURACIÓN ── */}
      {tab === 'Configuración' && (
        <div>
          <div className="mb-5">
            <h2 className="text-sm font-semibold text-[#1a1a2e] dark:text-slate-100">Finanzas de la Propiedad</h2>
            <p className="text-xs text-[#64748b] dark:text-slate-400 mt-0.5">
              Establece los valores de inversión y mercado por edificio — usados para calcular la Tasa de Capitalización, GRM y Retorno sobre Inversión.
            </p>
          </div>
          {buildings.length === 0 ? (
            <div className="bg-white dark:bg-[#1e2130] border border-[#e8edf0] dark:border-[#2d3148] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-10 text-center">
              <p className="text-sm text-[#94a3b8] dark:text-slate-500">Añade edificios primero</p>
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
      <Modal open={showCreateExpense} onClose={() => setShowCreateExpense(false)} title="Añadir gasto">
        <ExpenseForm key={expenseCreateKey} buildings={buildings} units={units} action={createExpenseAction} />
      </Modal>
      <Modal open={!!editingExpense} onClose={() => setEditingExpense(null)} title="Editar gasto">
        {editingExpense && (
          <ExpenseForm key={expenseEditKey} expense={editingExpense} buildings={buildings} units={units} action={editExpenseAction} />
        )}
      </Modal>
      <Modal open={showCreateIncome} onClose={() => setShowCreateIncome(false)} title="Añadir otro ingreso">
        <OtherIncomeForm key={incomeCreateKey} buildings={buildings} units={units} action={createIncomeAction} />
      </Modal>
      <Modal open={!!editingIncome} onClose={() => setEditingIncome(null)} title="Editar ingreso">
        {editingIncome && (
          <OtherIncomeForm key={incomeEditKey} item={editingIncome} buildings={buildings} units={units} action={editIncomeAction} />
        )}
      </Modal>
    </div>
  )
}
