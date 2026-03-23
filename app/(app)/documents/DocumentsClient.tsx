'use client'

import { useActionState, useState } from 'react'
import {
  Plus, Pencil, Trash2, Download, ExternalLink,
  FileText, FileImage, File, Receipt, ClipboardCheck,
  FolderOpen,
} from 'lucide-react'
import Modal from '@/components/Modal'
import SubmitButton from '@/components/SubmitButton'
import { createDocument, updateDocument, deleteDocument } from '@/app/actions/documents'
import type { Document, DocumentCategory, Building, Tenant, ActionState } from '@/types'

// ── Styles ────────────────────────────────────────────────
const input =
  'w-full border border-[#e8edf0] dark:border-[#2d3148] rounded-md px-3 py-2 text-sm text-zinc-900 dark:text-slate-100 placeholder:text-zinc-400 dark:placeholder:text-slate-500 bg-white dark:bg-[#252836] focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:focus:ring-emerald-500 focus:border-emerald-500 dark:focus:border-emerald-500 transition-colors'
const selectCls =
  'w-full border border-[#e8edf0] dark:border-[#2d3148] rounded-md px-3 py-2 text-sm text-zinc-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:focus:ring-emerald-500 focus:border-emerald-500 dark:focus:border-emerald-500 transition-colors bg-white dark:bg-[#252836]'
const lbl = 'block text-xs font-medium text-zinc-600 dark:text-slate-400 mb-1.5'

const CATEGORIES: DocumentCategory[] = [
  'contract', 'lease', 'photo', 'invoice', 'inspection', 'other',
]

const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  contract:   'Contrato',
  lease:      'Arrendamiento',
  photo:      'Foto',
  invoice:    'Factura',
  inspection: 'Inspección',
  other:      'Otro',
}

const CATEGORY_COLORS: Record<DocumentCategory, string> = {
  contract:   'bg-violet-50 text-violet-700 border border-violet-100 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20',
  lease:      'bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
  photo:      'bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
  invoice:    'bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
  inspection: 'bg-orange-50 text-orange-700 border border-orange-100 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20',
  other:      'bg-zinc-100 text-zinc-600 dark:bg-white/5 dark:text-slate-400',
}

// Detect file type from URL or explicit file_type
function detectFileType(doc: Document): 'pdf' | 'image' | 'doc' | 'other' {
  const src = (doc.file_type ?? doc.file_url ?? '').toLowerCase()
  if (src.includes('pdf')) return 'pdf'
  if (src.match(/jpe?g|png|gif|webp|svg|image/)) return 'image'
  if (src.match(/doc|docx|word|text|txt/)) return 'doc'
  return 'other'
}

function FileIcon({ doc, size = 20 }: { doc: Document; size?: number }) {
  const type = detectFileType(doc)
  const cls = 'shrink-0'
  if (type === 'pdf')   return <FileText size={size} className={`${cls} text-red-400`} />
  if (type === 'image') return <FileImage size={size} className={`${cls} text-emerald-500`} />
  if (type === 'doc')   return <FileText size={size} className={`${cls} text-blue-400`} />
  return <File size={size} className={`${cls} text-zinc-400 dark:text-slate-500`} />
}

function formatSize(bytes: number | null): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatTotalSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

