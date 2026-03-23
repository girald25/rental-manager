import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { getOwnerSettings } from '@/app/actions/owner-settings'
import { CheckCircle, Clock, AlertTriangle, Phone, Building, CreditCard } from 'lucide-react'

const statusLabel: Record<string, string> = {
  paid: 'Pagado',
  pending: 'Pendiente',
  late: 'Atrasado',
}

const statusStyle: Record<string, string> = {
  paid: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  pending: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400',
  late: 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400',
}

const StatusIcon = ({ status }: { status: string }) => {
  if (status === 'paid') return <CheckCircle size={14} />
  if (status === 'late') return <AlertTriangle size={14} />
  return <Clock size={14} />
}

export default async function PortalPagosPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, lease:leases(id, status, rent_amount)')
    .eq('user_id', user!.id)
    .single()

  const activeLease = tenant?.lease?.find((l: { status: string }) => l.status === 'active') ?? tenant?.lease?.[0]

  const { data: payments } = activeLease
    ? await supabase
        .from('payments')
        .select('*')
        .eq('lease_id', activeLease.id)
        .order('due_date', { ascending: false })
    : { data: [] }

  const ownerSettings = await getOwnerSettings()

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-PR', { style: 'currency', currency: 'USD' }).format(n)

  const nextDue = payments?.find((p) => p.status !== 'paid')

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-[#1a1a2e] dark:text-white">Pagos</h1>
        <p className="text-sm text-[#64748b] dark:text-slate-400 mt-0.5">Historial y métodos de pago</p>
      </div>

      {/* Next payment card */}
      {nextDue && (
        <div className={`rounded-2xl border p-5 ${
          nextDue.status === 'late'
            ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20'
            : 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20'
        }`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-[#64748b] dark:text-slate-400 uppercase tracking-wide">
                {nextDue.status === 'late' ? 'Pago atrasado' : 'Próximo pago'}
              </p>
              <p className="text-2xl font-bold text-[#1a1a2e] dark:text-white mt-1">
                {fmt(nextDue.amount)}
              </p>
              <p className="text-sm text-[#64748b] dark:text-slate-400 mt-0.5">
                Vence{' '}
                {new Date(nextDue.due_date).toLocaleDateString('es-PR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              nextDue.status === 'late'
                ? 'bg-red-100 dark:bg-red-500/20 text-red-500'
                : 'bg-amber-100 dark:bg-amber-500/20 text-amber-500'
            }`}>
              <StatusIcon status={nextDue.status} />
            </div>
          </div>
        </div>
      )}

      {/* Payment methods */}
      <div className="bg-white dark:bg-[#1e2130] rounded-2xl border border-[#e8edf0] dark:border-[#2d3148] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#f0f4f0] dark:border-[#2d3148]">
          <h2 className="text-sm font-semibold text-[#1a1a2e] dark:text-white">Métodos de pago</h2>
        </div>

        {/* ATH Móvil */}
        {ownerSettings?.ath_movil_phone && (
          <div className="px-5 py-4 border-b border-[#f0f4f0] dark:border-[#2d3148]">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-blue-50 dark:bg-blue-500/10 rounded-xl flex items-center justify-center shrink-0">
                <Phone size={16} className="text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#1a1a2e] dark:text-white">ATH Móvil</p>
                <p className="text-xs text-[#64748b] dark:text-slate-400 mt-0.5">
                  Envía tu pago al número: <span className="font-semibold">{ownerSettings.ath_movil_phone}</span>
                </p>
                <p className="text-xs text-[#94a3b8] dark:text-slate-500 mt-1">
                  Incluye tu nombre y el mes en el mensaje
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Bank transfer */}
        {ownerSettings?.bank_name && (
          <div className="px-5 py-4 border-b border-[#f0f4f0] dark:border-[#2d3148]">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center shrink-0">
                <Building size={16} className="text-emerald-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#1a1a2e] dark:text-white">Transferencia bancaria</p>
                <p className="text-xs text-[#64748b] dark:text-slate-400 mt-0.5">
                  Banco: <span className="font-semibold">{ownerSettings.bank_name}</span>
                </p>
                {ownerSettings.bank_account_name && (
                  <p className="text-xs text-[#64748b] dark:text-slate-400">
                    A nombre de: <span className="font-semibold">{ownerSettings.bank_account_name}</span>
                  </p>
                )}
                {ownerSettings.bank_account && (
                  <p className="text-xs text-[#64748b] dark:text-slate-400">
                    Cuenta: <span className="font-semibold">{ownerSettings.bank_account}</span>
                  </p>
                )}
                {ownerSettings.bank_routing && (
                  <p className="text-xs text-[#94a3b8] dark:text-slate-500">
                    Ruta: {ownerSettings.bank_routing}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Cash/Check */}
        {(ownerSettings?.accept_cash || ownerSettings?.accept_check || !ownerSettings) && (
          <div className="px-5 py-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-slate-50 dark:bg-slate-500/10 rounded-xl flex items-center justify-center shrink-0">
                <CreditCard size={16} className="text-slate-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#1a1a2e] dark:text-white">Efectivo / Cheque</p>
                <p className="text-xs text-[#64748b] dark:text-slate-400 mt-0.5">
                  Coordina la entrega directamente con tu propietario
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Payment history */}
      <div className="bg-white dark:bg-[#1e2130] rounded-2xl border border-[#e8edf0] dark:border-[#2d3148] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#f0f4f0] dark:border-[#2d3148]">
          <h2 className="text-sm font-semibold text-[#1a1a2e] dark:text-white">Historial de pagos</h2>
        </div>
        {!payments || payments.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-[#94a3b8] dark:text-slate-500">
            No hay pagos registrados
          </div>
        ) : (
          <div>
            {payments.map((p, i) => (
              <div
                key={p.id}
                className={`flex items-center justify-between px-5 py-3.5 ${
                  i !== 0 ? 'border-t border-[#f0f4f0] dark:border-[#2d3148]' : ''
                }`}
              >
                <div>
                  <p className="text-sm font-medium text-[#1a1a2e] dark:text-white">
                    {new Date(p.due_date).toLocaleDateString('es-PR', { month: 'long', year: 'numeric' })}
                  </p>
                  <p className="text-xs text-[#94a3b8] dark:text-slate-500">
                    Vencía {new Date(p.due_date).toLocaleDateString('es-PR', { month: 'short', day: 'numeric' })}
                    {p.paid_date && ` · Pagado ${new Date(p.paid_date).toLocaleDateString('es-PR', { month: 'short', day: 'numeric' })}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-[#1a1a2e] dark:text-white">{fmt(p.amount)}</span>
                  <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusStyle[p.status]}`}>
                    <StatusIcon status={p.status} />
                    {statusLabel[p.status] ?? p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
