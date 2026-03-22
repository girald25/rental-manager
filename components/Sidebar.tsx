'use client'

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
  LogOut,
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
  { href: '/finances', label: 'Finances', icon: BarChart2 },
]

export default function Sidebar({ user }: { user: User | null }) {
  const pathname = usePathname()
  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : '??'

  return (
    <aside className="w-60 shrink-0 bg-white border-r border-zinc-200 flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-zinc-100">
        <div className="flex items-center gap-2">
          <Building2 size={18} className="text-zinc-900" />
          <span className="text-sm font-semibold text-zinc-900 tracking-tight">RentManager</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors ${
                active
                  ? 'bg-zinc-100 text-zinc-900 font-medium'
                  : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
              }`}
            >
              <Icon size={15} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User profile */}
      <div className="border-t border-zinc-100 px-3 py-3">
        <div className="flex items-center gap-2.5 px-2.5 py-2 mb-0.5">
          <div className="w-6 h-6 bg-zinc-900 rounded-full flex items-center justify-center shrink-0 text-white text-[10px] font-semibold">
            {initials}
          </div>
          <p className="text-xs text-zinc-600 truncate flex-1">{user?.email}</p>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 transition-colors"
          >
            <LogOut size={15} />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  )
}
