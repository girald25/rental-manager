'use client'

import { useActionState } from 'react'
import { saveOwnerSettings } from '@/app/actions/owner-settings'
import SubmitButton from '@/components/SubmitButton'
import { Phone, Building, CheckSquare } from 'lucide-react'
import type { OwnerSettings } from '@/types'

const input =
  'w-full border border-[#e8edf0] dark:border-[#2d3148] rounded-xl px-3 py-2.5 text-sm text-[#1a1a2e] dark:text-slate-100 placeholder:text-[#94a3b8] dark:placeholder:text-slate-500 bg-white dark:bg-[#252836] focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors'
const labelCls = 'block text-xs font-medium text-[#64748b] dark:text-slate-400 mb-1.5'

export default function OwnerSettingsClient({ settings }: { settings: OwnerSettings | null }) {
  const [state, formAction] = useActionState(saveOwnerSettings, null)

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div className="px-4 py-3 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl text-sm text-red-600 dark:text-red-400">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="px-4 py-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl text-sm text-emerald-600 dark:text-emerald-400">
          Configuración guardada correctamente.
        </div>
      )}

      {/* ATH Móvil */}
      <div className="bg-white dark:bg-[#1e2130] border border-[#e8edf0] dark:border-[#2d3148] rounded-2xl p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 bg-blue-50 dark:bg-blue-500/10 rounded-lg flex items-center justify-center">
            <Phone size={15} className="text-blue-500" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[#1a1a2e] dark:text-white">ATH Móvil</h2>
            <p className="text-xs text-[#94a3b8] dark:text-slate-500">Número al que los inquilinos enviarán pagos</p>
          </div>
        </div>
        <div>
          <label className={labelCls}>Número de teléfono</label>
          <input
            name="ath_movil_phone"
            type="tel"
            defaultValue={settings?.ath_movil_phone ?? ''}
            placeholder="(787) 555-0000"
            className={input}
          />
        </div>
      </div>

      {/* Bank transfer */}
      <div className="bg-white dark:bg-[#1e2130] border border-[#e8edf0] dark:border-[#2d3148] rounded-2xl p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg flex items-center justify-center">
            <Building size={15} className="text-emerald-500" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[#1a1a2e] dark:text-white">Transferencia bancaria</h2>
            <p className="text-xs text-[#94a3b8] dark:text-slate-500">Información de tu cuenta bancaria</p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Nombre del banco</label>
              <input
                name="bank_name"
                defaultValue={settings?.bank_name ?? ''}
                placeholder="Banco Popular"
                className={input}
              />
            </div>
            <div>
              <label className={labelCls}>Número de ruta (ABA)</label>
              <input
                name="bank_routing"
                defaultValue={settings?.bank_routing ?? ''}
                placeholder="021502011"
                className={input}
              />
            </div>
          </div>
          <div>
            <label className={labelCls}>Número de cuenta</label>
            <input
              name="bank_account"
              defaultValue={settings?.bank_account ?? ''}
              placeholder="••••••••1234"
              className={input}
            />
          </div>
          <div>
            <label className={labelCls}>Nombre del titular de la cuenta</label>
            <input
              name="bank_account_name"
              defaultValue={settings?.bank_account_name ?? ''}
              placeholder="María García"
              className={input}
            />
          </div>
        </div>
      </div>

      {/* Cash / Check */}
      <div className="bg-white dark:bg-[#1e2130] border border-[#e8edf0] dark:border-[#2d3148] rounded-2xl p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 bg-slate-50 dark:bg-slate-500/10 rounded-lg flex items-center justify-center">
            <CheckSquare size={15} className="text-slate-500" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[#1a1a2e] dark:text-white">Otros métodos</h2>
            <p className="text-xs text-[#94a3b8] dark:text-slate-500">Selecciona qué métodos aceptas</p>
          </div>
        </div>
        <div className="space-y-3">
          {[
            { name: 'accept_cash', label: 'Efectivo', desc: 'Entrega en persona' },
            { name: 'accept_check', label: 'Cheque', desc: 'Cheque a tu nombre' },
          ].map(({ name, label: l, desc }) => (
            <label key={name} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name={name}
                value="true"
                defaultChecked={settings ? (settings as any)[name] : true}
                className="w-4 h-4 rounded border-[#e8edf0] text-emerald-500 focus:ring-emerald-500"
              />
              <div>
                <p className="text-sm font-medium text-[#1a1a2e] dark:text-white">{l}</p>
                <p className="text-xs text-[#94a3b8] dark:text-slate-500">{desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <SubmitButton label="Guardar configuración" pendingLabel="Guardando…" />
      </div>
    </form>
  )
}
