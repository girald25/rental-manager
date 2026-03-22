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
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const fmtToday = () =>
  new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

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
      label: cur.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
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
  'text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide px-3 py-2.5 border-b border-zinc-200 bg-zinc-50 print:bg-zinc-100'
const tdCls = 'px-3 py-2.5 text-sm text-zinc-700 border-b border-zinc-100'
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
function PrintButton({ label = 'Print / Save as PDF' }: { label?: string }) {
  return (
    <button
      onClick={() => window.print()}
      className="print:hidden flex items-center gap-2 px-3 py-1.5 bg-zinc-900 text-white text-sm font-medium rounded-md hover:bg-zinc-700 transition-colors"
    >
      <Printer size={14} />
      {label}
    </button>
  )
}

// ── Status badge (screen only) ────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const cls: Record<string, string> = {
    active:      'bg-emerald-50 text-emerald-700 border border-emerald-100',
    expired:     'bg-zinc-100 text-zinc-500',
    terminated:  'bg-red-50 text-red-600 border border-red-100',
    occupied:    'bg-blue-50 text-blue-700 border border-blue-100',
    vacant:      'bg-zinc-100 text-zinc-500',
    paid:        'bg-emerald-50 text-emerald-700 border border-emerald-100',
    pending:     'bg-amber-50 text-amber-700 border border-amber-100',
    late:        'bg-red-50 text-red-600 border border-red-100',
    open:        'bg-zinc-100 text-zinc-600',
    in_progress: 'bg-blue-50 text-blue-700 border border-blue-100',
    completed:   'bg-emerald-50 text-emerald-700 border border-emerald-100',
    on_hold:     'bg-amber-50 text-amber-700 border border-amber-100',
  }
  const label = status.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize print:text-xs print:bg-transparent print:border-none print:px-0 print:py-0 ${cls[status] ?? 'bg-zinc-100 text-zinc-500'}`}>
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
    const b = buildings.find((b: any) => b.id === bid) ?? us[0]?.building ?? { id: bid, name: 'Unknown Building' }
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
    return <EmptyState message="No units found." />
  }

  return (
    <div>
      <PrintHeader title="Rent Roll Report" subtitle={filterBuilding ? buildings.find((b:any)=>b.id===filterBuilding)?.name : 'All Properties'} />

      {byBuilding.map(({ building, units: bUnits }) => (
        <div key={building.id} className="mb-8 print:mb-6">
          <h3 className="text-sm font-semibold text-zinc-900 mb-2 print:text-base">{building.name}</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className={thCls}>Unit</th>
                  <th className={thCls}>Tenant</th>
                  <th className={thCls}>Lease Start</th>
                  <th className={thCls}>Lease End</th>
                  <th className={`${thCls} text-right`}>Monthly Rent</th>
                  <th className={thCls}>Lease Status</th>
                  <th className={thCls}>Unit Status</th>
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
                          : <span className="text-zinc-300">—</span>}
                      </td>
                      <td className={tdNumCls}>{lease?.start_date ? fmtDate(lease.start_date) : '—'}</td>
                      <td className={tdNumCls}>{lease?.end_date ? fmtDate(lease.end_date) : '—'}</td>
                      <td className={`${tdNumCls} text-right font-medium`}>
                        {lease?.rent_amount ? fmt(Number(lease.rent_amount)) : '—'}
                      </td>
                      <td className={tdCls}>
                        {lease ? <StatusBadge status={lease.status} /> : <span className="text-zinc-300 text-xs">—</span>}
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
      <div className="mt-6 pt-5 border-t border-zinc-200">
        <h3 className="text-sm font-semibold text-zinc-900 mb-3 print:text-base">Vacancy Summary</h3>
        <div className="grid grid-cols-4 gap-4 print:grid-cols-4">
          {[
            { label: 'Total Units', value: String(total) },
            { label: 'Occupied', value: `${occupied} (${total ? Math.round(occupied/total*100) : 0}%)` },
            { label: 'Vacant', value: `${vacant} (${total ? Math.round(vacant/total*100) : 0}%)` },
            { label: 'Total Monthly Rent', value: fmt(totalRent) },
          ].map(({ label, value }) => (
            <div key={label} className="bg-zinc-50 border border-zinc-100 rounded-lg p-3 print:border print:border-zinc-300 print:rounded-none">
              <p className="text-xs text-zinc-400 mb-1 uppercase tracking-wide">{label}</p>
              <p className="text-sm font-semibold text-zinc-900">{value}</p>
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
        title="Financial Summary Report"
        subtitle={`${fmtDate(from)} – ${fmtDate(to)}`}
      />

      {/* Key metrics */}
      <div className="grid grid-cols-4 gap-3 mb-8 print:mb-6">
        {[
          { label: 'Total Income', value: fmt(totalIncome), highlight: true },
          { label: 'Total Expenses', value: fmt(totalExpenses) },
          { label: 'NOI', value: fmt(noi), highlight: noi >= 0 },
          { label: 'Expense Ratio', value: oer != null ? `${oer.toFixed(1)}%` : '—' },
        ].map(({ label, value, highlight }) => (
          <div
            key={label}
            className={`border rounded-lg p-3 print:rounded-none print:border-zinc-300 ${highlight ? 'border-zinc-900 bg-zinc-900 print:bg-white print:border-zinc-900' : 'border-zinc-200 bg-white'}`}
          >
            <p className={`text-xs uppercase tracking-wide mb-1.5 ${highlight ? 'text-zinc-400 print:text-zinc-500' : 'text-zinc-400'}`}>{label}</p>
            <p className={`text-lg font-semibold tabular-nums ${highlight ? 'text-white print:text-zinc-900' : 'text-zinc-900'}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Additional metrics (if available) */}
      {(cashOnCash !== null || capRate !== null) && (
        <div className="grid grid-cols-3 gap-3 mb-8 print:mb-6">
          {cashOnCash !== null && (
            <div className="border border-zinc-200 rounded-lg p-3 print:rounded-none print:border-zinc-300">
              <p className="text-xs text-zinc-400 uppercase tracking-wide mb-1">Cash-on-Cash Return</p>
              <p className="text-base font-semibold text-zinc-900">{cashOnCash.toFixed(2)}%</p>
            </div>
          )}
          {capRate !== null && (
            <div className="border border-zinc-200 rounded-lg p-3 print:rounded-none print:border-zinc-300">
              <p className="text-xs text-zinc-400 uppercase tracking-wide mb-1">Cap Rate</p>
              <p className="text-base font-semibold text-zinc-900">{capRate.toFixed(2)}%</p>
            </div>
          )}
        </div>
      )}

      {/* Monthly breakdown */}
      <h3 className="text-sm font-semibold text-zinc-900 mb-3 print:text-base">Month-by-Month Breakdown</h3>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className={thCls}>Month</th>
            <th className={`${thCls} text-right`}>Income</th>
            <th className={`${thCls} text-right`}>Expenses</th>
            <th className={`${thCls} text-right`}>NOI</th>
          </tr>
        </thead>
        <tbody>
          {monthly.map((row) => (
            <tr key={row.label}>
              <td className={`${tdCls} font-medium`}>{row.label}</td>
              <td className={`${tdNumCls} text-right`}>{row.income > 0 ? fmt(row.income) : <span className="text-zinc-300">—</span>}</td>
              <td className={`${tdNumCls} text-right`}>{row.expenses > 0 ? fmt(row.expenses) : <span className="text-zinc-300">—</span>}</td>
              <td className={`${tdNumCls} text-right font-medium ${row.noi < 0 ? 'text-red-600' : 'text-zinc-900'}`}>
                {row.noi !== 0 ? fmt(row.noi) : <span className="text-zinc-300">—</span>}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-zinc-300">
            <td className="px-3 py-2.5 text-sm font-semibold text-zinc-900">Total</td>
            <td className="px-3 py-2.5 text-sm font-semibold text-right tabular-nums text-zinc-900">{fmt(totalIncome)}</td>
            <td className="px-3 py-2.5 text-sm font-semibold text-right tabular-nums text-zinc-900">{fmt(totalExpenses)}</td>
            <td className={`px-3 py-2.5 text-sm font-semibold text-right tabular-nums ${noi < 0 ? 'text-red-600' : 'text-zinc-900'}`}>{fmt(noi)}</td>
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
  if (!tenant) return <EmptyState message="Select a tenant to generate the ledger." />

  const tenantLeases = leases.filter((l: any) => l.tenant?.id === tenantId || l.tenant_id === tenantId)
  const leaseIds = new Set(tenantLeases.map((l: any) => l.id))
  const tenantPayments = payments.filter((p: any) => leaseIds.has(p.lease?.id) || leaseIds.has(p.lease_id))
    .sort((a: any, b: any) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime())

  const totalPaid = tenantPayments.filter((p: any) => p.status === 'paid').reduce((s: number, p: any) => s + Number(p.amount), 0)
  const totalPending = tenantPayments.filter((p: any) => p.status !== 'paid').reduce((s: number, p: any) => s + Number(p.amount), 0)

  return (
    <div>
      <PrintHeader title="Tenant Ledger" subtitle={`${tenant.first_name} ${tenant.last_name}`} />

      {/* Tenant info */}
      <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 mb-6 print:border-zinc-300 print:rounded-none print:bg-white">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-zinc-400 mb-0.5">Tenant</p>
            <p className="text-sm font-semibold text-zinc-900">{tenant.first_name} {tenant.last_name}</p>
          </div>
          {tenant.email && (
            <div>
              <p className="text-xs text-zinc-400 mb-0.5">Email</p>
              <p className="text-sm text-zinc-700">{tenant.email}</p>
            </div>
          )}
          {tenant.phone && (
            <div>
              <p className="text-xs text-zinc-400 mb-0.5">Phone</p>
              <p className="text-sm text-zinc-700">{tenant.phone}</p>
            </div>
          )}
        </div>
      </div>

      {/* Each lease */}
      {tenantLeases.length === 0 ? (
        <p className="text-sm text-zinc-400">No leases found for this tenant.</p>
      ) : (
        tenantLeases.map((lease: any) => {
          const leasePayments = tenantPayments.filter((p: any) => p.lease?.id === lease.id || p.lease_id === lease.id)
          return (
            <div key={lease.id} className="mb-8 print:mb-6">
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-sm font-semibold text-zinc-900 print:text-base">
                  {lease.unit?.building?.name} — Unit {lease.unit?.unit_number}
                </h3>
                <StatusBadge status={lease.status} />
              </div>
              <div className="flex gap-6 text-xs text-zinc-500 mb-3">
                <span>Lease: {fmtDate(lease.start_date)} – {fmtDate(lease.end_date)}</span>
                <span>Rent: {fmt(Number(lease.rent_amount))}/month</span>
                <span>Deposit: {fmt(Number(lease.deposit_amount))}</span>
              </div>

              {leasePayments.length === 0 ? (
                <p className="text-xs text-zinc-400">No payments recorded.</p>
              ) : (
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className={thCls}>Due Date</th>
                      <th className={thCls}>Paid Date</th>
                      <th className={`${thCls} text-right`}>Amount</th>
                      <th className={thCls}>Method</th>
                      <th className={thCls}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leasePayments.map((p: any) => (
                      <tr key={p.id}>
                        <td className={tdNumCls}>{fmtDate(p.due_date)}</td>
                        <td className={tdNumCls}>{p.paid_date ? fmtDate(p.paid_date) : <span className="text-zinc-300">—</span>}</td>
                        <td className={`${tdNumCls} text-right font-medium`}>{fmt(Number(p.amount))}</td>
                        <td className={tdCls}>{p.payment_method ?? <span className="text-zinc-300">—</span>}</td>
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
      <div className="mt-6 pt-5 border-t border-zinc-200">
        <h3 className="text-sm font-semibold text-zinc-900 mb-3 print:text-base">Account Summary</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Paid', value: fmt(totalPaid), color: 'text-emerald-700' },
            { label: 'Balance Pending', value: fmt(totalPending), color: totalPending > 0 ? 'text-amber-700' : 'text-zinc-900' },
            { label: 'Total Payments', value: String(tenantPayments.length) },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-zinc-50 border border-zinc-100 rounded-lg p-3 print:border-zinc-300 print:rounded-none print:bg-white">
              <p className="text-xs text-zinc-400 mb-1 uppercase tracking-wide">{label}</p>
              <p className={`text-sm font-semibold ${color ?? 'text-zinc-900'}`}>{value}</p>
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
    urgent: 'text-red-700', high: 'text-orange-700',
    medium: 'text-amber-700', low: 'text-zinc-500',
  }

  if (filtered.length === 0) {
    return <EmptyState message="No maintenance requests found." />
  }

  return (
    <div>
      <PrintHeader
        title="Maintenance Summary"
        subtitle={filterBuilding ? buildings.find((b:any)=>b.id===filterBuilding)?.name : 'All Properties'}
      />

      {/* Status counts */}
      <div className="grid grid-cols-4 gap-3 mb-8 print:mb-6">
        {[
          { label: 'Total', value: String(filtered.length) },
          { label: 'Open', value: String(open) },
          { label: 'In Progress', value: String(inProgress) },
          { label: 'Completed', value: String(completed) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-zinc-50 border border-zinc-100 rounded-lg p-3 print:border-zinc-300 print:rounded-none print:bg-white">
            <p className="text-xs text-zinc-400 uppercase tracking-wide mb-1">{label}</p>
            <p className="text-lg font-semibold text-zinc-900">{value}</p>
          </div>
        ))}
      </div>

      {/* By building */}
      {Array.from(byBuilding.entries()).map(([bid, requests]) => {
        const building = buildings.find((b: any) => b.id === bid) ??
          requests[0]?.unit?.building ?? { name: 'Unknown Building' }
        return (
          <div key={bid} className="mb-8 print:mb-6">
            <h3 className="text-sm font-semibold text-zinc-900 mb-2 print:text-base">{building.name}</h3>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className={thCls}>Unit</th>
                  <th className={thCls}>Title</th>
                  <th className={thCls}>Priority</th>
                  <th className={thCls}>Status</th>
                  <th className={thCls}>Opened</th>
                  <th className={thCls}>Completed</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((m: any) => (
                  <tr key={m.id}>
                    <td className={`${tdCls} font-medium`}>
                      {m.unit?.unit_number ? `Unit ${m.unit.unit_number}` : '—'}
                    </td>
                    <td className={tdCls}>{m.title}</td>
                    <td className={`${tdCls} capitalize font-medium ${priorityBadge[m.priority] ?? ''}`}>
                      {m.priority}
                    </td>
                    <td className={tdCls}><StatusBadge status={m.status} /></td>
                    <td className={tdNumCls}>{fmtDate(m.created_at)}</td>
                    <td className={tdNumCls}>
                      {m.completed_at ? fmtDate(m.completed_at) : <span className="text-zinc-300">—</span>}
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
    <div className="py-16 text-center text-sm text-zinc-400 print:hidden">
      {message}
    </div>
  )
}

// ── Select style ──────────────────────────────────────────
const selCls =
  'border border-zinc-200 rounded-md px-3 py-1.5 text-sm text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-900 bg-white print:hidden'

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
      label: 'Rent Roll',
      icon: FileSpreadsheet,
      description: 'Units with tenant info, lease dates, rent amounts',
    },
    {
      id: 'financial' as ReportType,
      label: 'Financial Summary',
      icon: TrendingUp,
      description: 'Income, expenses, NOI, and key metrics',
    },
    {
      id: 'tenant-ledger' as ReportType,
      label: 'Tenant Ledger',
      icon: User,
      description: 'Full payment history for a tenant',
    },
    {
      id: 'maintenance' as ReportType,
      label: 'Maintenance Summary',
      icon: Wrench,
      description: 'All requests grouped by building',
    },
  ]

  return (
    <div>
      {/* Page header */}
      <div className="flex items-start justify-between mb-8 print:hidden">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Reports</h1>
          <p className="text-sm text-zinc-400 mt-0.5">Generate and print property reports</p>
        </div>
      </div>

      <div className="flex gap-7">
        {/* Left: report selector */}
        <div className="w-56 shrink-0 print:hidden">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">Report Type</p>
          <div className="space-y-1">
            {REPORT_DEFS.map(({ id, label, icon: Icon, description }) => (
              <button
                key={id}
                onClick={() => setActiveReport(id)}
                className={`w-full text-left px-3 py-3 rounded-lg transition-colors group ${
                  activeReport === id
                    ? 'bg-zinc-900 text-white'
                    : 'hover:bg-zinc-100 text-zinc-700'
                }`}
              >
                <div className="flex items-center gap-2.5 mb-0.5">
                  <Icon size={14} className={activeReport === id ? 'text-zinc-300' : 'text-zinc-400'} />
                  <span className="text-sm font-medium">{label}</span>
                </div>
                <p className={`text-xs ml-[22px] leading-snug ${activeReport === id ? 'text-zinc-400' : 'text-zinc-400'}`}>
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
                <p className="text-sm font-medium text-zinc-700 mr-1">Rent Roll</p>
                <select value={rrBuilding} onChange={(e) => setRrBuilding(e.target.value)} className={selCls}>
                  <option value="">All buildings</option>
                  {buildings.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </>
            )}

            {/* Financial filters */}
            {activeReport === 'financial' && (
              <>
                <p className="text-sm font-medium text-zinc-700 mr-1">Financial Summary</p>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-zinc-500">From</label>
                  <input type="date" value={finFrom} onChange={(e) => setFinFrom(e.target.value)} className={selCls} />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-zinc-500">To</label>
                  <input type="date" value={finTo} onChange={(e) => setFinTo(e.target.value)} className={selCls} />
                </div>
              </>
            )}

            {/* Tenant ledger */}
            {activeReport === 'tenant-ledger' && (
              <>
                <p className="text-sm font-medium text-zinc-700 mr-1">Tenant Ledger</p>
                <select value={ledgerTenant} onChange={(e) => setLedgerTenant(e.target.value)} className={selCls}>
                  <option value="">Select tenant…</option>
                  {tenants.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
                  ))}
                </select>
              </>
            )}

            {/* Maintenance filters */}
            {activeReport === 'maintenance' && (
              <>
                <p className="text-sm font-medium text-zinc-700 mr-1">Maintenance Summary</p>
                <select value={maintBuilding} onChange={(e) => setMaintBuilding(e.target.value)} className={selCls}>
                  <option value="">All buildings</option>
                  {buildings.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                <select value={maintStatus} onChange={(e) => setMaintStatus(e.target.value)} className={selCls}>
                  <option value="">All statuses</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </>
            )}

            <div className="ml-auto">
              <PrintButton />
            </div>
          </div>

          {/* Report content card */}
          <div className="bg-white border border-zinc-200 rounded-xl p-6 print:border-none print:rounded-none print:p-0 print:shadow-none">
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
