import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import {
  Building2,
  DoorOpen,
  TrendingUp,
  CreditCard,
  Wrench,
  ArrowUpRight,
  MapPin,
  ArrowRight,
} from 'lucide-react'
import Link from 'next/link'
import { PerformanceChart, MiniCalendar } from './DashboardCharts'

// ── Helpers ────────────────────────────────────────────────────────────────

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function card(extra = '') {
  return `bg-white dark:bg-[#1e2130] border border-[#e8edf0] dark:border-[#2d3148] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] ${extra}`
}

const paymentBadge: Record<string, string> = {
  paid: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  pending: 'bg-[#f0f4f0] dark:bg-white/5 text-[#64748b] dark:text-slate-400',
  late: 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400',
}
const paymentStatusLabel: Record<string, string> = {
  paid: 'Pagado', pending: 'Pendiente', late: 'Atrasado',
}

// ── Stat Card ──────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  iconBg,
  iconColor,
  href,
  trend,
}: {
  label: string
  value: string | number
  sub?: string
  icon: React.ElementType
  iconBg: string
  iconColor: string
  href: string
  trend?: string
}) {
  return (
    <Link href={href} className="block group">
      <div className={card('p-5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-shadow')}>
        <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center mb-4`}>
          <Icon size={18} className={iconColor} />
        </div>
        <p className="text-[13px] text-[#64748b] dark:text-slate-400 mb-1">{label}</p>
        <p className="text-[28px] font-bold text-[#1a1a2e] dark:text-white leading-none tabular-nums">
          {value}
        </p>
        {(trend || sub) && (
          <div className="flex items-center gap-2 mt-2">
            {trend && (
              <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full">
                {trend}
              </span>
            )}
            {sub && <p className="text-[11px] text-[#94a3b8] dark:text-slate-500">{sub}</p>}
          </div>
        )}
      </div>
    </Link>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]
  const sixtyDaysLater = new Date(now)
  sixtyDaysLater.setDate(now.getDate() + 60)
  const sixtyDaysStr = sixtyDaysLater.toISOString().split('T')[0]

  const sixMonthsAgo = new Date(now)
  sixMonthsAgo.setMonth(now.getMonth() - 5)
  sixMonthsAgo.setDate(1)
  const sixMonthsAgoStr = sixMonthsAgo.toISOString().split('T')[0]

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

  const [
    { count: buildingCount },
    { count: unitCount },
    { count: occupiedCount },
    { data: activeLeases },
    { count: pendingPayments },
    { count: openMaintenance },
    { data: recentPayments },
    { data: featuredBuildings },
    { data: activeUnitLeases },
    { data: chartPayments },
    { data: expiringLeases },
    { data: calendarPayments },
    { data: calendarLeases },
  ] = await Promise.all([
    supabase.from('buildings').select('*', { count: 'exact', head: true }),
    supabase.from('units').select('*', { count: 'exact', head: true }),
    supabase.from('units').select('*', { count: 'exact', head: true }).eq('status', 'occupied'),
    supabase.from('leases').select('rent_amount').eq('status', 'active'),
    supabase.from('payments').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase
      .from('maintenance_requests')
      .select('*', { count: 'exact', head: true })
      .in('status', ['open', 'in_progress']),
    supabase
      .from('payments')
      .select(
        '*, lease:leases(tenant:tenants(first_name, last_name), unit:units(unit_number, building:buildings(name)))'
      )
      .order('due_date', { ascending: false })
      .limit(5),
    supabase.from('buildings').select('*').limit(1),
    supabase
      .from('leases')
      .select(
        'id, rent_amount, unit:units(unit_number, bedrooms, building:buildings(name)), tenant:tenants(first_name, last_name)'
      )
      .eq('status', 'active')
      .limit(6),
    supabase
      .from('payments')
      .select('amount, paid_date, due_date')
      .eq('status', 'paid')
      .gte('paid_date', sixMonthsAgoStr)
      .order('paid_date'),
    supabase
      .from('leases')
      .select(
        'id, end_date, rent_amount, tenant:tenants(first_name, last_name), unit:units(unit_number, building:buildings(name))'
      )
      .eq('status', 'active')
      .gte('end_date', todayStr)
      .lte('end_date', sixtyDaysStr)
      .order('end_date')
      .limit(5),
    supabase
      .from('payments')
      .select('due_date')
      .gte('due_date', monthStart)
      .lte('due_date', monthEnd)
      .neq('status', 'paid'),
    supabase
      .from('leases')
      .select('end_date')
      .gte('end_date', monthStart)
      .lte('end_date', monthEnd),
  ])

  const monthlyIncome = (activeLeases ?? []).reduce((s, l) => s + Number(l.rent_amount), 0)
  const occupancyRate =
    unitCount && unitCount > 0
      ? Math.round(((occupiedCount ?? 0) / unitCount) * 100)
      : 0

  const featuredBuilding = featuredBuildings?.[0] ?? null

  // Build chart data (last 6 months)
  const monthlyMap = new Map<string, number>()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    monthlyMap.set(key, 0)
  }
  for (const p of chartPayments ?? []) {
    const key = (p.paid_date ?? p.due_date)?.substring(0, 7)
    if (key && monthlyMap.has(key)) {
      monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + Number(p.amount))
    }
  }
  const chartData = Array.from(monthlyMap.entries()).map(([k, v]) => ({
    month: MONTH_ABBR[parseInt(k.split('-')[1]) - 1],
    income: v,
  }))

  // Calendar event dates
  const calPayDates = (calendarPayments ?? []).map((p: any) => p.due_date as string)
  const calLeaseDates = (calendarLeases ?? []).map((l: any) => l.end_date as string)

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#1a1a2e] dark:text-white">Tablero</h1>
        <p className="text-sm text-[#64748b] dark:text-slate-400 mt-0.5">
          {now.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Edificios"
          value={buildingCount ?? 0}
          icon={Building2}
          iconBg="bg-emerald-50 dark:bg-emerald-500/10"
          iconColor="text-emerald-600 dark:text-emerald-400"
          href="/buildings"
        />
        <StatCard
          label="Total Unidades"
          value={unitCount ?? 0}
          sub={`${occupancyRate}% ocupado`}
          icon={DoorOpen}
          iconBg="bg-blue-50 dark:bg-blue-500/10"
          iconColor="text-blue-600 dark:text-blue-400"
          href="/units"
        />
        <StatCard
          label="Ingreso Mensual"
          value={`$${monthlyIncome.toLocaleString()}`}
          sub={`${(activeLeases ?? []).length} contratos activos`}
          icon={TrendingUp}
          iconBg="bg-purple-50 dark:bg-purple-500/10"
          iconColor="text-purple-600 dark:text-purple-400"
          href="/leases"
        />
        <StatCard
          label="Pagos Pendientes"
          value={pendingPayments ?? 0}
          icon={CreditCard}
          iconBg="bg-amber-50 dark:bg-amber-500/10"
          iconColor="text-amber-600 dark:text-amber-400"
          href="/payments"
        />
      </div>

      {/* Main 2-col grid: 60 / 40 */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* ── Left column (60%) ── */}
        <div className="lg:col-span-3 space-y-5">

          {/* Performance chart */}
          <div className={card('p-5')}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-[#1a1a2e] dark:text-white">
                  Rendimiento
                </h2>
                <p className="text-xs text-[#94a3b8] dark:text-slate-500 mt-0.5">
                  Ingresos últimos 6 meses
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-xs text-[#64748b] dark:text-slate-400">Ingresos</span>
              </div>
            </div>
            <PerformanceChart data={chartData} />
          </div>

          {/* Active units table */}
          <div className={card('overflow-hidden')}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#f0f4f0] dark:border-[#2d3148]">
              <h2 className="text-base font-semibold text-[#1a1a2e] dark:text-white">
                Unidades Activas
              </h2>
              <Link
                href="/units"
                className="flex items-center gap-1 text-xs text-[#64748b] dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              >
                Ver todas <ArrowUpRight size={13} />
              </Link>
            </div>
            {(activeUnitLeases ?? []).length === 0 ? (
              <div className="px-5 py-10 text-center">
                <DoorOpen size={24} className="mx-auto text-[#e8edf0] dark:text-slate-700 mb-2" />
                <p className="text-sm text-[#94a3b8] dark:text-slate-500">Sin unidades activas</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#f0f4f0] dark:border-[#2d3148]">
                      <th className="text-left text-[11px] font-medium uppercase tracking-wide text-[#94a3b8] dark:text-slate-500 px-5 py-3">Unidad</th>
                      <th className="text-left text-[11px] font-medium uppercase tracking-wide text-[#94a3b8] dark:text-slate-500 px-4 py-3">Tipo</th>
                      <th className="text-left text-[11px] font-medium uppercase tracking-wide text-[#94a3b8] dark:text-slate-500 px-4 py-3">Renta</th>
                      <th className="text-left text-[11px] font-medium uppercase tracking-wide text-[#94a3b8] dark:text-slate-500 px-4 py-3">Inquilino</th>
                      <th className="text-left text-[11px] font-medium uppercase tracking-wide text-[#94a3b8] dark:text-slate-500 px-4 py-3">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f8fafc] dark:divide-[#252836]">
                    {(activeUnitLeases ?? []).map((l: any) => (
                      <tr key={l.id} className="hover:bg-[#fafbfc] dark:hover:bg-[#252836] transition-colors">
                        <td className="px-5 py-3">
                          <div>
                            <p className="text-sm font-medium text-[#1a1a2e] dark:text-slate-100">
                              Unidad {l.unit?.unit_number}
                            </p>
                            <p className="text-[11px] text-[#94a3b8] dark:text-slate-500">
                              {l.unit?.building?.name}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-[#64748b] dark:text-slate-400">
                          {l.unit?.bedrooms ?? '—'}bd
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-[#1a1a2e] dark:text-slate-100 tabular-nums">
                          ${Number(l.rent_amount).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-emerald-100 dark:bg-emerald-500/10 rounded-full flex items-center justify-center text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 shrink-0">
                              {l.tenant?.first_name?.[0]}{l.tenant?.last_name?.[0]}
                            </div>
                            <span className="text-sm text-[#1a1a2e] dark:text-slate-100">
                              {l.tenant?.first_name} {l.tenant?.last_name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                            Ocupado
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ── Right column (40%) ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Featured Building */}
          <div className={card('overflow-hidden')}>
            {/* Gradient image placeholder */}
            <div className="h-36 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 relative flex items-end p-4">
              <span className="absolute top-3 right-3 bg-white/90 text-emerald-700 text-[11px] font-semibold px-2.5 py-1 rounded-full">
                ⭐ Recomendado
              </span>
              {featuredBuilding && (
                <div>
                  <p className="font-bold text-white text-base leading-tight">{featuredBuilding.name}</p>
                  <p className="text-white/80 text-xs flex items-center gap-1 mt-0.5">
                    <MapPin size={10} />
                    {featuredBuilding.city}, {featuredBuilding.state}
                  </p>
                </div>
              )}
              {!featuredBuilding && (
                <p className="text-white/80 text-sm">Sin edificios registrados</p>
              )}
            </div>
            {featuredBuilding && (
              <div className="p-5">
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <p className="text-lg font-bold text-[#1a1a2e] dark:text-white">{unitCount ?? 0}</p>
                    <p className="text-[11px] text-[#94a3b8] dark:text-slate-500">Total Unid.</p>
                  </div>
                  <div className="text-center border-x border-[#f0f4f0] dark:border-[#2d3148]">
                    <p className="text-lg font-bold text-[#1a1a2e] dark:text-white">{occupiedCount ?? 0}</p>
                    <p className="text-[11px] text-[#94a3b8] dark:text-slate-500">Ocupadas</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-[#1a1a2e] dark:text-white">
                      ${monthlyIncome >= 1000 ? `${(monthlyIncome / 1000).toFixed(1)}k` : monthlyIncome}
                    </p>
                    <p className="text-[11px] text-[#94a3b8] dark:text-slate-500">Ingreso/mes</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Recent Payments */}
          <div className={card('overflow-hidden')}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#f0f4f0] dark:border-[#2d3148]">
              <h2 className="text-base font-semibold text-[#1a1a2e] dark:text-white">
                Pagos Recientes
              </h2>
              <Link
                href="/payments"
                className="w-6 h-6 rounded-full flex items-center justify-center text-[#64748b] dark:text-slate-400 hover:bg-[#f0f4f0] dark:hover:bg-white/5 transition-colors"
              >
                <ArrowRight size={14} />
              </Link>
            </div>
            <div className="divide-y divide-[#f8fafc] dark:divide-[#252836]">
              {(recentPayments ?? []).length === 0 ? (
                <p className="px-5 py-8 text-sm text-[#94a3b8] dark:text-slate-500 text-center">
                  Sin pagos registrados
                </p>
              ) : (
                (recentPayments ?? []).map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 bg-blue-100 dark:bg-blue-500/10 rounded-full flex items-center justify-center text-[10px] font-semibold text-blue-700 dark:text-blue-400 shrink-0">
                        {p.lease?.tenant?.first_name?.[0]}{p.lease?.tenant?.last_name?.[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#1a1a2e] dark:text-slate-100 leading-tight">
                          {p.lease?.tenant?.first_name} {p.lease?.tenant?.last_name}
                        </p>
                        <p className="text-[11px] text-[#94a3b8] dark:text-slate-500">
                          Unidad {p.lease?.unit?.unit_number}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-[#1a1a2e] dark:text-slate-100 tabular-nums">
                        ${Number(p.amount).toLocaleString()}
                      </p>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${paymentBadge[p.status]}`}>
                        {paymentStatusLabel[p.status] ?? p.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Mini Calendar */}
          <div className={card('p-5')}>
            <MiniCalendar leaseDates={calLeaseDates} paymentDates={calPayDates} />
          </div>

          {/* Expiring Leases / Upcoming */}
          <div className={card('overflow-hidden')}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#f0f4f0] dark:border-[#2d3148]">
              <h2 className="text-base font-semibold text-[#1a1a2e] dark:text-white">
                Próximos Vencimientos
              </h2>
              <Link href="/leases" className="text-xs text-[#64748b] dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                Ver todos →
              </Link>
            </div>
            {openMaintenance && openMaintenance > 0 && (
              <Link href="/maintenance" className="flex items-center justify-between px-5 py-3 border-b border-[#f8fafc] dark:border-[#252836] hover:bg-[#fafbfc] dark:hover:bg-[#252836] transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-amber-50 dark:bg-amber-500/10 rounded-xl flex items-center justify-center shrink-0">
                    <Wrench size={14} className="text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#1a1a2e] dark:text-slate-100">Mantenimiento Abierto</p>
                    <p className="text-[11px] text-[#94a3b8] dark:text-slate-500">{openMaintenance} solicitud{openMaintenance !== 1 ? 'es' : ''} pendiente{openMaintenance !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-[#94a3b8] dark:text-slate-500 group-hover:text-emerald-500 transition-colors" />
              </Link>
            )}
            {(expiringLeases ?? []).length === 0 && !openMaintenance ? (
              <p className="px-5 py-8 text-sm text-[#94a3b8] dark:text-slate-500 text-center">
                Sin vencimientos próximos
              </p>
            ) : (
              (expiringLeases ?? []).map((l: any) => {
                const daysLeft = Math.ceil(
                  (new Date(l.end_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                )
                return (
                  <div key={l.id} className="flex items-center justify-between px-5 py-3 border-b border-[#f8fafc] dark:border-[#252836] last:border-b-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-red-50 dark:bg-red-500/10 rounded-xl flex items-center justify-center shrink-0">
                        <CreditCard size={14} className="text-red-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#1a1a2e] dark:text-slate-100">
                          {(l.tenant as any)?.first_name} {(l.tenant as any)?.last_name}
                        </p>
                        <p className="text-[11px] text-[#94a3b8] dark:text-slate-500">
                          Unidad {(l.unit as any)?.unit_number} · {l.end_date}
                        </p>
                      </div>
                    </div>
                    <span className={`text-[11px] font-semibold px-2 py-1 rounded-full ${
                      daysLeft <= 14
                        ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'
                        : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    }`}>
                      {daysLeft}d
                    </span>
                  </div>
                )
              })
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
