'use client'

import { useActionState, useState } from 'react'
import { Plus, Pencil, Trash2, Users, Mail, CheckCircle, Clock, AlertTriangle } from 'lucide-react'
import Modal from '@/components/Modal'
import SubmitButton from '@/components/SubmitButton'
import { createTenant, updateTenant, deleteTenant } from '@/app/actions/tenants'
import { sendTenantInvitation } from '@/app/actions/invitations'
import type { Tenant } from '@/types'

const input =
  'w-full border border-[#e8edf0] dark:border-[#2d3148] rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-slate-100 placeholder:text-[#94a3b8] dark:placeholder:text-slate-500 bg-white dark:bg-[#252836] focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors'
const label = 'block text-xs font-medium text-[#64748b] dark:text-slate-400 mb-1.5'

type InviteStatus = 'none' | 'invited' | 'accepted' | 'expired'

function getInviteStatus(
  tenantUserId: string | null | undefined,
  inv: { accepted_at: string | null; expires_at: string } | undefined
): InviteStatus {
  if (tenantUserId) return 'accepted'
  if (!inv) return 'none'
  if (inv.accepted_at) return 'accepted'
  if (new Date(inv.expires_at) < new Date()) return 'expired'
  return 'invited'
}

function InviteBadge({ status }: { status: InviteStatus }) {
  if (status === 'accepted') {
    return (
      <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
        <CheckCircle size={10} /> Portal activo
      </span>
    )
  }
  if (status === 'invited') {
    return (
      <span className="flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded-full">
        <Clock size={10} /> Invitación enviada
      </span>
    )
  }
  if (status === 'expired') {
    return (
      <span className="flex items-center gap-1 text-[10px] font-medium text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-1.5 py-0.5 rounded-full">
        <AlertTriangle size={10} /> Invitación expirada
      </span>
    )
  }
  return null
}

function TenantForm({
  tenant,
  action,
}: {
  tenant?: Tenant & { user_id?: string | null }
  action: (prevState: any, formData: FormData) => Promise<any>
}) {
  const [state, formAction] = useActionState(action, null)
  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 px-3 py-2 rounded-md">
          {state.error}
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={label}>Nombre</label>
          <input name="first_name" required defaultValue={tenant?.first_name} className={input} placeholder="María" />
        </div>
        <div>
          <label className={label}>Apellido</label>
          <input name="last_name" required defaultValue={tenant?.last_name} className={input} placeholder="García" />
        </div>
        <div className="col-span-1 sm:col-span-2">
          <label className={label}>Correo electrónico</label>
          <input name="email" type="email" defaultValue={tenant?.email ?? ''} className={input} placeholder="maria@ejemplo.com" />
        </div>
        <div className="col-span-1 sm:col-span-2">
          <label className={label}>Teléfono</label>
          <input name="phone" type="tel" defaultValue={tenant?.phone ?? ''} className={input} placeholder="(787) 555-0000" />
        </div>
        <div className="col-span-1 sm:col-span-2 pt-1 border-t border-[#f0f4f0] dark:border-[#2d3148]">
          <p className="text-xs font-medium text-[#94a3b8] dark:text-slate-500 uppercase tracking-wide mb-3">Contacto de emergencia</p>
        </div>
        <div>
          <label className={label}>Nombre</label>
          <input name="emergency_contact" defaultValue={tenant?.emergency_contact ?? ''} className={input} placeholder="Juan García" />
        </div>
        <div>
          <label className={label}>Teléfono</label>
          <input name="emergency_phone" type="tel" defaultValue={tenant?.emergency_phone ?? ''} className={input} placeholder="(787) 555-0001" />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-1 border-t border-[#f0f4f0] dark:border-[#2d3148]">
        <SubmitButton label={tenant ? 'Guardar cambios' : 'Añadir inquilino'} />
      </div>
    </form>
  )
}

