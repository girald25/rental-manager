'use client'

import { useActionState, useState } from 'react'
import { createMaintenanceTicket } from '@/app/actions/maintenance-tickets'
import { Plus, X, Wrench, Clock, CheckCircle, AlertTriangle } from 'lucide-react'
import type { MaintenanceTicket } from '@/types'

const statusLabel: Record<string, string> = {
  open: 'Abierto',
  in_progress: 'En proceso',
  completed: 'Completado',
}

const priorityLabel: Record<string, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  urgent: 'Urgente',
}

const statusStyle: Record<string, string> = {
  open: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400',
  in_progress: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400',
  completed: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
}

const priorityStyle: Record<string, string> = {
  urgent: 'text-red-500',
  high: 'text-orange-500',
  medium: 'text-amber-500',
  low: 'text-slate-400',
}

const StatusIcon = ({ status }: { status: string }) => {
  if (status === 'completed') return <CheckCircle size={12} />
  if (status === 'in_progress') return <Clock size={12} />
  return <AlertTriangle size={12} />
}

export default function PortalMaintenanceClient({
  tenantId,
  unitId,
  unitLabel,
  tickets,
}: {
  tenantId: string
  unitId: string
  unitLabel: string
  tickets: MaintenanceTicket[]
}) {
  const [showForm, setShowForm] = useState(false)
  const [state, formAction] = useActionState(createMaintenanceTicket, null)

  const input =
    'w-full border border-[#e8edf0] dark:border-[#2d3148] rounded-xl px-3 py-2.5 text-sm text-[#1a1a2e] dark:text-white bg-white dark:bg-[#252836] placeholder:text-[#94a3b8] dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors'

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1a1a2e] dark:text-white">Mantenimiento</h1>
          <p className="text-sm text-[#64748b] dark:text-slate-400 mt-0.5">Reporta problemas en tu unidad</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-full hover:bg-emerald-600 transition-colors"
        >
          <Plus size={15} />
          Reportar
        </button>
      </div>

      {/* New ticket modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1e2130] rounded-2xl border border-[#e8edf0] dark:border-[#2d3148] w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-[#f0f4f0] dark:border-[#2d3148]">
              <h2 className="text-sm font-semibold text-[#1a1a2e] dark:text-white">Nuevo reporte de mantenimiento</h2>
              <button onClick={() => setShowForm(false)} className="text-[#94a3b8] hover:text-[#64748b]">
                <X size={18} />
              </button>
            </div>
            <form action={formAction} className="p-5 space-y-4" onSubmit={() => setShowForm(false)}>
              <input type="hidden" name="tenant_id" value={tenantId} />
              <input type="hidden" name="unit_id" value={unitId} />
              {unitLabel && (
                <div className="px-3 py-2.5 bg-[#f8fafb] dark:bg-[#252836] rounded-xl text-sm text-[#64748b] dark:text-slate-400">
                  {unitLabel}
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-[#64748b] dark:text-slate-400 mb-1.5">
                  Título del problema *
                </label>
                <input
                  name="title"
                  required
                  placeholder="Ej: Fuga en el baño"
                  className={input}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#64748b] dark:text-slate-400 mb-1.5">
                  Descripción
                </label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Describe el problema con más detalle..."
                  className={`${input} resize-none`}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#64748b] dark:text-slate-400 mb-1.5">
                  Prioridad
                </label>
                <select name="priority" defaultValue="medium" className={input}>
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                  <option value="urgent">Urgente</option>
                </select>
              </div>
              {state?.error && (
                <p className="text-xs text-red-500">{state.error}</p>
              )}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-[#e8edf0] dark:border-[#2d3148] text-sm text-[#64748b] dark:text-slate-400 hover:bg-[#f8fafb] dark:hover:bg-white/5 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors"
                >
                  Enviar reporte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ticket list */}
      {tickets.length === 0 ? (
        <div className="bg-white dark:bg-[#1e2130] rounded-2xl border border-[#e8edf0] dark:border-[#2d3148] p-10 text-center">
          <div className="w-10 h-10 bg-[#f0f4f0] dark:bg-white/5 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Wrench size={18} className="text-[#94a3b8] dark:text-slate-500" />
          </div>
          <p className="text-sm text-[#64748b] dark:text-slate-400">No tienes solicitudes activas</p>
          <p className="text-xs text-[#94a3b8] dark:text-slate-500 mt-1">
            Usa el botón "Reportar" para crear una solicitud
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <div
              key={t.id}
              className="bg-white dark:bg-[#1e2130] rounded-2xl border border-[#e8edf0] dark:border-[#2d3148] p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#1a1a2e] dark:text-white truncate">{t.title}</p>
                  {t.description && (
                    <p className="text-xs text-[#64748b] dark:text-slate-400 mt-0.5 line-clamp-2">
                      {t.description}
                    </p>
                  )}
                </div>
                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0 ${statusStyle[t.status]}`}>
                  <StatusIcon status={t.status} />
                  {statusLabel[t.status] ?? t.status}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-3">
                <span className={`text-xs font-medium ${priorityStyle[t.priority]}`}>
                  {priorityLabel[t.priority]}
                </span>
                <span className="text-xs text-[#94a3b8] dark:text-slate-500">
                  {new Date(t.created_at).toLocaleDateString('es-PR', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
                {t.notes && (
                  <span className="text-xs text-[#64748b] dark:text-slate-400 ml-auto">
                    Nota: {t.notes}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
