import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { Building2, DoorOpen, TrendingUp, CreditCard, Wrench } from 'lucide-react'
import Link from 'next/link'

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  href,
}: {
  label: string
  value: string | number
  sub?: string
  icon: React.ElementType
  href: string
}) {
  return (
    <Link href={href} className="block group">
      <div className="bg-white border border-zinc-200 rounded-lg p-5 hover:border-zinc-300 transition-colors">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{label}</span>
          <Icon size={14} className="text-zinc-300 group-hover:text-zinc-400 transition-colors" />
        </div>
        <p className="text-2xl font-semibold text-zinc-900 tabular-nums">{value}</p>
        {sub && <p className="text-xs text-zinc-400 mt-1">{sub}</p>}
      </div>
    </Link>
  )
}

const paymentBadge: Record<string, string> = {
  paid: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  pending: 'bg-zinc-100 text-zinc-600',
  late: 'bg-red-50 text-red-700 border border-red-100',
}

const priorityBadge: Record<string, string> = {
  urgent: 'bg-red-50 text-red-700 border border-red-100',
  high: 'bg-orange-50 text-orange-700 border border-orange-100',
  medium: 'bg-amber-50 text-amber-700 border border-amber-100',
  low: 'bg-zinc-100 text-zinc-500',
}

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const [
    { count: buildingCount },
    { count: unitCount },
    { count: occupiedCount },
    { count: vacantCount },
    { data: activeLeases },
    { count: pendingPayments },
    { count: openMaintenance },
    { data: recentPayments },
    { data: recentMaintenance },
  ] = await Promise.all([
    supabase.from('buildings').select('*', { count: 'exact', head: true }),
    supabase.from('units').select('*', { count: 'exact', head: true }),
    supabase.from('units').select('*', { count: 'exact', head: true }).eq('status', 'occupied'),
    supabase.from('units').select('*', { count: 'exact', head: true }).eq('status', 'vacant'),
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
    supabase
      .from('maintenance_requests')
      .select('*, unit:units(unit_number, building:buildings(name))')
      .in('status', ['open', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const monthlyIncome = (activeLeases ?? []).reduce((sum, l) => sum + Number(l.rent_amount), 0)
  const occupancyRate =
    unitCount && unitCount > 0 ? Math.round(((occupiedCount ?? 0) / unitCount) * 100) : 0

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-zinc-900">Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Overview of your properties</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard label="Buildings" value={buildingCount ?? 0} icon={Building2} href="/buildings" />
        <StatCard
          label="Total Units"
          value={unitCount ?? 0}
          sub={`${occupancyRate}% occupied`}
          icon={DoorOpen}
          href="/units"
        />
        <StatCard
          label="Monthly Income"
          value={`$${monthlyIncome.toLocaleString()}`}
          sub={`${(activeLeases ?? []).length} active leases`}
          icon={TrendingUp}
          href="/leases"
        />
        <StatCard
          label="Pending Payments"
          value={pendingPayments ?? 0}
          icon={CreditCard}
          href="/payments"
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
        <StatCard label="Occupied" value={occupiedCount ?? 0} icon={DoorOpen} href="/units" />
        <StatCard label="Vacant" value={vacantCount ?? 0} icon={DoorOpen} href="/units" />
        <StatCard label="Open Requests" value={openMaintenance ?? 0} icon={Wrench} href="/maintenance" />
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Payments */}
        <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
            <h2 className="text-sm font-semibold text-zinc-900">Recent Payments</h2>
            <Link
              href="/payments"
              className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
            >
              View all →
            </Link>
          </div>
          <div className="divide-y divide-zinc-50">
            {recentPayments && recentPayments.length > 0 ? (
              recentPayments.map((p: any) => (
                <div key={p.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-900">
                      {p.lease?.tenant?.first_name} {p.lease?.tenant?.last_name}
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {p.lease?.unit?.building?.name} · Unit {p.lease?.unit?.unit_number}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-zinc-900 tabular-nums">
                      ${Number(p.amount).toLocaleString()}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${paymentBadge[p.status]}`}
                    >
                      {p.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="px-5 py-8 text-sm text-zinc-400 text-center">No payments yet</p>
            )}
          </div>
        </div>

        {/* Open Maintenance */}
        <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
            <h2 className="text-sm font-semibold text-zinc-900">Open Maintenance</h2>
            <Link
              href="/maintenance"
              className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
            >
              View all →
            </Link>
          </div>
          <div className="divide-y divide-zinc-50">
            {recentMaintenance && recentMaintenance.length > 0 ? (
              recentMaintenance.map((m: any) => (
                <div key={m.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-900">{m.title}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {m.unit?.building?.name} · Unit {m.unit?.unit_number}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityBadge[m.priority]}`}
                  >
                    {m.priority}
                  </span>
                </div>
              ))
            ) : (
              <p className="px-5 py-8 text-sm text-zinc-400 text-center">
                No open requests
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
