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
  'w-full border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 transition-colors'
const selectCls =
  'w-full border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 transition-colors bg-white'
const lbl = 'block text-xs font-medium text-zinc-600 mb-1.5'

const CATEGORIES: DocumentCategory[] = [
  'contract', 'lease', 'photo', 'invoice', 'inspection', 'other',
]

const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  contract:   'Contract',
  lease:      'Lease',
  photo:      'Photo',
  invoice:    'Invoice',
  inspection: 'Inspection',
  other:      'Other',
}

const CATEGORY_COLORS: Record<DocumentCategory, string> = {
  contract:   'bg-violet-50 text-violet-700 border border-violet-100',
  lease:      'bg-blue-50 text-blue-700 border border-blue-100',
  photo:      'bg-emerald-50 text-emerald-700 border border-emerald-100',
  invoice:    'bg-amber-50 text-amber-700 border border-amber-100',
  inspection: 'bg-orange-50 text-orange-700 border border-orange-100',
  other:      'bg-zinc-100 text-zinc-600',
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
  return <File size={size} className={`${cls} text-zinc-400`} />
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
        <p className="text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-md">
          {state.error}
        </p>
      )}

      {/* Name */}
      <div>
        <label className={lbl}>Document Name</label>
        <input
          name="name"
          required
          defaultValue={doc?.name}
          placeholder="e.g. Lease Agreement - Unit 4B"
          className={input}
        />
      </div>

      {/* Category */}
      <div>
        <label className={lbl}>Category</label>
        <select name="category" required defaultValue={doc?.category ?? 'other'} className={selectCls}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
          ))}
        </select>
      </div>

      {/* File URL */}
      <div>
        <label className={lbl}>File URL</label>
        <input
          name="file_url"
          required
          defaultValue={doc?.file_url}
          placeholder="https://drive.google.com/… or Dropbox link"
          className={input}
        />
        <p className="text-xs text-zinc-400 mt-1">
          Paste a Google Drive, Dropbox, or any direct link.
        </p>
      </div>

      {/* File type + size */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={lbl}>File Type</label>
          <input
            name="file_type"
            defaultValue={doc?.file_type ?? ''}
            placeholder="pdf, jpg, docx…"
            className={input}
          />
        </div>
        <div>
          <label className={lbl}>File Size (bytes)</label>
          <input
            name="file_size"
            type="number"
            min="0"
            defaultValue={doc?.file_size ?? ''}
            placeholder="Optional"
            className={input}
          />
        </div>
      </div>

      {/* Building + Unit */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={lbl}>Building</label>
          <select
            name="building_id"
            defaultValue={doc?.building_id ?? ''}
            className={selectCls}
            onChange={(e) => setSelectedBuilding(e.target.value)}
          >
            <option value="">None</option>
            {buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div>
          <label className={lbl}>Unit (optional)</label>
          <select name="unit_id" defaultValue={doc?.unit_id ?? ''} className={selectCls}>
            <option value="">None</option>
            {filteredUnits.map((u: any) => (
              <option key={u.id} value={u.id}>Unit {u.unit_number}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tenant */}
      <div>
        <label className={lbl}>Tenant (optional)</label>
        <select name="tenant_id" defaultValue={doc?.tenant_id ?? ''} className={selectCls}>
          <option value="">None</option>
          {tenants.map((t) => (
            <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
          ))}
        </select>
      </div>

      {/* Description */}
      <div>
        <label className={lbl}>Notes / Description</label>
        <textarea
          name="description"
          rows={2}
          defaultValue={doc?.description ?? ''}
          placeholder="Optional notes…"
          className={`${input} resize-none`}
        />
      </div>

      <SubmitButton label={doc ? 'Save changes' : 'Add document'} />
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
    <div className="bg-white border border-zinc-200 rounded-lg p-4 hover:border-zinc-300 hover:shadow-sm transition-all group flex flex-col gap-3">
      {/* Top row */}
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 bg-zinc-50 border border-zinc-100 rounded-lg flex items-center justify-center shrink-0">
          <FileIcon doc={doc} size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-zinc-900 truncate leading-snug">{doc.name}</p>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${CATEGORY_COLORS[doc.category]}`}>
              {CATEGORY_LABELS[doc.category]}
            </span>
            {doc.file_type && (
              <span className="text-xs text-zinc-400 uppercase">{doc.file_type}</span>
            )}
          </div>
        </div>
      </div>

      {/* Association */}
      {(doc.building || doc.unit || doc.tenant) && (
        <div className="flex flex-wrap gap-1.5">
          {doc.building && (
            <span className="text-xs bg-zinc-50 border border-zinc-100 text-zinc-600 px-2 py-0.5 rounded-md">
              {doc.building.name}
            </span>
          )}
          {doc.unit && (
            <span className="text-xs bg-zinc-50 border border-zinc-100 text-zinc-600 px-2 py-0.5 rounded-md">
              Unit {doc.unit.unit_number}
            </span>
          )}
          {doc.tenant && (
            <span className="text-xs bg-zinc-50 border border-zinc-100 text-zinc-600 px-2 py-0.5 rounded-md">
              {doc.tenant.first_name} {doc.tenant.last_name}
            </span>
          )}
        </div>
      )}

      {/* Description */}
      {doc.description && (
        <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2">{doc.description}</p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-1 border-t border-zinc-50">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span className="tabular-nums">
            {new Date(doc.created_at).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric',
            })}
          </span>
          {doc.file_size && (
            <>
              <span className="text-zinc-200">·</span>
              <span>{formatSize(doc.file_size)}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          <a
            href={doc.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-md transition-colors"
            title="Open file"
          >
            <ExternalLink size={13} />
          </a>
          <button
            onClick={onEdit}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-md transition-colors"
            title="Edit"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
            title="Delete"
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
          <h1 className="text-xl font-semibold text-zinc-900">Documents</h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            {documents.length} document{documents.length !== 1 ? 's' : ''}
            {totalSize > 0 && <> · {formatTotalSize(totalSize)} stored</>}
          </p>
        </div>
        <button
          onClick={() => { setCreateKey((k) => k + 1); setShowCreate(true) }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 text-white text-sm font-medium rounded-md hover:bg-zinc-700 transition-colors"
        >
          <Plus size={14} />
          Add document
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-zinc-200 rounded-lg p-4">
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-2">Total Documents</p>
          <p className="text-2xl font-semibold text-zinc-900">{documents.length}</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-lg p-4">
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-2">Storage Tracked</p>
          <p className="text-2xl font-semibold text-zinc-900">{totalSize > 0 ? formatTotalSize(totalSize) : '—'}</p>
          <p className="text-xs text-zinc-400 mt-1">based on recorded file sizes</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-lg p-4">
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-3">By Category</p>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {CATEGORIES.filter((c) => counts[c] > 0).map((c) => (
              <div key={c} className="flex items-center gap-1 text-xs text-zinc-600">
                <span className={`w-1.5 h-1.5 rounded-full inline-block ${
                  c === 'contract'   ? 'bg-violet-400' :
                  c === 'lease'      ? 'bg-blue-400' :
                  c === 'photo'      ? 'bg-emerald-400' :
                  c === 'invoice'    ? 'bg-amber-400' :
                  c === 'inspection' ? 'bg-orange-400' :
                  'bg-zinc-400'
                }`} />
                {CATEGORY_LABELS[c]} <span className="text-zinc-400">{counts[c]}</span>
              </div>
            ))}
            {documents.length === 0 && <span className="text-zinc-400 text-xs">No documents yet</span>}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        {/* Search */}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search documents…"
          className="text-sm border border-zinc-200 rounded-md px-3 py-1.5 text-zinc-700 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 w-52"
        />

        {/* Category pills */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              filterCategory === 'all' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            All
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setFilterCategory(filterCategory === c ? 'all' : c)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                filterCategory === c ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'
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
          className="text-xs border border-zinc-200 rounded-md px-2.5 py-1.5 text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-900 bg-white ml-auto"
        >
          <option value="">All buildings</option>
          {buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>

        {/* Unit filter */}
        <select
          value={filterUnit}
          onChange={(e) => setFilterUnit(e.target.value)}
          className="text-xs border border-zinc-200 rounded-md px-2.5 py-1.5 text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-900 bg-white"
        >
          <option value="">All units</option>
          {filteredUnitsForFilter.map((u: any) => (
            <option key={u.id} value={u.id}>Unit {u.unit_number}</option>
          ))}
        </select>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="py-24 text-center">
          <FolderOpen size={32} className="mx-auto text-zinc-200 mb-4" />
          {documents.length === 0 ? (
            <>
              <p className="text-sm font-medium text-zinc-600 mb-1">No documents yet</p>
              <p className="text-xs text-zinc-400">Add Google Drive, Dropbox, or other file links</p>
            </>
          ) : (
            <p className="text-sm text-zinc-400">No documents match your filters</p>
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
                if (!confirm(`Delete "${doc.name}"?`)) return
                await deleteDocument(doc.id)
              }}
            />
          ))}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <Modal key={createKey} open title="Add Document" onClose={() => setShowCreate(false)}>
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
        <Modal key={editKey} open title="Edit Document" onClose={() => setEditingDoc(null)}>
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
