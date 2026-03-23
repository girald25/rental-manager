'use client'

import { useActionState, useState, useTransition, useRef } from 'react'
import {
  Plus, Pencil, Trash2, ChevronDown, SlidersHorizontal,
  HardHat, MessageSquarePlus, X, Send,
} from 'lucide-react'
import Modal from '@/components/Modal'
import SubmitButton from '@/components/SubmitButton'
import {
  createProject, updateProject, deleteProject,
  addProjectNote, deleteProjectNote, updateProjectStatus,
} from '@/app/actions/projects'
import type { Project, ProjectNote, Building, ActionState } from '@/types'

// ── Styles ────────────────────────────────────────────────
const input =
  'w-full border border-[#e8edf0] dark:border-[#2d3148] rounded-md px-3 py-2 text-sm text-zinc-900 dark:text-slate-100 placeholder:text-zinc-400 dark:placeholder:text-slate-500 bg-white dark:bg-[#252836] focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:focus:ring-emerald-500 focus:border-emerald-500 dark:focus:border-emerald-500 transition-colors'
const selectCls =
  'w-full border border-[#e8edf0] dark:border-[#2d3148] rounded-md px-3 py-2 text-sm text-zinc-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:focus:ring-emerald-500 focus:border-emerald-500 dark:focus:border-emerald-500 transition-colors bg-white dark:bg-[#252836]'
const lbl = 'block text-xs font-medium text-zinc-600 dark:text-slate-400 mb-1.5'

const STATUS_LABELS: Record<string, string> = {
  planning: 'Planificación',
  in_progress: 'En Progreso',
  on_hold: 'En Pausa',
  completed: 'Completado',
}
const STATUSES = ['planning', 'in_progress', 'on_hold', 'completed'] as const

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Baja', medium: 'Media', high: 'Alta', urgent: 'Urgente',
}
const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const

const statusBadge: Record<string, string> = {
  planning:    'bg-zinc-100 text-zinc-600 dark:bg-white/5 dark:text-slate-400',
  in_progress: 'bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
  on_hold:     'bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
  completed:   'bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
}

const priorityBadge: Record<string, string> = {
  urgent: 'bg-red-50 text-red-700 border border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20',
  high:   'bg-orange-50 text-orange-700 border border-orange-100 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20',
  medium: 'bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
  low:    'bg-zinc-100 text-zinc-500 dark:bg-white/5 dark:text-slate-400',
}

function fmt(n: number) {
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}

// ── Progress bar ─────────────────────────────────────────
function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full bg-zinc-100 dark:bg-white/10 rounded-full h-1.5 overflow-hidden">
      <div
        className="h-1.5 rounded-full bg-zinc-900 dark:bg-emerald-500 transition-all"
        style={{ width: `${value}%` }}
      />
    </div>
  )
}

