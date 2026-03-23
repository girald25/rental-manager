import { getOwnerSettings } from '@/app/actions/owner-settings'
import OwnerSettingsClient from './OwnerSettingsClient'

export default async function ConfiguracionPage() {
  const settings = await getOwnerSettings()

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#1a1a2e] dark:text-slate-100">Configuración</h1>
        <p className="text-sm text-[#64748b] dark:text-slate-400 mt-0.5">
          Métodos de pago y configuración del portal de inquilinos
        </p>
      </div>
      <OwnerSettingsClient settings={settings} />
    </div>
  )
}
