import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { FileText, Download, FolderOpen } from 'lucide-react'

const categoryLabel: Record<string, string> = {
  contract: 'Contrato',
  lease: 'Arrendamiento',
  photo: 'Foto',
  invoice: 'Factura',
  inspection: 'Inspección',
  other: 'Otro',
}

export default async function PortalDocumentosPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('user_id', user!.id)
    .single()

  const { data: documents } = tenant
    ? await supabase
        .from('documents')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('shared_with_tenant', true)
        .order('created_at', { ascending: false })
    : { data: [] }

  const fmtSize = (bytes: number | null) => {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-[#1a1a2e] dark:text-white">Documentos</h1>
        <p className="text-sm text-[#64748b] dark:text-slate-400 mt-0.5">
          Documentos compartidos por tu propietario
        </p>
      </div>

      {!documents || documents.length === 0 ? (
        <div className="bg-white dark:bg-[#1e2130] rounded-2xl border border-[#e8edf0] dark:border-[#2d3148] p-10 text-center">
          <div className="w-10 h-10 bg-[#f0f4f0] dark:bg-white/5 rounded-xl flex items-center justify-center mx-auto mb-3">
            <FolderOpen size={18} className="text-[#94a3b8] dark:text-slate-500" />
          </div>
          <p className="text-sm text-[#64748b] dark:text-slate-400">No hay documentos disponibles</p>
          <p className="text-xs text-[#94a3b8] dark:text-slate-500 mt-1">
            Tu propietario aún no ha compartido documentos contigo
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="bg-white dark:bg-[#1e2130] rounded-2xl border border-[#e8edf0] dark:border-[#2d3148] p-4 flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center shrink-0">
                <FileText size={18} className="text-emerald-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[#1a1a2e] dark:text-white truncate">{doc.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-[#94a3b8] dark:text-slate-500">
                    {categoryLabel[doc.category] ?? doc.category}
                  </span>
                  {doc.file_size && (
                    <>
                      <span className="text-[#e8edf0] dark:text-[#2d3148]">·</span>
                      <span className="text-xs text-[#94a3b8] dark:text-slate-500">{fmtSize(doc.file_size)}</span>
                    </>
                  )}
                  <span className="text-[#e8edf0] dark:text-[#2d3148]">·</span>
                  <span className="text-xs text-[#94a3b8] dark:text-slate-500">
                    {new Date(doc.created_at).toLocaleDateString('es-PR', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                {doc.description && (
                  <p className="text-xs text-[#64748b] dark:text-slate-400 mt-0.5 truncate">{doc.description}</p>
                )}
              </div>
              <a
                href={doc.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#64748b] dark:text-slate-400 hover:bg-[#f0f4f0] dark:hover:bg-white/5 transition-colors shrink-0"
              >
                <Download size={15} />
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