// ── Document form ─────────────────────────────────────────
function DocumentForm({
  doc,
  buildings,
  units,
  tenants,
  action,
}: {
  doc?: Document
  buildings: Building[]
  units: any[]
  tenants: Tenant[]
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>
}) {
  const [state, formAction] = useActionState(action, null)
  const [selectedBuilding, setSelectedBuilding] = useState(doc?.building_id ?? '')
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

      {/* Name */}
      <div>
        <label className={lbl}>Nombre del Documento</label>
        <input
          name="name"
          required
          defaultValue={doc?.name}
          placeholder="ej. Contrato de Arrendamiento - Unidad 4B"
          className={input}
        />
      </div>

      {/* Category */}
      <div>
        <label className={lbl}>Categoría</label>
        <select name="category" required defaultValue={doc?.category ?? 'other'} className={selectCls}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
          ))}
        </select>
      </div>

      {/* File URL */}
      <div>
        <label className={lbl}>URL del Archivo</label>
        <input
          name="file_url"
          required
          defaultValue={doc?.file_url}
          placeholder="https://drive.google.com/… o enlace de Dropbox"
          className={input}
        />
        <p className="text-xs text-[#94a3b8] dark:text-slate-500 mt-1">
          Pega un enlace de Google Drive, Dropbox u otro enlace directo.
        </p>
      </div>

      {/* File type + size */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={lbl}>Tipo de Archivo</label>
          <input
            name="file_type"
            defaultValue={doc?.file_type ?? ''}
            placeholder="pdf, jpg, docx…"
            className={input}
          />
        </div>
        <div>
          <label className={lbl}>Tamaño del Archivo (bytes)</label>
          <input
            name="file_size"
            type="number"
            min="0"
            defaultValue={doc?.file_size ?? ''}
            placeholder="Opcional"
            className={input}
          />
        </div>
      </div>

      {/* Building + Unit */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={lbl}>Edificio</label>
          <select
            name="building_id"
            defaultValue={doc?.building_id ?? ''}
            className={selectCls}
            onChange={(e) => setSelectedBuilding(e.target.value)}
          >
            <option value="">Ninguno</option>
            {buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div>
          <label className={lbl}>Unidad (opcional)</label>
          <select name="unit_id" defaultValue={doc?.unit_id ?? ''} className={selectCls}>
            <option value="">Ninguna</option>
            {filteredUnits.map((u: any) => (
              <option key={u.id} value={u.id}>Unidad {u.unit_number}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tenant */}
      <div>
        <label className={lbl}>Inquilino (opcional)</label>
        <select name="tenant_id" defaultValue={doc?.tenant_id ?? ''} className={selectCls}>
          <option value="">Ninguno</option>
          {tenants.map((t) => (
            <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
          ))}
        </select>
      </div>

      {/* Description */}
      <div>
        <label className={lbl}>Notas / Descripción</label>
        <textarea
          name="description"
          rows={2}
          defaultValue={doc?.description ?? ''}
          placeholder="Notas opcionales…"
          className={`${input} resize-none`}
        />
      </div>

      <SubmitButton label={doc ? 'Guardar cambios' : 'Añadir documento'} />
    </form>
  )
}

// ── Document card ─────────────────────────────────────────
function DocumentCard({
  doc,
  onEdit,
  onDelete,
}: {
  doc: Document
  onEdit: () => void
  onDelete: () => void
}) {
  const isImage = detectFileType(doc) === 'image'

  return (
    <div className="bg-white dark:bg-[#1e2130] border border-[#e8edf0] dark:border-[#2d3148] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-4 hover:border-zinc-300 dark:hover:border-[#3d4268] hover:shadow-sm transition-all group flex flex-col gap-3">
      {/* Top row */}
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 bg-zinc-50 dark:bg-[#141520] border border-[#f0f4f0] dark:border-[#2d3148] rounded-xl flex items-center justify-center shrink-0">
          <FileIcon doc={doc} size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#1a1a2e] dark:text-slate-100 truncate leading-snug">{doc.name}</p>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${CATEGORY_COLORS[doc.category]}`}>
              {CATEGORY_LABELS[doc.category]}
            </span>
            {doc.file_type && (
              <span className="text-xs text-[#94a3b8] dark:text-slate-500 uppercase">{doc.file_type}</span>
            )}
          </div>
        </div>
      </div>

      {/* Association */}
      {(doc.building || doc.unit || doc.tenant) && (
        <div className="flex flex-wrap gap-1.5">
          {doc.building && (
            <span className="text-xs bg-zinc-50 dark:bg-[#141520] border border-[#f0f4f0] dark:border-[#2d3148] text-zinc-600 dark:text-slate-400 px-2 py-0.5 rounded-md">
              {doc.building.name}
            </span>
          )}
          {doc.unit && (
            <span className="text-xs bg-zinc-50 dark:bg-[#141520] border border-[#f0f4f0] dark:border-[#2d3148] text-zinc-600 dark:text-slate-400 px-2 py-0.5 rounded-md">
              Unidad {doc.unit.unit_number}
            </span>
          )}
          {doc.tenant && (
            <span className="text-xs bg-zinc-50 dark:bg-[#141520] border border-[#f0f4f0] dark:border-[#2d3148] text-zinc-600 dark:text-slate-400 px-2 py-0.5 rounded-md">
              {doc.tenant.first_name} {doc.tenant.last_name}
            </span>
          )}
        </div>
      )}

      {/* Description */}
      {doc.description && (
        <p className="text-xs text-[#64748b] dark:text-slate-400 leading-relaxed line-clamp-2">{doc.description}</p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-1 border-t border-[#f8fafc] dark:border-[#252836]">
        <div className="flex items-center gap-2 text-xs text-[#94a3b8] dark:text-slate-500">
          <span className="tabular-nums">
            {new Date(doc.created_at).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric',
            })}
          </span>
          {doc.file_size && (
            <>
              <span className="text-zinc-200 dark:text-slate-700">·</span>
              <span>{formatSize(doc.file_size)}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          <a
            href={doc.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-zinc-400 dark:text-slate-500 hover:text-zinc-700 dark:hover:text-slate-100 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-md transition-colors"
            title="Abrir archivo"
          >
            <ExternalLink size={13} />
          </a>
          <button
            onClick={onEdit}
            className="p-1.5 text-zinc-400 dark:text-slate-500 hover:text-zinc-700 dark:hover:text-slate-100 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-md transition-colors"
            title="Editar"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
            title="Eliminar"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────
export default function DocumentsClient({
  documents,
  buildings,
  units,
  tenants,
  totalSize,
}: {
  documents: Document[]
  buildings: Building[]
  units: any[]
  tenants: Tenant[]
  totalSize: number
}) {
  const [showCreate, setShowCreate] = useState(false)
  const [createKey, setCreateKey] = useState(0)
  const [editingDoc, setEditingDoc] = useState<Document | null>(null)
  const [editKey, setEditKey] = useState(0)

  // Filters
  const [filterCategory, setFilterCategory] = useState<DocumentCategory | 'all'>('all')
  const [filterBuilding, setFilterBuilding] = useState('')
  const [filterUnit, setFilterUnit] = useState('')
  const [search, setSearch] = useState('')

  const filteredUnitsForFilter = filterBuilding
    ? units.filter((u: any) => u.building_id === filterBuilding)
    : units

  const filtered = documents
    .filter((d) => filterCategory === 'all' || d.category === filterCategory)
    .filter((d) => !filterBuilding || d.building_id === filterBuilding)
    .filter((d) => !filterUnit || d.unit_id === filterUnit)
    .filter((d) =>
      !search ||
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.description?.toLowerCase().includes(search.toLowerCase())
    )

  // Counts by category
  const counts = CATEGORIES.reduce((acc, c) => {
    acc[c] = documents.filter((d) => d.category === c).length
    return acc
  }, {} as Record<DocumentCategory, number>)

  // Recent uploads (last 5)
  const recent = documents.slice(0, 5)

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-[#1a1a2e] dark:text-slate-100">Documentos</h1>
          <p className="text-sm text-[#94a3b8] dark:text-slate-500 mt-0.5">
            {documents.length} documento{documents.length !== 1 ? 's' : ''}
            {totalSize > 0 && <> · {formatTotalSize(totalSize)} almacenado{totalSize !== 1 ? 's' : ''}</>}
          </p>
        </div>
        <button
          onClick={() => { setCreateKey((k) => k + 1); setShowCreate(true) }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-500 transition-colors"
        >
          <Plus size={14} />
          Añadir documento
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-[#1e2130] border border-[#e8edf0] dark:border-[#2d3148] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-4">
          <p className="text-xs font-medium text-[#94a3b8] dark:text-slate-500 uppercase tracking-wide mb-2">Total Documentos</p>
          <p className="text-2xl font-semibold text-[#1a1a2e] dark:text-slate-100">{documents.length}</p>
        </div>
        <div className="bg-white dark:bg-[#1e2130] border border-[#e8edf0] dark:border-[#2d3148] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-4">
          <p className="text-xs font-medium text-[#94a3b8] dark:text-slate-500 uppercase tracking-wide mb-2">Almacenamiento Registrado</p>
          <p className="text-2xl font-semibold text-[#1a1a2e] dark:text-slate-100">{totalSize > 0 ? formatTotalSize(totalSize) : '—'}</p>
          <p className="text-xs text-[#94a3b8] dark:text-slate-500 mt-1">basado en tamaños de archivos registrados</p>
        </div>
        <div className="bg-white dark:bg-[#1e2130] border border-[#e8edf0] dark:border-[#2d3148] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-4">
          <p className="text-xs font-medium text-[#94a3b8] dark:text-slate-500 uppercase tracking-wide mb-3">Por Categoría</p>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {CATEGORIES.filter((c) => counts[c] > 0).map((c) => (
              <div key={c} className="flex items-center gap-1 text-xs text-zinc-600 dark:text-slate-400">
                <span className={`w-1.5 h-1.5 rounded-full inline-block ${
                  c === 'contract'   ? 'bg-violet-400' :
                  c === 'lease'      ? 'bg-blue-400' :
                  c === 'photo'      ? 'bg-emerald-400' :
                  c === 'invoice'    ? 'bg-amber-400' :
                  c === 'inspection' ? 'bg-orange-400' :
                  'bg-zinc-400'
                }`} />
                {CATEGORY_LABELS[c]} <span className="text-[#94a3b8] dark:text-slate-500">{counts[c]}</span>
              </div>
            ))}
            {documents.length === 0 && <span className="text-[#94a3b8] dark:text-slate-500 text-xs">Sin documentos aún</span>}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        {/* Search */}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar documentos…"
          className="text-sm border border-[#e8edf0] dark:border-[#2d3148] rounded-md px-3 py-1.5 text-zinc-700 dark:text-slate-300 placeholder:text-zinc-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:focus:ring-emerald-500 bg-white dark:bg-[#252836] w-52"
        />

        {/* Category pills */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
              filterCategory === 'all' ? 'bg-emerald-600 text-white' : 'text-zinc-600 dark:text-slate-400 hover:bg-zinc-100 dark:hover:bg-white/5'
            }`}
          >
            Todos
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setFilterCategory(filterCategory === c ? 'all' : c)}
              className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
                filterCategory === c ? 'bg-emerald-600 text-white' : 'text-zinc-600 dark:text-slate-400 hover:bg-zinc-100 dark:hover:bg-white/5'
              }`}
            >
              {CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>

        {/* Building filter */}
        <select
          value={filterBuilding}
          onChange={(e) => { setFilterBuilding(e.target.value); setFilterUnit('') }}
          className="text-xs border border-[#e8edf0] dark:border-[#2d3148] rounded-md px-2.5 py-1.5 text-zinc-600 dark:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:focus:ring-emerald-500 bg-white dark:bg-[#252836] ml-auto"
        >
          <option value="">Todos los edificios</option>
          {buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>

        {/* Unit filter */}
        <select
          value={filterUnit}
          onChange={(e) => setFilterUnit(e.target.value)}
          className="text-xs border border-[#e8edf0] dark:border-[#2d3148] rounded-md px-2.5 py-1.5 text-zinc-600 dark:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:focus:ring-emerald-500 bg-white dark:bg-[#252836]"
        >
          <option value="">Todas las unidades</option>
          {filteredUnitsForFilter.map((u: any) => (
            <option key={u.id} value={u.id}>Unit {u.unit_number}</option>
          ))}
        </select>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="py-24 text-center">
          <FolderOpen size={32} className="mx-auto text-zinc-200 dark:text-slate-700 mb-4" />
          {documents.length === 0 ? (
            <>
              <p className="text-sm font-medium text-zinc-600 dark:text-slate-400 mb-1">Sin documentos aún</p>
              <p className="text-xs text-[#94a3b8] dark:text-slate-500">Añade enlaces de Google Drive, Dropbox u otros archivos</p>
            </>
          ) : (
            <p className="text-sm text-[#94a3b8] dark:text-slate-500">Ningún documento coincide con los filtros</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((doc) => (
            <DocumentCard
              key={doc.id}
              doc={doc}
              onEdit={() => { setEditKey((k) => k + 1); setEditingDoc(doc) }}
              onDelete={async () => {
                if (!confirm(`¿Eliminar "${doc.name}"?`)) return
                await deleteDocument(doc.id)
              }}
            />
          ))}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <Modal key={createKey} open title="Añadir Documento" onClose={() => setShowCreate(false)}>
          <DocumentForm
            buildings={buildings}
            units={units}
            tenants={tenants}
            action={async (prev, fd) => {
              const result = await createDocument(prev, fd)
              if (result?.success) setShowCreate(false)
              return result
            }}
          />
        </Modal>
      )}

      {/* Edit modal */}
      {editingDoc && (
        <Modal key={editKey} open title="Editar Documento" onClose={() => setEditingDoc(null)}>
          <DocumentForm
            doc={editingDoc}
            buildings={buildings}
            units={units}
            tenants={tenants}
            action={async (prev, fd) => {
              const result = await updateDocument(editingDoc.id, prev, fd)
              if (result?.success) setEditingDoc(null)
              return result
            }}
          />
        </Modal>
      )}
    </div>
  )
}
