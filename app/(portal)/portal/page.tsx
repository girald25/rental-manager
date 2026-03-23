import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { CreditCard, Wrench, FolderOpen, AlertTriangle, CheckCircle, Clock } from 'lucide-react'

export default async function PortalPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()

  // Get tenant profile linked to this user
  const { data: tenant } = await supabase
    .from('tenants')
    .select('*, lease:leases(*, unit:units(unit_number, building:buildings(name, address)))')
    .eq('user_id', user!.id)
    .single()

  // Get active lease
  const activeLease = tenant?.lease?.find((l: { status: string }) => l.status === 'active') ?? tenant?.lease?.[0]

  // Get upcoming/pending payment
  const { data: nextPayment } = await supabase
    .from('payments')
    .select('*')
    .eq('lease_id', activeLease?.id ?? '')
    .in('status', ['pending', 'late'])
    .order('due_date', { ascending: true })
    .limit(1)
    .single()

  // Get open tickets
  const { data: openTickets } = await supabase
    .from('maintenance_tickets')
    .select('id')
    .eq('tenant_id', tenant?.id ?? '')
    .in('status', ['open', 'in_progress'])

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-PR', { style: 'currency', currency: 'USD' }).format(n)

  const tenantName = tenant ? `${tenant.first_name} ${tenant.last_name}` : user?.email

  return (
    <div className="space-y-5">
      {/* Greeting */}
      <div>
        <h1 className="text-xl font-bold text-[#1a1a2e] dark:text-white">
          Hola, {tenant?.first_name ?? 'Inquilino'} 👋
        </h1>
        <p className="text-sm text-[#64748b] dark:text-slate-400 mt-0.5">
          Bienvenido a tu portal de inquilino
        </p>
      </div>

      {/* Lease summary card */}
      {activeLease ? (
        <div className="bg-white dark:bg-[#1e2130] rounded-2xl border border-[#e8edf0] dark:border-[#2d3148] p-5">
          <p className="text-xs font-medium text-[#94a3b8] dark:text-slate-500 uppercase tracking-wide mb-3">
            Tu residencia
          </p>
          <p className="text-base font-semibold text-[#1a1a2e] dark:text-white">
            Unidad {activeLease.unit?.unit_number}
          </p>
          <p className="text-sm text-[#64748b] dark:text-slate-400">
            {activeLease.unit?.building?.name}
          </p>
          <p className="text-xs text-[#94a3b8] dark:text-slate-500 mt-1">
            {activeLease.unit?.building?.address}
          </p>
          <div className="mt-4 pt-4 border-t border-[#f0f4f0] dark:border-[#2d3148] flex justify-between">
            <div>
              <p className="text-xs text-[#94a3b8] dark:text-slate-500">Renta mensual</p>
              <p className="text-sm font-semibold text-[#1a1a2e] dark:text-white mt-0.5">
                {fmt(activeLease.rent_amount)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[#94a3b8] dark:text-slate-500">Contrato vence</p>
              <p className="text-sm font-semibold text-[#1a1a2e] dark:text-white mt-0.5">
                {new Date(activeLease.end_date).toLocaleDateString('es-PR', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#1e2130] rounded-2xl border border-[#e8edf0] dark:border-[#2d3148] p-5 text-center">
          <p className="text-sm text-[#64748b] dark:text-slate-400">
            No tienes un contrato activo en este momento.
          </p>
        </div>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/portal/pagos"
          className="bg-white dark:bg-[#1e2130] rounded-2xl border border-[#e8edf0] dark:border-[#2d3148] p-4 hover:border-emerald-300 dark:hover:border-emerald-500/30 transition-colors"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              nextPayment?.status === 'late'
                ? 'bg-red-50 dark:bg-red-500/10'
                : nextPayment
                ? 'bg-amber-50 dark:bg-amber-500/10'
                : 'bg-emerald-50 dark:bg-emerald-500/10'
            }`}>
              {nextPayment?.status === 'late' ? (
                <AlertTriangle size={16} className="text-red-500" />
              ) : nextPayment ? (
                <Clock size={16} className="text-amber-500" />
              ) : (
                <CheckCircle size={16} className="text-emerald-500" />
              )}
            </div>
            <CreditCard size={14} className="text-[#94a3b8] dark:text-slate-500" />
          </div>
          <p className="text-xs text-[#94a3b8] dark:text-slate-500">Próximo pago</p>
          {nextPayment ? (
            <>
              <p className="text-base font-bold text-[#1a1a2e] dark:text-white">{fmt(nextPayment.amount)}</p>
              <p className="text-[11px] text-[#64748b] dark:text-slate-400">
                Vence{' '}
                {new Date(nextPayment.due_date).toLocaleDateString('es-PR', { month: 'short', day: 'numeric' })}
              </p>
            </>
          ) : (
            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Al día</p>
          )}
        </Link>

        <Link
          href="/portal/mantenimiento"
          className="bg-white dark:bg-[#1e2130] rounded-2xl border border-[#e8edf0] dark:border-[#2d3148] p-4 hover:border-emerald-300 dark:hover:border-emerald-500/30 transition-colors"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
              <Wrench size={16} className="text-blue-500" />
            </div>
          </div>
          <p className="text-xs text-[#94a3b8] dark:text-slate-500">Solicitudes abiertas</p>
          <p className="text-base font-bold text-[#1a1a2e] dark:text-white">
            {openTickets?.length ?? 0}
          </p>
          <p className="text-[11px] text-[#64748b] dark:text-slate-400">mantenimiento</p>
        </Link>
      </div>

      {/* Quick links */}
      <div className="bg-white dark:bg-[#1e2130] rounded-2xl border border-[#e8edf0] dark:border-[#2d3148] overflow-hidden">
        {[
          { href: '/portal/pagos', label: 'Ver historial de pagos', icon: CreditCard },
          { href: '/portal/mantenimiento', label: 'Reportar un problema', icon: Wrench },
          { href: '/portal/documentos', label: 'Mis documentos', icon: FolderOpen },
        ].map(({ href, label, icon: Icon }, i) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-5 py-4 hover:bg-[#f8fafb] dark:hover:bg-white/5 transition-colors ${
              i !== 0 ? 'border-t border-[#f0f4f0] dark:border-[#2d3148]' : ''
            }`}
          >
            <Icon size={16} className="text-emerald-500 shrink-0" />
            <span className="text-sm text-[#1a1a2e] dark:text-white">{label}</span>
            <span className="ml-auto text-[#94a3b8] dark:text-slate-500 text-lg">›</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
