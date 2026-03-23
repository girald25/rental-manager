'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Building2,
  Sun,
  Moon,
  ChevronDown,
  Menu,
  X,
  LayoutDashboard,
  DoorOpen,
  Users,
  FileText,
  CreditCard,
  Wrench,
  HardHat,
  FolderOpen,
  BarChart,
  BarChart2,
  LogOut,
  MoreHorizontal,
  Bell,
  Settings,
} from 'lucide-react'
import { signOut } from '@/app/actions/auth'
import { markAllRead } from '@/app/actions/notifications'
import type { User } from '@supabase/supabase-js'
import type { Notification } from '@/types'

const mainNav = [
  { href: '/dashboard', label: 'Tablero', icon: LayoutDashboard },
  { href: '/buildings', label: 'Edificios', icon: Building2 },
  { href: '/tenants', label: 'Inquilinos', icon: Users },
  { href: '/payments', label: 'Pagos', icon: CreditCard },
  { href: '/projects', label: 'Proyectos', icon: HardHat },
  { href: '/finances', label: 'Finanzas', icon: BarChart2 },
]

const moreNav = [
  { href: '/units', label: 'Unidades', icon: DoorOpen },
  { href: '/leases', label: 'Contratos', icon: FileText },
  { href: '/maintenance', label: 'Mantenimiento', icon: Wrench },
  { href: '/documents', label: 'Documentos', icon: FolderOpen },
  { href: '/reports', label: 'Reportes', icon: BarChart },
  { href: '/configuracion', label: 'Configuración', icon: Settings },
]

const bottomNav = [
  { href: '/dashboard', label: 'Tablero', icon: LayoutDashboard },
  { href: '/buildings', label: 'Edificios', icon: Building2 },
  { href: '/tenants', label: 'Inquilinos', icon: Users },
  { href: '/payments', label: 'Pagos', icon: CreditCard },
]

