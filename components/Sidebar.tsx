'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Building2,
  DoorOpen,
  Users,
  FileText,
  CreditCard,
  BarChart2,
  Wrench,
  HardHat,
  FolderOpen,
  BarChart,
  LogOut,
  Menu,
  X,
  MoreHorizontal,
  Sun,
  Moon,
} from 'lucide-react'
import { signOut } from '@/app/actions/auth'
import type { User } from '@supabase/supabase-js'

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/buildings', label: 'Buildings', icon: Building2 },
  { href: '/units', label: 'Units', icon: DoorOpen },
  { href: '/tenants', label: 'Tenants', icon: Users },
  { href: '/leases', label: 'Leases', icon: FileText },
  { href: '/payments', label: 'Payments', icon: CreditCard },
  { href: '/maintenance', label: 'Maintenance', icon: Wrench },
  { href: '/projects', label: 'Projects', icon: HardHat },
  { href: '/documents', label: 'Documents', icon: FolderOpen },
  { href: '/reports', label: 'Reports', icon: BarChart },
  { href: '/finances', label: 'Finances', icon: BarChart2 },
]

const bottomNav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/buildings', label: 'Buildings', icon: Building2 },
  { href: '/payments', label: 'Payments', icon: CreditCard },
  { href: '/projects', label: 'Projects', icon: HardHat },
]

export default function Sidebar({ user }: { user: User | null }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isDark, setIsDark] = useState(true)
  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : '??'

  useEffect(() => {
    const stored = localStorage.getItem('theme') || 'dark'
    setIsDark(stored === 'dark')
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

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

  return (
    <>
      {/* ── Desktop sidebar (always dark) ── */}
      <aside className="max-md:hidden w-[220px] shrink-0 bg-[#0f1117] border-r border-[#1e2130] flex flex-col h-full print:hidden">
        <div className="px-5 py-5 border-b border-[#1e2130]">
          <div className="flex items-center gap-2">
            <Building2 size={18} className="text-emerald-400" />
            <span className="text-sm font-semibold text-white tracking-tight">RentManager</span>
          </div>
        </div>
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors border-l-[3px] ${
                  active
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/5 border-transparent'
                }`}
              >
                <Icon size={15} />
                {label}
              </Link>
            )
          })}
        </nav>
        <div className="border-t border-[#1e2130] px-3 py-3">
          <div className="flex items-center gap-2.5 px-2.5 py-2 mb-0.5">
            <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shrink-0 text-white text-[10px] font-semibold">
              {initials}
            </div>
            <p className="text-xs text-slate-400 truncate flex-1">{user?.email}</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-colors"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
              <span>{isDark ? 'Light mode' : 'Dark mode'}</span>
            </button>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-colors"
            >
              <LogOut size={15} />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* ── Mobile top bar ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 h-14 bg-[#0f1117] border-b border-[#1e2130] flex items-center justify-between px-4 print:hidden">
        <div className="flex items-center gap-2">
          <Building2 size={18} className="text-emerald-400" />
          <span className="text-sm font-semibold text-white tracking-tight">RentManager</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-md text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-colors"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* ── Mobile overlay sidebar ── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 print:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute top-0 left-0 bottom-0 w-72 bg-[#0f1117] flex flex-col shadow-2xl">
            <div className="px-4 py-4 border-b border-[#1e2130] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 size={18} className="text-emerald-400" />
                <span className="text-sm font-semibold text-white tracking-tight">RentManager</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-md text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
              {nav.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(href + '/')
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-3 px-3 py-3 rounded-md text-sm transition-colors border-l-[3px] ${
                      active
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-white/5 border-transparent'
                    }`}
                  >
                    <Icon size={18} />
                    {label}
                  </Link>
                )
              })}
            </nav>
            <div className="border-t border-[#1e2130] px-3 py-3">
              <div className="flex items-center gap-2.5 px-3 py-2 mb-0.5">
                <div className="w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-semibold">
                  {initials}
                </div>
                <p className="text-xs text-slate-400 truncate flex-1">{user?.email}</p>
              </div>
              <button
                onClick={toggleTheme}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-md text-sm text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-colors"
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
                {isDark ? 'Light mode' : 'Dark mode'}
              </button>
              <form action={signOut}>
                <button
                  type="submit"
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-md text-sm text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-colors"
                >
                  <LogOut size={18} />
                  Sign out
                </button>
              </form>
            </div>
          </aside>
        </div>
      )}

      {/* ── Mobile bottom nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#0f1117] border-t border-[#1e2130] flex print:hidden">
        {bottomNav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 min-h-[56px] transition-colors ${
                active ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
        <button
          onClick={() => setMobileOpen(true)}
          className="flex-1 flex flex-col items-center justify-center gap-1 py-2 min-h-[56px] text-slate-500 hover:text-slate-300 transition-colors"
        >
          <MoreHorizontal size={20} />
          <span className="text-[10px] font-medium">More</span>
        </button>
      </nav>
    </>
  )
}
