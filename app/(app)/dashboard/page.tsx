import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { Building2, DoorOpen, Users, CreditCard, Wrench, TrendingUp } from 'lucide-react'
import Link from 'next/link'

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
  href,
}: {
  label: string
  value: string | number
  sub?: string
  icon: React.ElementType
  color: string
  href: string
}) {
  return (
    <Link href={href} className="block">
      <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-500">{label}</span>
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
            <Icon size={18} className="text-white" />
          </div>
        </div>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        {sub && <p className="text-sm text-gray-500 mt-1">{sub}</p>}
      </div>
    </Link>
  )
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
    supabase
      .from('payments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('maintenance_requests')
      .select('*', { count: 'exact', head: true })
      .in('status', ['open', 'in_progress']),
    supabase
      .from('payments')
      .select('*, lease:leases(tenant:tenants(first_name, last_name), unit:units(unit_number, building:buildings(name)))')
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
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of your properties</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Buildings"
          value={buildingCount ?? 0}
          icon={Building2}
          color="bg-indigo-500"
          href="/buildings"
        />
        <StatCard
          label="Total Units"
          value={unitCount ?? 0}
          sub={`${occupancyRate}% occupied`}
          icon={DoorOpen}
          color="bg-slate-600"
          href="/units"
        />
        <StatCard
          label="Occupied"
          value={occupiedCount ?? 0}
          icon={Users}
          color="bg-emerald-500"
          href="/units"
        />
        <StatCard
          label="Vacant"
          value={vacantCount ?? 0}
          icon={DoorOpen}
          color="bg-amber-500"
          href="/units"
        />
        <StatCard
          label="Monthly Income"
          value={`$${monthlyIncome.toLocaleString()}`}
          sub="Active leases"
          icon={TrendingUp}
          color="bg-emerald-600"
          href="/leases"
        />
        <StatCard
          label="Pending Payments"
          value={pendingPayments ?? 0}
          icon={CreditCard}
          color="bg-orange-500"
          href="/payments"
        />
        <StatCard
          label="Open Requests"
          value={openMaintenance ?? 0}
          icon={Wrench}
          color="bg-red-500"
          href="/maintenance"
        />
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Payments */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent Payments</h2>
            <Link href="/payments" className="text-xs text-indigo-600 hover:underline font-medium">
              View all
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentPayments && recentPayments.length > 0 ? (
              recentPayments.map((p: any) => (
                <div key={p.id} className="px-6 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {p.lease?.tenant?.first_name} {p.lease?.tenant?.last_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {p.lease?.unit?.building?.name} · Unit {p.lease?.unit?.unit_number}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      ${Number(p.amount).toLocaleString()}
                    </p>
                    <span
                      className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                        p.status === 'paid'
                          ? 'bg-emerald-100 text-emerald-700'
                          : p.status === 'late'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="px-6 py-6 text-sm text-gray-400 text-center">No payments yet</p>
            )}
          </div>
        </div>

        {/* Open Maintenance */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Open Maintenance</h2>
            <Link
              href="/maintenance"
              className="text-xs text-indigo-600 hover:underline font-medium"
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentMaintenance && recentMaintenance.length > 0 ? (
              recentMaintenance.map((m: any) => (
                <div key={m.id} className="px-6 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{m.title}</p>
                    <p className="text-xs text-gray-500">
                      {m.unit?.building?.name} · Unit {m.unit?.unit_number}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        m.priority === 'urgent'
                          ? 'bg-red-100 text-red-700'
                          : m.priority === 'high'
                          ? 'bg-orange-100 text-orange-700'
                          : m.priority === 'medium'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {m.priority}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        m.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {m.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="px-6 py-6 text-sm text-gray-400 text-center">
                No open maintenance requests
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