export default function TopNav({
  user,
  notifications = [],
}: {
  user: User | null
  notifications?: Notification[]
}) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  const [isDark, setIsDark] = useState(false)

  const moreRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)
  const bellRef = useRef<HTMLDivElement>(null)

  const unread = notifications.filter((n) => !n.read).length

  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : '??'

  useEffect(() => {
    const stored = localStorage.getItem('theme') || 'light'
    setIsDark(stored === 'dark')
  }, [])

  useEffect(() => {
    setMobileOpen(false)
    setMoreOpen(false)
    setUserOpen(false)
    setBellOpen(false)
  }, [pathname])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false)
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false)
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const toggleTheme = () => {
    const next = isDark ? 'light' : 'dark'
    setIsDark(!isDark)
    localStorage.setItem('theme', next)
    if (next === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')
  const anyMoreActive = moreNav.some((n) => isActive(n.href))

  return (
    <>
      {/* ── Desktop & Mobile Top Bar ── */}
      <header className="sticky top-0 z-40 h-16 bg-white dark:bg-[#1e2130] border-b border-[#e8edf0] dark:border-[#2d3148] shadow-[0_1px_2px_rgba(0,0,0,0.04)] print:hidden">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 flex items-center justify-between h-full gap-4">

          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Building2 size={16} className="text-white" />
            </div>
            <span className="font-bold text-[15px] text-[#1a1a2e] dark:text-white tracking-tight hidden sm:block">
              RentManager
            </span>
          </Link>

          {/* Center nav pills — hidden on mobile */}
          <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {mainNav.map(({ href, label }) => {
              const active = isActive(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-emerald-500 text-white'
                      : 'text-[#64748b] dark:text-slate-400 hover:bg-[#f0f4f0] dark:hover:bg-white/5 hover:text-[#1a1a2e] dark:hover:text-slate-100'
                  }`}
                >
                  {label}
                </Link>
              )
            })}

            {/* Más dropdown */}
            <div className="relative" ref={moreRef}>
              <button
                onClick={() => setMoreOpen(!moreOpen)}
                className={`flex items-center gap-1 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  anyMoreActive
                    ? 'bg-emerald-500 text-white'
                    : 'text-[#64748b] dark:text-slate-400 hover:bg-[#f0f4f0] dark:hover:bg-white/5 hover:text-[#1a1a2e] dark:hover:text-slate-100'
                }`}
              >
                Más
                <ChevronDown size={13} className={`transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
              </button>
              {moreOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white dark:bg-[#1e2130] border border-[#e8edf0] dark:border-[#2d3148] rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.1)] p-1.5 min-w-[180px] z-50">
                  {moreNav.map(({ href, label, icon: Icon }) => {
                    const active = isActive(href)
                    return (
                      <Link
                        key={href}
                        href={href}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors ${
                          active
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium'
                            : 'text-[#64748b] dark:text-slate-400 hover:bg-[#f0f4f0] dark:hover:bg-white/5 hover:text-[#1a1a2e] dark:hover:text-slate-100'
                        }`}
                      >
                        <Icon size={15} />
                        {label}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          </nav>

          {/* Right section */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Notification bell */}
            <div className="relative" ref={bellRef}>
              <button
                onClick={async () => {
                  setBellOpen(!bellOpen)
                  if (!bellOpen && unread > 0) await markAllRead()
                }}
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
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* User avatar dropdown */}
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

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden w-8 h-8 rounded-full flex items-center justify-center text-[#64748b] dark:text-slate-400 hover:bg-[#f0f4f0] dark:hover:bg-white/5 transition-colors"
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile full-screen overlay ── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-white dark:bg-[#0f1117] flex flex-col print:hidden">
          <div className="flex items-center justify-between px-4 py-4 border-b border-[#e8edf0] dark:border-[#2d3148]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <Building2 size={16} className="text-white" />
              </div>
              <span className="font-bold text-[15px] text-[#1a1a2e] dark:text-white">RentManager</span>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#64748b] dark:text-slate-400 hover:bg-[#f0f4f0] dark:hover:bg-white/5"
            >
              <X size={18} />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {[...mainNav, ...moreNav].map(({ href, label, icon: Icon }) => {
              const active = isActive(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    active
                      ? 'bg-emerald-500 text-white'
                      : 'text-[#64748b] dark:text-slate-400 hover:bg-[#f0f4f0] dark:hover:bg-white/5 hover:text-[#1a1a2e] dark:hover:text-slate-100'
                  }`}
                >
                  <Icon size={18} />
                  {label}
                </Link>
              )
            })}
          </nav>
          <div className="border-t border-[#e8edf0] dark:border-[#2d3148] p-4 space-y-1">
            <div className="flex items-center gap-3 px-4 py-2 mb-2">
              <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                {initials}
              </div>
              <p className="text-sm text-[#64748b] dark:text-slate-400 truncate">{user?.email}</p>
            </div>
            <button
              onClick={toggleTheme}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-[#64748b] dark:text-slate-400 hover:bg-[#f0f4f0] dark:hover:bg-white/5 transition-colors"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
              {isDark ? 'Modo claro' : 'Modo oscuro'}
            </button>
            <form action={signOut}>
              <button
                type="submit"
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-[#64748b] dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 transition-colors"
              >
                <LogOut size={18} />
                Sign out
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Mobile bottom nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-[#1e2130] border-t border-[#e8edf0] dark:border-[#2d3148] flex print:hidden">
        {bottomNav.map(({ href, label, icon: Icon }) => {
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
        <button
          onClick={() => setMobileOpen(true)}
          className="flex-1 flex flex-col items-center justify-center gap-1 py-2 min-h-[56px] text-[#94a3b8] dark:text-slate-500 hover:text-[#64748b] transition-colors"
        >
          <MoreHorizontal size={20} />
          <span className="text-[10px] font-medium">Más</span>
        </button>
      </nav>
    </>
  )
}
