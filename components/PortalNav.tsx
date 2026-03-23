'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Building2,
  Home,
  CreditCard,
  Wrench,
  FolderOpen,
  Bell,
  ChevronDown,
  LogOut,
  Sun,
  Moon,
  X,
  Check,
} from 'lucide-react'
import { signOut } from '@/app/actions/auth'
import { markAllRead } from '@/app/actions/notifications'
import type { User } from '@supabase/supabase-js'
import type { Notification } from '@/types'

const nav = [
  { href: '/portal', label: 'Inicio', icon: Home },
  { href: '/portal/pagos', label: 'Pagos', icon: CreditCard },
  { href: '/portal/mantenimiento', label: 'Mantenimiento', icon: Wrench },
  { href: '/portal/documentos', label: 'Documentos', icon: FolderOpen },
]

export default function PortalNav({
  user,
  notifications,
}: {
  user: User | null
  notifications: Notification[]
}) {
  const pathname = usePathname()
  const [isDark, setIsDark] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const bellRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)

  const unread = notifications.filter((n) => !n.read).length
  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : '??'

  useEffect(() => {
    const stored = localStorage.getItem('theme') || 'light'
    setIsDark(stored === 'dark')
  }, [])

  useEffect(() => {
    setBellOpen(false)
    setUserOpen(false)
  }, [pathname])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false)
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const toggleTheme = () => {
    const next = isDark ? 'light' : 'dark'
    setIsDark(!isDark)
    localStorage.setItem('theme', next)
    document.documentElement.classList.toggle('dark', next === 'dark')
  }

  const isActive = (href: string) =>
    href === '/portal' ? pathname === href : pathname.startsWith(href)

  const handleBellOpen = async () => {
    setBellOpen(!bellOpen)
    if (!bellOpen && unread > 0) {
      await markAllRead()
    }
  }

  return (
    <>
      {/* Top header */}
      <header className="sticky top-0 z-40 h-16 bg-white dark:bg-[#1e2130] border-b border-[#e8edf0] dark:border-[#2d3148] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="max-w-2xl mx-auto px-4 flex items-center justify-between h-full gap-4">
          {/* Logo */}
          <Link href="/portal" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Building2 size={16} className="text-white" />
            </div>
            <span className="font-bold text-[15px] text-[#1a1a2e] dark:text-white tracking-tight hidden sm:block">
              Portal de Inquilino
            </span>
          </Link>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Bell */}
            <div className="relative" ref={bellRef}>
              <button
                onClick={handleBellOpen}
                className="relative w-8 h-8 rounded-full flex items-center justify-center text-[#64748b] dark:text-slate-400 hover:bg-[#f0f4f0] dark:hover:bg-white/5 transition-colors"
              >
                <Bell size={16} />
                {unread > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>
              {bellOpen && (
                <div className="absolute right-0 top-full mt-2 bg-white dark:bg-[#1e2130] border border-[#e8edf0] dark:border-[#2d3148] rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.1)] w-80 z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[#f0f4f0] dark:border-[#2d3148]">
                    <span className="text-sm font-semibold text-[#1a1a2e] dark:text-white">Notificaciones</span>
                    <button onClick={() => setBellOpen(false)} className="text-[#94a3b8] hover:text-[#64748b]">
                      <X size={14} />
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-[#94a3b8] dark:text-slate-500">
                        Sin notificaciones
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`px-4 py-3 border-b border-[#f0f4f0] dark:border-[#2d3148] last:border-0 ${
                            !n.read ? 'bg-emerald-50/50 dark:bg-emerald-500/5' : ''
                          }`}
                        >
                          <p className="text-sm font-medium text-[#1a1a2e] dark:text-white">{n.title}</p>
                          <p className="text-xs text-[#64748b] dark:text-slate-400 mt-0.5">{n.body}</p>
                          <p className="text-[10px] text-[#94a3b8] dark:text-slate-500 mt-1">
                            {new Date(n.created_at).toLocaleDateString('es-PR', {
                              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#64748b] dark:text-slate-400 hover:bg-[#f0f4f0] dark:hover:bg-white/5 transition-colors"
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* User avatar */}
            <div className="relative" ref={userRef}>
              <button
                onClick={() => setUserOpen(!userOpen)}
                className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-[#f0f4f0] dark:hover:bg-white/5 transition-colors"
              >
                <div className="w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center text-white text-[11px] font-semibold shrink-0">
                  {initials}
                </div>
                <ChevronDown size={13} className={`text-[#64748b] dark:text-slate-400 transition-transform hidden sm:block ${userOpen ? 'rotate-180' : ''}`} />
              </button>
              {userOpen && (
                <div className="absolute right-0 top-full mt-2 bg-white dark:bg-[#1e2130] border border-[#e8edf0] dark:border-[#2d3148] rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.1)] p-1.5 min-w-[200px] z-50">
                  <div className="px-3 py-2 border-b border-[#f0f4f0] dark:border-[#2d3148] mb-1">
                    <p className="text-xs text-[#94a3b8] dark:text-slate-500 truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={toggleTheme}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-[#64748b] dark:text-slate-400 hover:bg-[#f0f4f0] dark:hover:bg-white/5 hover:text-[#1a1a2e] dark:hover:text-slate-100 transition-colors"
                  >
                    {isDark ? <Sun size={15} /> : <Moon size={15} />}
                    {isDark ? 'Modo claro' : 'Modo oscuro'}
                  </button>
                  <form action={signOut}>
                    <button
                      type="submit"
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-[#64748b] dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    >
                      <LogOut size={15} />
                      Cerrar sesión
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Bottom mobile nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-[#1e2130] border-t border-[#e8edf0] dark:border-[#2d3148] flex">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 min-h-[56px] transition-colors ${
                active ? 'text-emerald-500' : 'text-[#94a3b8] dark:text-slate-500 hover:text-[#64748b]'
              }`}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
