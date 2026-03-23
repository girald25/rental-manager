'use client'

import { useState } from 'react'
import { Printer, FileSpreadsheet, TrendingUp, User, Wrench, ChevronRight } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────
type ReportType = 'rent-roll' | 'financial' | 'tenant-ledger' | 'maintenance'

// ── Helpers ───────────────────────────────────────────────
const fmt = (n: number) =>
  `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`

const fmtDate = (d: string | null) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-PR', { month: 'short', day: 'numeric', year: 'numeric' })
}

const fmtToday = () =>
  new Date().toLocaleDateString('es-PR', { month: 'long', day: 'numeric', year: 'numeric' })

function monthOf(dateStr: string) {
  const d = new Date(dateStr)
  return { year: d.getFullYear(), month: d.getMonth() + 1 }
}

function getMonthsInRange(from: string, to: string) {
  const result: { year: number; month: number; label: string }[] = []
  const start = new Date(from)
  const end = new Date(to)
  start.setDate(1)
  end.setDate(1)
  const cur = new Date(start)
  while (cur <= end) {
    result.push({
      year: cur.getFullYear(),
      month: cur.getMonth() + 1,
      label: cur.toLocaleDateString('es-PR', { month: 'short', year: '2-digit' }),
    })
    cur.setMonth(cur.getMonth() + 1)
  }
  return result
}

function defaultDateRange() {
  const to = new Date()
  const from = new Date(to.getFullYear(), to.getMonth() - 11, 1)
  return {
    from: `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, '0')}-01`,
    to: `${to.getFullYear()}-${String(to.getMonth() + 1).padStart(2, '0')}-01`,
  }
}

// ── Shared table styles ───────────────────────────────────
const thCls =
  'text-left text-xs font-semibold text-[#94a3b8] dark:text-slate-400 uppercase tracking-wide px-3 py-2.5 border-b border-[#e8edf0] dark:border-[#2d3148] bg-zinc-50 dark:bg-[#141520] print:bg-zinc-100'
const tdCls = 'px-3 py-2.5 text-sm text-zinc-700 dark:text-slate-300 border-b border-zinc-100 dark:border-[#2d3148]'
const tdNumCls = `${tdCls} tabular-nums`

// ── Print Header ─────────────────────────────────────────
function PrintHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="hidden print:block mb-6 pb-4 border-b-2 border-zinc-900">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">{title}</h1>
          {subtitle && <p className="text-sm text-zinc-500 mt-0.5">{subtitle}</p>}
        </div>
        <div className="text-right">
          <p className="text-xs text-zinc-400">Generated</p>
          <p className="text-sm font-medium text-zinc-700">{fmtToday()}</p>
        </div>
      </div>
    </div>
  )
}

// ── Print button ──────────────────────────────────────────
function PrintButton({ label = 'Imprimir / Guardar como PDF' }: { label?: string }) {
  return (
    <button
      onClick={() => window.print()}
      className="print:hidden flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-500 transition-colors"
    >
      <Printer size={14} />
      {label}
    </button>
  )
}

