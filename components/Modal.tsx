'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export default function Modal({ open, onClose, title, children }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end md:items-center md:justify-center md:p-4"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose()
      }}
    >
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60" />
      <div className="relative bg-white dark:bg-[#1e2130] rounded-t-2xl md:rounded-2xl border border-[#e8edf0] dark:border-[#2d3148] shadow-xl w-full md:max-w-lg max-h-[92dvh] md:max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#f0f4f0] dark:border-[#2d3148]">
          <h2 className="text-sm font-semibold text-[#1a1a2e] dark:text-slate-100">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#94a3b8] dark:text-slate-500 hover:text-[#1a1a2e] dark:hover:text-slate-200 hover:bg-[#f0f4f0] dark:hover:bg-white/5 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <div className="px-5 py-5">{children}</div>
      </div>
    </div>
  )
}