// ── Project form ─────────────────────────────────────────
function ProjectForm({
  project,
  buildings,
  units,
  action,
}: {
  project?: Project
  buildings: Building[]
  units: any[]
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>
}) {
  const [state, formAction] = useActionState(action, null)
  const [selectedBuilding, setSelectedBuilding] = useState(project?.building_id ?? '')
  const filteredUnits = selectedBuilding
    ? units.filter((u: any) => u.building_id === selectedBuilding)
    : units

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 px-3 py-2 rounded-md">
          {state.error}
        </p>
      )}

      {/* Title */}
      <div>
        <label className={lbl}>Título</label>
        <input name="title" required defaultValue={project?.title} placeholder="ej. Renovación de Cocina" className={input} />
      </div>

      {/* Description */}
      <div>
        <label className={lbl}>Descripción</label>
        <textarea name="description" rows={2} defaultValue={project?.description ?? ''} placeholder="Alcance del trabajo…" className={`${input} resize-none`} />
      </div>

      {/* Status + Priority */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={lbl}>Estado</label>
          <select name="status" defaultValue={project?.status ?? 'planning'} className={selectCls}>
            {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
        </div>
        <div>
          <label className={lbl}>Prioridad</label>
          <select name="priority" defaultValue={project?.priority ?? 'medium'} className={selectCls}>
            {PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
          </select>
        </div>
      </div>

      {/* Building + Unit */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={lbl}>Edificio</label>
          <select
            name="building_id"
            defaultValue={project?.building_id ?? ''}
            className={selectCls}
            onChange={(e) => setSelectedBuilding(e.target.value)}
          >
            <option value="">Sin edificio específico</option>
            {buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div>
          <label className={lbl}>Unidad (opcional)</label>
          <select name="unit_id" defaultValue={project?.unit_id ?? ''} className={selectCls}>
            <option value="">Sin unidad específica</option>
            {filteredUnits.map((u: any) => (
              <option key={u.id} value={u.id}>Unidad {u.unit_number}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Budget + Actual cost */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={lbl}>Presupuesto ($)</label>
          <input name="budget" type="number" min="0" step="0.01" defaultValue={project?.budget ?? ''} placeholder="0.00" className={input} />
        </div>
        <div>
          <label className={lbl}>Costo real ($)</label>
          <input name="actual_cost" type="number" min="0" step="0.01" defaultValue={project?.actual_cost ?? ''} placeholder="0.00" className={input} />
        </div>
      </div>

      {/* Progress */}
      <div>
        <label className={lbl}>Progreso (%)</label>
        <input name="progress" type="number" min="0" max="100" defaultValue={project?.progress ?? 0} className={input} />
      </div>

      {/* Contractor */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={lbl}>Nombre del Contratista</label>
          <input name="contractor_name" defaultValue={project?.contractor_name ?? ''} placeholder="Empresa o persona" className={input} />
        </div>
        <div>
          <label className={lbl}>Contacto del Contratista</label>
          <input name="contractor_contact" defaultValue={project?.contractor_contact ?? ''} placeholder="Teléfono o correo" className={input} />
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className={lbl}>Fecha de Inicio</label>
          <input name="start_date" type="date" defaultValue={project?.start_date ?? ''} className={input} />
        </div>
        <div>
          <label className={lbl}>Fecha de Fin Est.</label>
          <input name="estimated_end_date" type="date" defaultValue={project?.estimated_end_date ?? ''} className={input} />
        </div>
        <div>
          <label className={lbl}>Fecha de Fin Real</label>
          <input name="actual_end_date" type="date" defaultValue={project?.actual_end_date ?? ''} className={input} />
        </div>
      </div>

      <SubmitButton label={project ? 'Guardar cambios' : 'Crear proyecto'} />
    </form>
  )
}

// ── Detail drawer ─────────────────────────────────────────
function ProjectDetail({
  project,
  buildings,
  units,
  onClose,
  onEdit,
}: {
  project: Project
  buildings: Building[]
  units: any[]
  onClose: () => void
  onEdit: () => void
}) {
  const [noteText, setNoteText] = useState('')
  const [isPending, startTransition] = useTransition()
  const notes: ProjectNote[] = (project.notes ?? []).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  const budget = project.budget ? Number(project.budget) : null
  const spent = project.actual_cost ? Number(project.actual_cost) : null

  function handleAddNote() {
    if (!noteText.trim()) return
    startTransition(async () => {
      await addProjectNote(project.id, noteText.trim())
      setNoteText('')
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-black/20" onClick={onClose} />
      <div className="relative bg-white dark:bg-[#1e2130] w-full max-w-xl h-full overflow-y-auto shadow-2xl border-l border-[#e8edf0] dark:border-[#2d3148] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-[#f0f4f0] dark:border-[#2d3148] shrink-0">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge[project.status]}`}>
                {STATUS_LABELS[project.status]}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityBadge[project.priority]}`}>
                {PRIORITY_LABELS[project.priority]}
              </span>
            </div>
            <h2 className="text-base font-semibold text-[#1a1a2e] dark:text-slate-100 leading-tight">{project.title}</h2>
            {project.building && (
              <p className="text-xs text-[#94a3b8] dark:text-slate-500 mt-0.5">
                {project.building.name}
                {project.unit && <> · Unit {project.unit.unit_number}</>}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={onEdit}
              className="p-1.5 text-zinc-400 dark:text-slate-500 hover:text-zinc-700 dark:hover:text-slate-100 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-md transition-colors"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 dark:text-slate-500 hover:text-zinc-700 dark:hover:text-slate-100 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-md transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-[#64748b] dark:text-slate-400 uppercase tracking-wide">Progreso</span>
              <span className="text-sm font-semibold text-[#1a1a2e] dark:text-slate-100">{project.progress}%</span>
            </div>
            <ProgressBar value={project.progress} />
          </div>

          {/* Budget */}
          {(budget !== null || spent !== null) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-zinc-50 dark:bg-[#141520] rounded-xl p-3">
                <p className="text-xs text-[#94a3b8] dark:text-slate-500 mb-1">Presupuesto</p>
                <p className="text-sm font-semibold text-[#1a1a2e] dark:text-slate-100">{budget !== null ? fmt(budget) : '—'}</p>
              </div>
              <div className="bg-zinc-50 dark:bg-[#141520] rounded-xl p-3">
                <p className="text-xs text-[#94a3b8] dark:text-slate-500 mb-1">Real</p>
                <p className={`text-sm font-semibold ${budget !== null && spent !== null && spent > budget ? 'text-red-600' : 'text-[#1a1a2e] dark:text-slate-100'}`}>
                  {spent !== null ? fmt(spent) : '—'}
                  {budget !== null && spent !== null && (
                    <span className="text-xs font-normal text-[#94a3b8] dark:text-slate-500 ml-1">
                      ({Math.round((spent / budget) * 100)}%)
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Description */}
          {project.description && (
            <div>
              <p className="text-xs font-medium text-[#64748b] dark:text-slate-400 uppercase tracking-wide mb-1.5">Descripción</p>
              <p className="text-sm text-zinc-700 dark:text-slate-300 leading-relaxed">{project.description}</p>
            </div>
          )}

          {/* Contractor */}
          {(project.contractor_name || project.contractor_contact) && (
            <div>
              <p className="text-xs font-medium text-[#64748b] dark:text-slate-400 uppercase tracking-wide mb-1.5">Contratista</p>
              {project.contractor_name && <p className="text-sm font-medium text-[#1a1a2e] dark:text-slate-100">{project.contractor_name}</p>}
              {project.contractor_contact && <p className="text-sm text-[#64748b] dark:text-slate-400">{project.contractor_contact}</p>}
            </div>
          )}

          {/* Dates */}
          {(project.start_date || project.estimated_end_date || project.actual_end_date) && (
            <div>
              <p className="text-xs font-medium text-[#64748b] dark:text-slate-400 uppercase tracking-wide mb-2">Cronograma</p>
              <div className="space-y-1.5">
                {project.start_date && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#94a3b8] dark:text-slate-500">Iniciado</span>
                    <span className="text-zinc-700 dark:text-slate-300 tabular-nums">{project.start_date}</span>
                  </div>
                )}
                {project.estimated_end_date && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#94a3b8] dark:text-slate-500">Fin estimado</span>
                    <span className="text-zinc-700 dark:text-slate-300 tabular-nums">{project.estimated_end_date}</span>
                  </div>
                )}
                {project.actual_end_date && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#94a3b8] dark:text-slate-500">Completado</span>
                    <span className="text-emerald-700 dark:text-emerald-400 tabular-nums">{project.actual_end_date}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <p className="text-xs font-medium text-[#64748b] dark:text-slate-400 uppercase tracking-wide mb-3">Notas</p>

            {/* Add note */}
            <div className="flex gap-2 mb-4">
              <input
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddNote() } }}
                placeholder="Añadir nota…"
                className={`${input} flex-1`}
              />
              <button
                onClick={handleAddNote}
                disabled={!noteText.trim() || isPending}
                className="px-3 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-500 disabled:opacity-40 transition-colors"
              >
                <Send size={14} />
              </button>
            </div>

            {notes.length === 0 ? (
              <p className="text-sm text-[#94a3b8] dark:text-slate-500">Sin notas aún.</p>
            ) : (
              <div className="space-y-3">
                {notes.map((n) => (
                  <div key={n.id} className="flex items-start gap-3 group">
                    <div className="flex-1 bg-zinc-50 dark:bg-[#141520] rounded-xl px-3 py-2.5">
                      <p className="text-sm text-zinc-700 dark:text-slate-300 leading-relaxed">{n.note}</p>
                      <p className="text-xs text-[#94a3b8] dark:text-slate-500 mt-1">
                        {new Date(n.created_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                          hour: 'numeric', minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        if (!confirm('¿Eliminar esta nota?')) return
                        await deleteProjectNote(n.id)
                      }}
                      className="p-1.5 text-zinc-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 rounded-md opacity-0 group-hover:opacity-100 transition-all mt-0.5 shrink-0"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Status board column ──────────────────────────────────
function StatusColumn({
  status,
  projects,
  onSelect,
}: {
  status: string
  projects: Project[]
  onSelect: (p: Project) => void
}) {
  return (
    <div className="flex-1 min-w-[220px]">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-zinc-700 dark:text-slate-300 uppercase tracking-wide">
          {STATUS_LABELS[status]}
        </span>
        <span className="text-xs text-[#94a3b8] dark:text-slate-500 bg-zinc-100 dark:bg-white/10 rounded-full px-2 py-0.5 font-medium">
          {projects.length}
        </span>
      </div>
      <div className="space-y-2">
        {projects.length === 0 && (
          <p className="text-xs text-zinc-300 dark:text-slate-600 py-4 text-center border border-dashed border-[#e8edf0] dark:border-[#2d3148] rounded-2xl">
            Sin proyectos
          </p>
        )}
        {projects.map((p) => (
          <button
            key={p.id}
            onClick={() => onSelect(p)}
            className="w-full text-left bg-white dark:bg-[#1e2130] border border-[#e8edf0] dark:border-[#2d3148] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-3 hover:border-zinc-300 dark:hover:border-[#3d4268] hover:shadow-sm transition-all"
          >
            <p className="text-sm font-medium text-[#1a1a2e] dark:text-slate-100 leading-snug mb-1.5 line-clamp-2">{p.title}</p>
            {p.building && (
              <p className="text-xs text-[#94a3b8] dark:text-slate-500 mb-2">
                {p.building.name}{p.unit ? ` · U${p.unit.unit_number}` : ''}
              </p>
            )}
            <ProgressBar value={p.progress} />
            <div className="flex items-center justify-between mt-2">
              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${priorityBadge[p.priority]}`}>
                {PRIORITY_LABELS[p.priority]}
              </span>
              <span className="text-xs text-[#94a3b8] dark:text-slate-500 tabular-nums">{p.progress}%</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────
type Stats = { active: number; totalBudget: number; totalSpent: number; avgProgress: number; total: number }

export default function ProjectsClient({
  projects,
  buildings,
  units,
  stats,
}: {
  projects: Project[]
  buildings: Building[]
  units: any[]
  stats: Stats
}) {
  const [view, setView] = useState<'board' | 'list'>('board')
  const [showCreate, setShowCreate] = useState(false)
  const [createKey, setCreateKey] = useState(0)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [editKey, setEditKey] = useState(0)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  // Filters
  const [filterBuilding, setFilterBuilding] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [sortBy, setSortBy] = useState<'updated_at' | 'priority' | 'status' | 'progress'>('updated_at')

  // Find latest project data for detail view (updates after note add)
  const detailProject = selectedProject
    ? projects.find((p) => p.id === selectedProject.id) ?? selectedProject
    : null

  const filtered = projects
    .filter((p) => !filterBuilding || p.building_id === filterBuilding)
    .filter((p) => !filterStatus || p.status === filterStatus)
    .filter((p) => !filterPriority || p.priority === filterPriority)
    .sort((a, b) => {
      if (sortBy === 'priority') {
        const order = { urgent: 0, high: 1, medium: 2, low: 3 }
        return order[a.priority] - order[b.priority]
      }
      if (sortBy === 'status') {
        const order = { in_progress: 0, planning: 1, on_hold: 2, completed: 3 }
        return order[a.status] - order[b.status]
      }
      if (sortBy === 'progress') return b.progress - a.progress
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    })

  const boardProjects = STATUSES.reduce((acc, s) => {
    acc[s] = projects.filter((p) => p.status === s)
    return acc
  }, {} as Record<string, Project[]>)

  const budgetUsedPct =
    stats.totalBudget > 0 ? Math.round((stats.totalSpent / stats.totalBudget) * 100) : null

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-[#1a1a2e] dark:text-slate-100">Proyectos</h1>
          <p className="text-sm text-[#94a3b8] dark:text-slate-500 mt-0.5">
            {stats.total} proyecto{stats.total !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => { setCreateKey((k) => k + 1); setShowCreate(true) }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-500 transition-colors"
        >
          <Plus size={14} />
          Nuevo proyecto
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Activos', value: String(stats.active) },
          { label: 'Presupuesto Total', value: stats.totalBudget > 0 ? fmt(stats.totalBudget) : '—' },
          {
            label: 'Monto Gastado',
            value: stats.totalSpent > 0 ? fmt(stats.totalSpent) : '—',
            sub: budgetUsedPct !== null ? `${budgetUsedPct}% del presupuesto` : undefined,
          },
          { label: 'Progreso Prom.', value: `${stats.avgProgress}%` },
        ].map(({ label, value, sub }) => (
          <div key={label} className="bg-white dark:bg-[#1e2130] border border-[#e8edf0] dark:border-[#2d3148] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-4">
            <p className="text-xs font-medium text-[#94a3b8] dark:text-slate-500 uppercase tracking-wide mb-2">{label}</p>
            <p className="text-xl font-semibold text-[#1a1a2e] dark:text-slate-100 tabular-nums">{value}</p>
            {sub && <p className="text-xs text-[#94a3b8] dark:text-slate-500 mt-1">{sub}</p>}
          </div>
        ))}
      </div>

      {/* View toggle + filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex items-center bg-zinc-100 dark:bg-white/10 rounded-md p-0.5">
          {([['board', 'Tablero'], ['list', 'Lista']] as const).map(([v, label]) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                view === v ? 'bg-white dark:bg-[#1e2130] text-zinc-900 dark:text-slate-100 shadow-sm' : 'text-zinc-500 dark:text-slate-400 hover:text-zinc-700 dark:hover:text-slate-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <select
          value={filterBuilding}
          onChange={(e) => setFilterBuilding(e.target.value)}
          className="text-xs border border-[#e8edf0] dark:border-[#2d3148] rounded-md px-2.5 py-1.5 text-zinc-600 dark:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:focus:ring-emerald-500 bg-white dark:bg-[#252836]"
        >
          <option value="">Todos los edificios</option>
          {buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="text-xs border border-[#e8edf0] dark:border-[#2d3148] rounded-md px-2.5 py-1.5 text-zinc-600 dark:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:focus:ring-emerald-500 bg-white dark:bg-[#252836]"
        >
          <option value="">Todos los estados</option>
          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>

        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="text-xs border border-[#e8edf0] dark:border-[#2d3148] rounded-md px-2.5 py-1.5 text-zinc-600 dark:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:focus:ring-emerald-500 bg-white dark:bg-[#252836]"
        >
          <option value="">Todas las prioridades</option>
          {PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
        </select>

        {view === 'list' && (
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs border border-[#e8edf0] dark:border-[#2d3148] rounded-md px-2.5 py-1.5 text-zinc-600 dark:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:focus:ring-emerald-500 bg-white dark:bg-[#252836] ml-auto"
          >
            <option value="updated_at">Ordenar: Reciente</option>
            <option value="priority">Ordenar: Prioridad</option>
            <option value="status">Ordenar: Estado</option>
            <option value="progress">Ordenar: Progreso</option>
          </select>
        )}
      </div>

      {/* Board view */}
      {view === 'board' && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STATUSES.map((s) => (
            <StatusColumn
              key={s}
              status={s}
              projects={boardProjects[s] ?? []}
              onSelect={(p) => setSelectedProject(p)}
            />
          ))}
        </div>
      )}

      {/* List view */}
      {view === 'list' && (
        <div>
          {/* Mobile cards */}
          {filtered.length > 0 && (
            <div className="md:hidden space-y-2 mb-4">
              {filtered.map((p) => (
                <div key={p.id} className="bg-white dark:bg-[#1e2130] border border-[#e8edf0] dark:border-[#2d3148] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <button
                        onClick={() => setSelectedProject(p)}
                        className="text-sm font-medium text-[#1a1a2e] dark:text-slate-100 text-left line-clamp-2"
                      >
                        {p.title}
                      </button>
                      {p.building && (
                        <p className="text-xs text-[#94a3b8] dark:text-slate-500 mt-0.5">
                          {p.building.name}{p.unit ? ` · U${p.unit.unit_number}` : ''}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${statusBadge[p.status]}`}>
                          {STATUS_LABELS[p.status]}
                        </span>
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${priorityBadge[p.priority]}`}>
                          {PRIORITY_LABELS[p.priority]}
                        </span>
                        <span className="text-xs text-[#94a3b8] dark:text-slate-500">{p.progress}%</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        onClick={() => { setEditKey((k) => k + 1); setEditingProject(p) }}
                        className="p-2.5 text-zinc-400 dark:text-slate-500 hover:text-zinc-700 dark:hover:text-slate-100 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-md transition-colors"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={async () => {
                          if (!confirm('¿Eliminar este proyecto y todas sus notas?')) return
                          await deleteProject(p.id)
                        }}
                        className="p-2.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* Desktop table */}
          <div className="hidden md:block bg-white dark:bg-[#1e2130] border border-[#e8edf0] dark:border-[#2d3148] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <HardHat size={28} className="mx-auto text-zinc-200 dark:text-slate-700 mb-3" />
              <p className="text-sm text-[#94a3b8] dark:text-slate-500">Ningún proyecto coincide con los filtros</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#f0f4f0] dark:border-[#2d3148]">
                  <th className="text-left text-[11px] font-medium text-[#94a3b8] dark:text-slate-500 uppercase tracking-wide px-4 py-3">Proyecto</th>
                  <th className="text-left text-[11px] font-medium text-[#94a3b8] dark:text-slate-500 uppercase tracking-wide px-4 py-3">Estado</th>
                  <th className="text-left text-[11px] font-medium text-[#94a3b8] dark:text-slate-500 uppercase tracking-wide px-4 py-3">Prioridad</th>
                  <th className="text-left text-[11px] font-medium text-[#94a3b8] dark:text-slate-500 uppercase tracking-wide px-4 py-3 w-32">Progreso</th>
                  <th className="text-left text-[11px] font-medium text-[#94a3b8] dark:text-slate-500 uppercase tracking-wide px-4 py-3">Presupuesto</th>
                  <th className="text-left text-[11px] font-medium text-[#94a3b8] dark:text-slate-500 uppercase tracking-wide px-4 py-3">Fin Est.</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f8fafc] dark:divide-[#252836]">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-[#fafbfc] dark:hover:bg-[#252836] transition-colors">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedProject(p)}
                        className="text-sm font-medium text-[#1a1a2e] dark:text-slate-100 hover:text-zinc-600 dark:hover:text-slate-300 text-left line-clamp-1"
                      >
                        {p.title}
                      </button>
                      {p.building && (
                        <p className="text-xs text-[#94a3b8] dark:text-slate-500 mt-0.5">
                          {p.building.name}{p.unit ? ` · U${p.unit.unit_number}` : ''}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusSelect project={p} />
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityBadge[p.priority]}`}>
                        {PRIORITY_LABELS[p.priority]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <ProgressBar value={p.progress} />
                        <span className="text-xs text-[#94a3b8] dark:text-slate-500 tabular-nums w-8 text-right">{p.progress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#64748b] dark:text-slate-400 tabular-nums">
                      {p.budget ? fmt(Number(p.budget)) : <span className="text-zinc-300 dark:text-slate-600">—</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#64748b] dark:text-slate-400 tabular-nums">
                      {p.estimated_end_date ?? <span className="text-zinc-300 dark:text-slate-600">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedProject(p)}
                          className="p-1.5 text-zinc-400 dark:text-slate-500 hover:text-zinc-700 dark:hover:text-slate-100 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-md transition-colors"
                          title="Ver detalles"
                        >
                          <MessageSquarePlus size={14} />
                        </button>
                        <button
                          onClick={() => { setEditKey((k) => k + 1); setEditingProject(p) }}
                          className="p-1.5 text-zinc-400 dark:text-slate-500 hover:text-zinc-700 dark:hover:text-slate-100 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-md transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={async () => {
                            if (!confirm('¿Eliminar este proyecto y todas sus notas?')) return
                            await deleteProject(p.id)
                          }}
                          className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {projects.length === 0 && (
        <div className="py-24 text-center">
          <HardHat size={32} className="mx-auto text-zinc-200 dark:text-slate-700 mb-4" />
          <p className="text-sm font-medium text-zinc-600 dark:text-slate-400 mb-1">Sin proyectos aún</p>
          <p className="text-xs text-[#94a3b8] dark:text-slate-500">Crea tu primer proyecto de construcción o renovación</p>
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <Modal key={createKey} open title="Nuevo Proyecto" onClose={() => setShowCreate(false)}>
          <ProjectForm
            buildings={buildings}
            units={units}
            action={async (prev, fd) => {
              const result = await createProject(prev, fd)
              if (result?.success) setShowCreate(false)
              return result
            }}
          />
        </Modal>
      )}

      {/* Edit modal */}
      {editingProject && (
        <Modal key={editKey} open title="Editar Proyecto" onClose={() => setEditingProject(null)}>
          <ProjectForm
            project={editingProject}
            buildings={buildings}
            units={units}
            action={async (prev, fd) => {
              const result = await updateProject(editingProject.id, prev, fd)
              if (result?.success) setEditingProject(null)
              return result
            }}
          />
        </Modal>
      )}

      {/* Detail drawer */}
      {detailProject && (
        <ProjectDetail
          key={detailProject.id}
          project={detailProject}
          buildings={buildings}
          units={units}
          onClose={() => setSelectedProject(null)}
          onEdit={() => {
            setEditKey((k) => k + 1)
            setEditingProject(detailProject)
            setSelectedProject(null)
          }}
        />
      )}
    </div>
  )
}

// ── Inline status select ──────────────────────────────────
function StatusSelect({ project }: { project: Project }) {
  const [isPending, startTransition] = useTransition()

  return (
    <select
      defaultValue={project.status}
      disabled={isPending}
      onChange={(e) => {
        startTransition(async () => {
          await updateProjectStatus(project.id, e.target.value)
        })
      }}
      className={`text-xs px-2 py-1 rounded-full font-medium border-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:focus:ring-emerald-500 disabled:opacity-60 ${statusBadge[project.status]}`}
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>{STATUS_LABELS[s]}</option>
      ))}
    </select>
  )
}