// ── Status badge (screen only) ────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const cls: Record<string, string> = {
    active:      'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50',
    expired:     'bg-zinc-100 dark:bg-white/10 text-zinc-500 dark:text-slate-400',
    terminated:  'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/50',
    occupied:    'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50',
    vacant:      'bg-zinc-100 dark:bg-white/10 text-zinc-500 dark:text-slate-400',
    paid:        'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50',
    pending:     'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50',
    late:        'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/50',
    open:        'bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-slate-400',
    in_progress: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50',
    completed:   'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50',
    on_hold:     'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50',
  }

  const LABEL_MAP: Record<string, string> = {
    paid:        'Pagado',
    pending:     'Pendiente',
    late:        'Atrasado',
    active:      'Activo',
    expired:     'Vencido',
    terminated:  'Terminado',
    occupied:    'Ocupado',
    vacant:      'Vacante',
    open:        'Abierto',
    in_progress: 'En Progreso',
    completed:   'Completado',
    on_hold:     'En Pausa',
  }

  const label = LABEL_MAP[status] ?? status.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize print:text-xs print:bg-transparent print:border-none print:px-0 print:py-0 ${cls[status] ?? 'bg-zinc-100 dark:bg-white/10 text-zinc-500 dark:text-slate-400'}`}>
      {label}
    </span>
  )
}

// ── RENT ROLL ─────────────────────────────────────────────
function RentRollReport({
  units, leases, buildings, filterBuilding,
}: {
  units: any[]; leases: any[]; buildings: any[]; filterBuilding: string
}) {
  const filteredUnits = filterBuilding
    ? units.filter((u) => u.building_id === filterBuilding || u.building?.id === filterBuilding)
    : units

  // Group units by building
  const byBuilding: { building: any; units: any[] }[] = []
  const buildingMap = new Map<string, any[]>()
  for (const u of filteredUnits) {
    const bid = u.building?.id ?? u.building_id ?? 'unknown'
    if (!buildingMap.has(bid)) buildingMap.set(bid, [])
    buildingMap.get(bid)!.push(u)
  }
  for (const [bid, us] of buildingMap) {
    const b = buildings.find((b: any) => b.id === bid) ?? us[0]?.building ?? { id: bid, name: 'Edificio Desconocido' }
    byBuilding.push({ building: b, units: us.sort((a, b) => a.unit_number.localeCompare(b.unit_number)) })
  }
  byBuilding.sort((a, b) => a.building.name.localeCompare(b.building.name))

  const getActiveLease = (unitId: string) => {
    const unitLeases = leases.filter((l: any) => l.unit?.id === unitId || l.unit_id === unitId)
    return unitLeases.find((l: any) => l.status === 'active') ??
      unitLeases.sort((a: any, b: any) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime())[0] ?? null
  }

  const total = filteredUnits.length
  const occupied = filteredUnits.filter((u) => u.status === 'occupied').length
  const vacant = total - occupied
  const totalRent = leases
    .filter((l: any) => l.status === 'active' && (!filterBuilding || l.unit?.building?.id === filterBuilding || l.unit?.building_id === filterBuilding))
    .reduce((s: number, l: any) => s + Number(l.rent_amount), 0)

  if (total === 0) {
    return <EmptyState message="Sin datos para este período" />
  }

  return (
    <div>
      <PrintHeader title="Lista de Rentas" subtitle={filterBuilding ? buildings.find((b:any)=>b.id===filterBuilding)?.name : 'Todas las Propiedades'} />

      {byBuilding.map(({ building, units: bUnits }) => (
        <div key={building.id} className="mb-8 print:mb-6">
          <h3 className="text-sm font-semibold text-[#1a1a2e] dark:text-slate-100 mb-2 print:text-base">{building.name}</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className={thCls}>Unidad</th>
                  <th className={thCls}>Inquilino</th>
                  <th className={thCls}>Inicio</th>
                  <th className={thCls}>Fin</th>
                  <th className={`${thCls} text-right`}>Renta Mensual</th>
                  <th className={thCls}>Estado Contrato</th>
                  <th className={thCls}>Estado Unidad</th>
                </tr>
              </thead>
              <tbody>
                {bUnits.map((unit: any) => {
                  const lease = getActiveLease(unit.id)
                  return (
                    <tr key={unit.id}>
                      <td className={`${tdCls} font-medium`}>Unit {unit.unit_number}</td>
                      <td className={tdCls}>
                        {lease?.tenant
                          ? `${lease.tenant.first_name} ${lease.tenant.last_name}`
                          : <span className="text-zinc-300 dark:text-slate-600">—</span>}
                      </td>
                      <td className={tdNumCls}>{lease?.start_date ? fmtDate(lease.start_date) : '—'}</td>
                      <td className={tdNumCls}>{lease?.end_date ? fmtDate(lease.end_date) : '—'}</td>
                      <td className={`${tdNumCls} text-right font-medium`}>
                        {lease?.rent_amount ? fmt(Number(lease.rent_amount)) : '—'}
                      </td>
                      <td className={tdCls}>
                        {lease ? <StatusBadge status={lease.status} /> : <span className="text-zinc-300 dark:text-slate-600 text-xs">—</span>}
                      </td>
                      <td className={tdCls}><StatusBadge status={unit.status} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* Vacancy summary */}
      <div className="mt-6 pt-5 border-t border-[#e8edf0] dark:border-[#2d3148]">
        <h3 className="text-sm font-semibold text-[#1a1a2e] dark:text-slate-100 mb-3 print:text-base">Resumen de Vacancia</h3>
        <div className="grid grid-cols-4 gap-4 print:grid-cols-4">
          {[
            { label: 'Total Unidades', value: String(total) },
            { label: 'Ocupadas', value: `${occupied} (${total ? Math.round(occupied/total*100) : 0}%)` },
            { label: 'Vacantes', value: `${vacant} (${total ? Math.round(vacant/total*100) : 0}%)` },
            { label: 'Renta Mensual Total', value: fmt(totalRent) },
          ].map(({ label, value }) => (
            <div key={label} className="bg-zinc-50 dark:bg-[#141520] border border-[#f0f4f0] dark:border-[#2d3148] rounded-xl p-3 print:border print:border-zinc-300 print:rounded-none">
              <p className="text-xs text-[#94a3b8] dark:text-slate-500 mb-1 uppercase tracking-wide">{label}</p>
              <p className="text-sm font-semibold text-[#1a1a2e] dark:text-slate-100">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── FINANCIAL SUMMARY ─────────────────────────────────────
function FinancialSummaryReport({
  payments, expenses, otherIncome, buildings, from, to,
}: {
  payments: any[]; expenses: any[]; otherIncome: any[]; buildings: any[]; from: string; to: string
}) {
  const months = getMonthsInRange(from, to)

  const monthly = months.map(({ year, month, label }) => {
    const inc =
      payments
        .filter((p: any) => p.status === 'paid' && p.paid_date && (() => { const m = monthOf(p.paid_date); return m.year === year && m.month === month })())
        .reduce((s: number, p: any) => s + Number(p.amount), 0) +
      otherIncome
        .filter((o: any) => { const m = monthOf(o.date); return m.year === year && m.month === month })
        .reduce((s: number, o: any) => s + Number(o.amount), 0)
    const exp = expenses
      .filter((e: any) => { const m = monthOf(e.date); return m.year === year && m.month === month })
      .reduce((s: number, e: any) => s + Number(e.amount), 0)
    return { label, income: inc, expenses: exp, noi: inc - exp }
  })

  const totalIncome = monthly.reduce((s, m) => s + m.income, 0)
  const totalExpenses = monthly.reduce((s, m) => s + m.expenses, 0)
  const noi = totalIncome - totalExpenses
  const oer = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : null

  const totalInvestment = buildings.reduce((s: number, b: any) => s + (b.investment_value ? Number(b.investment_value) : 0), 0)
  const totalMarketValue = buildings.reduce((s: number, b: any) => s + (b.market_value ? Number(b.market_value) : 0), 0)
  const cashOnCash = totalInvestment > 0 ? (noi / totalInvestment) * 100 : null
  const capRate = totalMarketValue > 0 ? (noi / totalMarketValue) * 100 : null

  return (
    <div>
      <PrintHeader
        title="Resumen Financiero"
        subtitle={`${fmtDate(from)} – ${fmtDate(to)}`}
      />

      {/* Key metrics */}
      <div className="grid grid-cols-4 gap-3 mb-8 print:mb-6">
        {[
          { label: 'Ingresos Totales', value: fmt(totalIncome), highlight: true },
          { label: 'Gastos Totales', value: fmt(totalExpenses) },
          { label: 'INO', value: fmt(noi), highlight: noi >= 0 },
          { label: 'Ratio de Gastos', value: oer != null ? `${oer.toFixed(1)}%` : '—' },
        ].map(({ label, value, highlight }) => (
          <div
            key={label}
            className={`border rounded-xl p-3 print:rounded-none print:border-zinc-300 ${highlight ? 'border-zinc-900 dark:border-emerald-600 bg-zinc-900 dark:bg-emerald-600/20 print:bg-white print:border-zinc-900' : 'border-[#e8edf0] dark:border-[#2d3148] bg-white dark:bg-[#1e2130]'}`}
          >
            <p className={`text-xs uppercase tracking-wide mb-1.5 ${highlight ? 'text-zinc-400 print:text-zinc-500' : 'text-[#94a3b8] dark:text-slate-500'}`}>{label}</p>
            <p className={`text-lg font-semibold tabular-nums ${highlight ? 'text-white dark:text-emerald-400 print:text-zinc-900' : 'text-[#1a1a2e] dark:text-slate-100'}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Additional metrics (if available) */}
      {(cashOnCash !== null || capRate !== null) && (
        <div className="grid grid-cols-3 gap-3 mb-8 print:mb-6">
          {cashOnCash !== null && (
            <div className="border border-[#e8edf0] dark:border-[#2d3148] rounded-xl p-3 print:rounded-none print:border-zinc-300 bg-white dark:bg-[#1e2130]">
              <p className="text-xs text-[#94a3b8] dark:text-slate-500 uppercase tracking-wide mb-1">Retorno sobre Inversión</p>
              <p className="text-base font-semibold text-[#1a1a2e] dark:text-slate-100">{cashOnCash.toFixed(2)}%</p>
            </div>
          )}
          {capRate !== null && (
            <div className="border border-[#e8edf0] dark:border-[#2d3148] rounded-xl p-3 print:rounded-none print:border-zinc-300 bg-white dark:bg-[#1e2130]">
              <p className="text-xs text-[#94a3b8] dark:text-slate-500 uppercase tracking-wide mb-1">Tasa de Capitalización</p>
              <p className="text-base font-semibold text-[#1a1a2e] dark:text-slate-100">{capRate.toFixed(2)}%</p>
            </div>
          )}
        </div>
      )}

      {/* Monthly breakdown */}
      <h3 className="text-sm font-semibold text-[#1a1a2e] dark:text-slate-100 mb-3 print:text-base">Desglose Mes a Mes</h3>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className={thCls}>Mes</th>
            <th className={`${thCls} text-right`}>Ingresos</th>
            <th className={`${thCls} text-right`}>Gastos</th>
            <th className={`${thCls} text-right`}>INO</th>
          </tr>
        </thead>
        <tbody>
          {monthly.map((row) => (
            <tr key={row.label}>
              <td className={`${tdCls} font-medium`}>{row.label}</td>
              <td className={`${tdNumCls} text-right`}>{row.income > 0 ? fmt(row.income) : <span className="text-zinc-300 dark:text-slate-600">—</span>}</td>
              <td className={`${tdNumCls} text-right`}>{row.expenses > 0 ? fmt(row.expenses) : <span className="text-zinc-300 dark:text-slate-600">—</span>}</td>
              <td className={`${tdNumCls} text-right font-medium ${row.noi < 0 ? 'text-red-600 dark:text-red-400' : 'text-[#1a1a2e] dark:text-slate-100'}`}>
                {row.noi !== 0 ? fmt(row.noi) : <span className="text-zinc-300 dark:text-slate-600">—</span>}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-zinc-300 dark:border-[#2d3148]">
            <td className="px-3 py-2.5 text-sm font-semibold text-[#1a1a2e] dark:text-slate-100">Total</td>
            <td className="px-3 py-2.5 text-sm font-semibold text-right tabular-nums text-[#1a1a2e] dark:text-slate-100">{fmt(totalIncome)}</td>
            <td className="px-3 py-2.5 text-sm font-semibold text-right tabular-nums text-[#1a1a2e] dark:text-slate-100">{fmt(totalExpenses)}</td>
            <td className={`px-3 py-2.5 text-sm font-semibold text-right tabular-nums ${noi < 0 ? 'text-red-600 dark:text-red-400' : 'text-[#1a1a2e] dark:text-slate-100'}`}>{fmt(noi)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

// ── TENANT LEDGER ─────────────────────────────────────────
function TenantLedgerReport({
  tenantId, tenants, leases, payments,
}: {
  tenantId: string; tenants: any[]; leases: any[]; payments: any[]
}) {
  const tenant = tenants.find((t: any) => t.id === tenantId)
  if (!tenant) return <EmptyState message="Selecciona un inquilino para generar el libro." />

  const tenantLeases = leases.filter((l: any) => l.tenant?.id === tenantId || l.tenant_id === tenantId)
  const leaseIds = new Set(tenantLeases.map((l: any) => l.id))
  const tenantPayments = payments.filter((p: any) => leaseIds.has(p.lease?.id) || leaseIds.has(p.lease_id))
    .sort((a: any, b: any) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime())

  const totalPaid = tenantPayments.filter((p: any) => p.status === 'paid').reduce((s: number, p: any) => s + Number(p.amount), 0)
  const totalPending = tenantPayments.filter((p: any) => p.status !== 'paid').reduce((s: number, p: any) => s + Number(p.amount), 0)

  return (
    <div>
      <PrintHeader title="Libro del Inquilino" subtitle={`${tenant.first_name} ${tenant.last_name}`} />

      {/* Tenant info */}
      <div className="bg-zinc-50 dark:bg-[#141520] border border-[#e8edf0] dark:border-[#2d3148] rounded-xl p-4 mb-6 print:border-zinc-300 print:rounded-none print:bg-white">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-[#94a3b8] dark:text-slate-500 mb-0.5">Inquilino</p>
            <p className="text-sm font-semibold text-[#1a1a2e] dark:text-slate-100">{tenant.first_name} {tenant.last_name}</p>
          </div>
          {tenant.email && (
            <div>
              <p className="text-xs text-[#94a3b8] dark:text-slate-500 mb-0.5">Correo</p>
              <p className="text-sm text-zinc-700 dark:text-slate-300">{tenant.email}</p>
            </div>
          )}
          {tenant.phone && (
            <div>
              <p className="text-xs text-[#94a3b8] dark:text-slate-500 mb-0.5">Teléfono</p>
              <p className="text-sm text-zinc-700 dark:text-slate-300">{tenant.phone}</p>
            </div>
          )}
        </div>
      </div>

      {/* Each lease */}
      {tenantLeases.length === 0 ? (
        <p className="text-sm text-[#94a3b8] dark:text-slate-500">Sin contratos encontrados para este inquilino.</p>
      ) : (
        tenantLeases.map((lease: any) => {
          const leasePayments = tenantPayments.filter((p: any) => p.lease?.id === lease.id || p.lease_id === lease.id)
          return (
            <div key={lease.id} className="mb-8 print:mb-6">
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-sm font-semibold text-[#1a1a2e] dark:text-slate-100 print:text-base">
                  {lease.unit?.building?.name} — Unidad {lease.unit?.unit_number}
                </h3>
                <StatusBadge status={lease.status} />
              </div>
              <div className="flex gap-6 text-xs text-[#64748b] dark:text-slate-400 mb-3">
                <span>Contrato: {fmtDate(lease.start_date)} – {fmtDate(lease.end_date)}</span>
                <span>Renta: {fmt(Number(lease.rent_amount))}/mes</span>
                <span>Depósito: {fmt(Number(lease.deposit_amount))}</span>
              </div>

              {leasePayments.length === 0 ? (
                <p className="text-xs text-[#94a3b8] dark:text-slate-500">Sin pagos registrados.</p>
              ) : (
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className={thCls}>Vencimiento</th>
                      <th className={thCls}>Pagado</th>
                      <th className={`${thCls} text-right`}>Monto</th>
                      <th className={thCls}>Método</th>
                      <th className={thCls}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leasePayments.map((p: any) => (
                      <tr key={p.id}>
                        <td className={tdNumCls}>{fmtDate(p.due_date)}</td>
                        <td className={tdNumCls}>{p.paid_date ? fmtDate(p.paid_date) : <span className="text-zinc-300 dark:text-slate-600">—</span>}</td>
                        <td className={`${tdNumCls} text-right font-medium`}>{fmt(Number(p.amount))}</td>
                        <td className={tdCls}>{p.payment_method ?? <span className="text-zinc-300 dark:text-slate-600">—</span>}</td>
                        <td className={tdCls}><StatusBadge status={p.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )
        })
      )}

      {/* Summary */}
      <div className="mt-6 pt-5 border-t border-[#e8edf0] dark:border-[#2d3148]">
        <h3 className="text-sm font-semibold text-[#1a1a2e] dark:text-slate-100 mb-3 print:text-base">Resumen de Cuenta</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Pagado', value: fmt(totalPaid), color: 'text-emerald-700 dark:text-emerald-400' },
            { label: 'Balance Pendiente', value: fmt(totalPending), color: totalPending > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-[#1a1a2e] dark:text-slate-100' },
            { label: 'Total Pagos', value: String(tenantPayments.length) },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-zinc-50 dark:bg-[#141520] border border-[#f0f4f0] dark:border-[#2d3148] rounded-xl p-3 print:border-zinc-300 print:rounded-none print:bg-white">
              <p className="text-xs text-[#94a3b8] dark:text-slate-500 mb-1 uppercase tracking-wide">{label}</p>
              <p className={`text-sm font-semibold ${color ?? 'text-[#1a1a2e] dark:text-slate-100'}`}>{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── MAINTENANCE SUMMARY ──────────────────────────────────
function MaintenanceSummaryReport({
  maintenance, buildings, filterBuilding, filterStatus,
}: {
  maintenance: any[]; buildings: any[]; filterBuilding: string; filterStatus: string
}) {
  const filtered = maintenance
    .filter((m: any) => !filterBuilding || m.unit?.building?.id === filterBuilding)
    .filter((m: any) => !filterStatus || m.status === filterStatus)

  // Group by building
  const byBuilding = new Map<string, any[]>()
  for (const m of filtered) {
    const bid = m.unit?.building?.id ?? 'unknown'
    if (!byBuilding.has(bid)) byBuilding.set(bid, [])
    byBuilding.get(bid)!.push(m)
  }

  const open = filtered.filter((m: any) => m.status === 'open').length
  const inProgress = filtered.filter((m: any) => m.status === 'in_progress').length
  const completed = filtered.filter((m: any) => m.status === 'completed').length

  const priorityBadge: Record<string, string> = {
    urgent: 'text-red-700 dark:text-red-400', high: 'text-orange-700 dark:text-orange-400',
    medium: 'text-amber-700 dark:text-amber-400', low: 'text-zinc-500 dark:text-slate-400',
  }

  const PRIORITY_LABELS: Record<string, string> = {
    urgent: 'Urgente', high: 'Alta', medium: 'Media', low: 'Baja',
  }

  if (filtered.length === 0) {
    return <EmptyState message="Sin datos para este período" />
  }

  return (
    <div>
      <PrintHeader
        title="Resumen de Mantenimiento"
        subtitle={filterBuilding ? buildings.find((b:any)=>b.id===filterBuilding)?.name : 'Todas las Propiedades'}
      />

      {/* Status counts */}
      <div className="grid grid-cols-4 gap-3 mb-8 print:mb-6">
        {[
          { label: 'Total', value: String(filtered.length) },
          { label: 'Abiertos', value: String(open) },
          { label: 'En Progreso', value: String(inProgress) },
          { label: 'Completados', value: String(completed) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-zinc-50 dark:bg-[#141520] border border-[#f0f4f0] dark:border-[#2d3148] rounded-xl p-3 print:border-zinc-300 print:rounded-none print:bg-white">
            <p className="text-xs text-[#94a3b8] dark:text-slate-500 uppercase tracking-wide mb-1">{label}</p>
            <p className="text-lg font-semibold text-[#1a1a2e] dark:text-slate-100">{value}</p>
          </div>
        ))}
      </div>

      {/* By building */}
      {Array.from(byBuilding.entries()).map(([bid, requests]) => {
        const building = buildings.find((b: any) => b.id === bid) ??
          requests[0]?.unit?.building ?? { name: 'Edificio Desconocido' }
        return (
          <div key={bid} className="mb-8 print:mb-6">
            <h3 className="text-sm font-semibold text-[#1a1a2e] dark:text-slate-100 mb-2 print:text-base">{building.name}</h3>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className={thCls}>Unidad</th>
                  <th className={thCls}>Título</th>
                  <th className={thCls}>Prioridad</th>
                  <th className={thCls}>Estado</th>
                  <th className={thCls}>Reportado</th>
                  <th className={thCls}>Resuelto</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((m: any) => (
                  <tr key={m.id}>
                    <td className={`${tdCls} font-medium`}>
                      {m.unit?.unit_number ? `Unidad ${m.unit.unit_number}` : '—'}
                    </td>
                    <td className={tdCls}>{m.title}</td>
                    <td className={`${tdCls} font-medium ${priorityBadge[m.priority] ?? ''}`}>
                      {PRIORITY_LABELS[m.priority] ?? m.priority}
                    </td>
                    <td className={tdCls}><StatusBadge status={m.status} /></td>
                    <td className={tdNumCls}>{fmtDate(m.created_at)}</td>
                    <td className={tdNumCls}>
                      {m.completed_at ? fmtDate(m.completed_at) : <span className="text-zinc-300 dark:text-slate-600">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      })}
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────
function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-16 text-center text-sm text-[#94a3b8] dark:text-slate-500 print:hidden">
      {message}
    </div>
  )
}

// ── Select style ──────────────────────────────────────────
const selCls =
  'border border-[#e8edf0] dark:border-[#2d3148] rounded-md px-3 py-1.5 text-sm text-zinc-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:focus:ring-emerald-500 bg-white dark:bg-[#252836] print:hidden'

// ── Main component ────────────────────────────────────────
export default function ReportsClient({
  units, leases, payments, expenses, otherIncome, maintenance, tenants, buildings,
}: {
  units: any[]
  leases: any[]
  payments: any[]
  expenses: any[]
  otherIncome: any[]
  maintenance: any[]
  tenants: any[]
  buildings: any[]
}) {
  const [activeReport, setActiveReport] = useState<ReportType>('rent-roll')

  // Rent Roll filters
  const [rrBuilding, setRrBuilding] = useState('')

  // Financial filters
  const defaults = defaultDateRange()
  const [finFrom, setFinFrom] = useState(defaults.from)
  const [finTo, setFinTo] = useState(defaults.to)

  // Tenant ledger
  const [ledgerTenant, setLedgerTenant] = useState(tenants[0]?.id ?? '')

  // Maintenance filters
  const [maintBuilding, setMaintBuilding] = useState('')
  const [maintStatus, setMaintStatus] = useState('')

  const REPORT_DEFS = [
    {
      id: 'rent-roll' as ReportType,
      label: 'Lista de Rentas',
      icon: FileSpreadsheet,
      description: 'Unidades con inquilino, fechas de contrato y rentas',
    },
    {
      id: 'financial' as ReportType,
      label: 'Resumen Financiero',
      icon: TrendingUp,
      description: 'Ingresos, gastos, INO y métricas clave',
    },
    {
      id: 'tenant-ledger' as ReportType,
      label: 'Libro del Inquilino',
      icon: User,
      description: 'Historial completo de pagos de un inquilino',
    },
    {
      id: 'maintenance' as ReportType,
      label: 'Resumen de Mantenimiento',
      icon: Wrench,
      description: 'Todas las solicitudes agrupadas por edificio',
    },
  ]

  return (
    <div>
      {/* Page header */}
      <div className="flex items-start justify-between mb-8 print:hidden">
        <div>
          <h1 className="text-xl font-semibold text-[#1a1a2e] dark:text-slate-100">Informes</h1>
          <p className="text-sm text-[#94a3b8] dark:text-slate-500 mt-0.5">Genera e imprime informes de la propiedad</p>
        </div>
      </div>

      <div className="flex gap-7">
        {/* Left: report selector */}
        <div className="w-56 shrink-0 print:hidden">
          <p className="text-xs font-semibold text-[#94a3b8] dark:text-slate-500 uppercase tracking-wide mb-3">Tipo de Informe</p>
          <div className="space-y-1">
            {REPORT_DEFS.map(({ id, label, icon: Icon, description }) => (
              <button
                key={id}
                onClick={() => setActiveReport(id)}
                className={`w-full text-left px-3 py-3 rounded-xl transition-colors group ${
                  activeReport === id
                    ? 'bg-emerald-600 text-white'
                    : 'hover:bg-[#fafbfc] dark:hover:bg-white/5 text-zinc-700 dark:text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2.5 mb-0.5">
                  <Icon size={14} className={activeReport === id ? 'text-emerald-200' : 'text-zinc-400 dark:text-slate-500'} />
                  <span className="text-sm font-medium">{label}</span>
                </div>
                <p className={`text-xs ml-[22px] leading-snug ${activeReport === id ? 'text-emerald-200' : 'text-[#94a3b8] dark:text-slate-500'}`}>
                  {description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Right: report content */}
        <div className="flex-1 min-w-0">
          {/* Report toolbar */}
          <div className="flex items-center gap-3 mb-6 print:hidden">
            {/* Rent Roll filters */}
            {activeReport === 'rent-roll' && (
              <>
                <p className="text-sm font-medium text-zinc-700 dark:text-slate-300 mr-1">Lista de Rentas</p>
                <select value={rrBuilding} onChange={(e) => setRrBuilding(e.target.value)} className={selCls}>
                  <option value="">Todos los edificios</option>
                  {buildings.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </>
            )}

            {/* Financial filters */}
            {activeReport === 'financial' && (
              <>
                <p className="text-sm font-medium text-zinc-700 dark:text-slate-300 mr-1">Resumen Financiero</p>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-[#64748b] dark:text-slate-400">Desde</label>
                  <input type="date" value={finFrom} onChange={(e) => setFinFrom(e.target.value)} className={selCls} />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-[#64748b] dark:text-slate-400">Hasta</label>
                  <input type="date" value={finTo} onChange={(e) => setFinTo(e.target.value)} className={selCls} />
                </div>
              </>
            )}

            {/* Tenant ledger */}
            {activeReport === 'tenant-ledger' && (
              <>
                <p className="text-sm font-medium text-zinc-700 dark:text-slate-300 mr-1">Libro del Inquilino</p>
                <select value={ledgerTenant} onChange={(e) => setLedgerTenant(e.target.value)} className={selCls}>
                  <option value="">Seleccionar inquilino…</option>
                  {tenants.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
                  ))}
                </select>
              </>
            )}

            {/* Maintenance filters */}
            {activeReport === 'maintenance' && (
              <>
                <p className="text-sm font-medium text-zinc-700 dark:text-slate-300 mr-1">Resumen de Mantenimiento</p>
                <select value={maintBuilding} onChange={(e) => setMaintBuilding(e.target.value)} className={selCls}>
                  <option value="">Todos los edificios</option>
                  {buildings.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                <select value={maintStatus} onChange={(e) => setMaintStatus(e.target.value)} className={selCls}>
                  <option value="">Todos los estados</option>
                  <option value="open">Abierto</option>
                  <option value="in_progress">En Progreso</option>
                  <option value="completed">Completado</option>
                </select>
              </>
            )}

            <div className="ml-auto">
              <PrintButton />
            </div>
          </div>

          {/* Report content card */}
          <div className="bg-white dark:bg-[#1e2130] border border-[#e8edf0] dark:border-[#2d3148] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-6 print:border-none print:rounded-none print:p-0 print:shadow-none">
            {activeReport === 'rent-roll' && (
              <RentRollReport
                units={units}
                leases={leases}
                buildings={buildings}
                filterBuilding={rrBuilding}
              />
            )}
            {activeReport === 'financial' && (
              <FinancialSummaryReport
                payments={payments}
                expenses={expenses}
                otherIncome={otherIncome}
                buildings={buildings}
                from={finFrom}
                to={finTo}
              />
            )}
            {activeReport === 'tenant-ledger' && (
              <TenantLedgerReport
                tenantId={ledgerTenant}
                tenants={tenants}
                leases={leases}
                payments={payments}
              />
            )}
            {activeReport === 'maintenance' && (
              <MaintenanceSummaryReport
                maintenance={maintenance}
                buildings={buildings}
                filterBuilding={maintBuilding}
                filterStatus={maintStatus}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