function InviteModal({
  tenant,
  onClose,
}: {
  tenant: Tenant & { user_id?: string | null }
  onClose: () => void
}) {
  const [state, formAction] = useActionState(sendTenantInvitation, null)

  if (state?.success) {
    return (
      <div className="text-center py-4">
        <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
          <CheckCircle size={18} className="text-emerald-500" />
        </div>
        <p className="text-sm font-medium text-[#1a1a2e] dark:text-white mb-1">¡Invitación enviada!</p>
        <p className="text-xs text-[#64748b] dark:text-slate-400">
          Se envió un correo de invitación a {tenant.email}
        </p>
        <button
          onClick={onClose}
          className="mt-4 text-sm text-emerald-600 dark:text-emerald-400 font-medium hover:underline"
        >
          Cerrar
        </button>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="tenant_id" value={tenant.id} />
      <p className="text-sm text-[#64748b] dark:text-slate-400">
        Se enviará una invitación a <span className="font-medium text-[#1a1a2e] dark:text-white">{tenant.first_name} {tenant.last_name}</span> para que cree su cuenta en el portal de inquilinos.
      </p>
      {state?.error && (
        <p className="text-xs text-red-500 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 px-3 py-2 rounded-md">
          {state.error}
        </p>
      )}
      <div>
        <label className={label}>Correo electrónico del inquilino</label>
        <input
          name="email"
          type="email"
          required
          defaultValue={tenant.email ?? ''}
          placeholder="inquilino@ejemplo.com"
          className={input}
        />
      </div>
      <div className="flex justify-end gap-2 pt-1 border-t border-[#f0f4f0] dark:border-[#2d3148]">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-xl border border-[#e8edf0] dark:border-[#2d3148] text-sm text-[#64748b] dark:text-slate-400 hover:bg-[#f8fafb] dark:hover:bg-white/5 transition-colors"
        >
          Cancelar
        </button>
        <SubmitButton label="Enviar invitación" pendingLabel="Enviando…" />
      </div>
    </form>
  )
}

type TenantWithUserId = Tenant & { user_id?: string | null }

export default function TenantsClient({
  tenants,
  inviteMap,
}: {
  tenants: TenantWithUserId[]
  inviteMap: Record<string, { accepted_at: string | null; expires_at: string }>
}) {
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<TenantWithUserId | null>(null)
  const [inviting, setInviting] = useState<TenantWithUserId | null>(null)
  const [createKey, setCreateKey] = useState(0)
  const [editKey, setEditKey] = useState(0)
  const [search, setSearch] = useState('')

  const createAction = async (prevState: any, formData: FormData) => {
    const result = await createTenant(prevState, formData)
    if (result?.success) setShowCreate(false)
    return result
  }
  const editAction = async (prevState: any, formData: FormData) => {
    if (!editing) return prevState
    const result = await updateTenant(editing.id, prevState, formData)
    if (result?.success) setEditing(null)
    return result
  }
  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este inquilino?')) return
    await deleteTenant(id)
  }

  const filtered = tenants.filter((t) => {
    const q = search.toLowerCase()
    return (
      !q ||
      t.first_name.toLowerCase().includes(q) ||
      t.last_name.toLowerCase().includes(q) ||
      t.email?.toLowerCase().includes(q)
    )
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[#1a1a2e] dark:text-slate-100">Inquilinos</h1>
          <p className="text-sm text-[#64748b] dark:text-slate-400 mt-0.5">
            {tenants.length} inquilino{tenants.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => { setCreateKey((k) => k + 1); setShowCreate(true) }}
          className="flex items-center gap-1.5 px-3 py-2.5 md:py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-500 transition-colors min-h-[44px] md:min-h-0"
        >
          <Plus size={14} />
          Añadir inquilino
        </button>
      </div>

      <div className="mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:max-w-xs border border-[#e8edf0] dark:border-[#2d3148] rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-slate-100 placeholder:text-[#94a3b8] dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors bg-white dark:bg-[#252836]"
          placeholder="Buscar inquilinos…"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-[#1e2130] border border-[#e8edf0] dark:border-[#2d3148] rounded-2xl p-8 md:p-16 text-center shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <Users size={28} className="mx-auto text-zinc-200 dark:text-slate-700 mb-3" />
          <p className="text-sm font-medium text-[#64748b] dark:text-slate-400">
            {search ? 'Sin resultados' : 'Sin inquilinos aún'}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {filtered.map((t) => {
              const status = getInviteStatus(t.user_id, inviteMap[t.id])
              return (
                <div key={t.id} className="bg-white dark:bg-[#1e2130] border border-[#e8edf0] dark:border-[#2d3148] rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 bg-zinc-100 dark:bg-white/10 rounded-full flex items-center justify-center shrink-0 text-zinc-600 dark:text-slate-300 text-xs font-semibold mt-0.5">
                        {t.first_name[0]}{t.last_name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-[#1a1a2e] dark:text-slate-100">{t.first_name} {t.last_name}</p>
                          <InviteBadge status={status} />
                        </div>
                        {t.email && <p className="text-xs text-[#64748b] dark:text-slate-400 mt-0.5 truncate">{t.email}</p>}
                        {t.phone && <p className="text-xs text-[#94a3b8] dark:text-slate-500 mt-0.5">{t.phone}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      {status !== 'accepted' && t.email && (
                        <button
                          onClick={() => setInviting(t)}
                          className="p-2.5 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-md transition-colors"
                          title="Invitar al portal"
                        >
                          <Mail size={15} />
                        </button>
                      )}
                      <button
                        onClick={() => { setEditKey((k) => k + 1); setEditing(t) }}
                        className="p-2.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:text-slate-500 dark:hover:text-slate-100 dark:hover:bg-white/5 rounded-md transition-colors"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="p-2.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-white dark:bg-[#1e2130] border border-[#e8edf0] dark:border-[#2d3148] rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#f0f4f0] dark:border-[#2d3148]">
                  <th className="text-left text-xs font-medium text-[#94a3b8] dark:text-slate-500 uppercase tracking-wide px-4 py-3">Nombre</th>
                  <th className="text-left text-xs font-medium text-[#94a3b8] dark:text-slate-500 uppercase tracking-wide px-4 py-3">Correo</th>
                  <th className="text-left text-xs font-medium text-[#94a3b8] dark:text-slate-500 uppercase tracking-wide px-4 py-3">Teléfono</th>
                  <th className="text-left text-xs font-medium text-[#94a3b8] dark:text-slate-500 uppercase tracking-wide px-4 py-3">Portal</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f8fafc] dark:divide-[#252836]">
                {filtered.map((t) => {
                  const status = getInviteStatus(t.user_id, inviteMap[t.id])
                  return (
                    <tr key={t.id} className="hover:bg-[#fafbfc] dark:hover:bg-[#252836] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 bg-zinc-100 dark:bg-white/10 rounded-full flex items-center justify-center shrink-0 text-zinc-600 dark:text-slate-300 text-xs font-semibold">
                            {t.first_name[0]}{t.last_name[0]}
                          </div>
                          <span className="text-sm font-medium text-[#1a1a2e] dark:text-slate-100">
                            {t.first_name} {t.last_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#64748b] dark:text-slate-400">
                        {t.email ?? <span className="text-zinc-300 dark:text-slate-600">—</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#64748b] dark:text-slate-400">
                        {t.phone ?? <span className="text-zinc-300 dark:text-slate-600">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <InviteBadge status={status} />
                        {status === 'none' && (
                          <span className="text-xs text-[#94a3b8] dark:text-slate-600">Sin cuenta</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {status !== 'accepted' && t.email && (
                            <button
                              onClick={() => setInviting(t)}
                              className="p-1.5 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-md transition-colors"
                              title="Invitar al portal"
                            >
                              <Mail size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => { setEditKey((k) => k + 1); setEditing(t) }}
                            className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:text-slate-500 dark:hover:text-slate-100 dark:hover:bg-white/5 rounded-md transition-colors"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(t.id)}
                            className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Añadir inquilino">
        <TenantForm key={createKey} action={createAction} />
      </Modal>
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar inquilino">
        {editing && <TenantForm key={editKey} tenant={editing} action={editAction} />}
      </Modal>
      <Modal open={!!inviting} onClose={() => setInviting(null)} title="Invitar al portal">
        {inviting && <InviteModal tenant={inviting} onClose={() => setInviting(null)} />}
      </Modal>
    </div>
  )
}
