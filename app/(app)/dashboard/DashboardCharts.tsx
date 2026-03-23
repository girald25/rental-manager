'use client'

import { useState } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const fmt = (v: number) =>
  v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v}`

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-[#1e2130] border border-[#e8edf0] dark:border-[#2d3148] rounded-xl shadow-lg px-3 py-2.5 text-xs">
      {label && <p className="font-semibold text-[#1a1a2e] dark:text-slate-200 mb-1">{label}</p>}
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-[#64748b] dark:text-slate-400">Ingresos:</span>
          <span className="font-semibold text-[#1a1a2e] dark:text-slate-200">
            ${Number(entry.value).toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  )
}

export function PerformanceChart({ data }: { data: { month: string; income: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e8edf0" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tickFormatter={fmt}
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={false}
          width={44}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#e8edf0', strokeWidth: 1 }} />
        <Area
          type="monotone"
          dataKey="income"
          stroke="#10b981"
          strokeWidth={2.5}
          fill="url(#incomeGradient)"
          dot={false}
          activeDot={{ r: 4, fill: '#10b981', stroke: 'white', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]
const DAY_NAMES = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do']

export function MiniCalendar({
  leaseDates,
  paymentDates,
}: {
  leaseDates: string[]
  paymentDates: string[]
}) {
  const [offset, setOffset] = useState(0)
  const now = new Date()
  const viewDate = new Date(now.getFullYear(), now.getMonth() + offset, 1)
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const firstDay = new Date(year, month, 1)
  // Monday-based: 0=Mon ... 6=Sun
  const startDow = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const leaseSet = new Set(leaseDates.filter((d) => {
    const [y, m] = d.split('-').map(Number)
    return y === year && m === month + 1
  }).map((d) => parseInt(d.split('-')[2])))

  const paySet = new Set(paymentDates.filter((d) => {
    const [y, m] = d.split('-').map(Number)
    return y === year && m === month + 1
  }).map((d) => parseInt(d.split('-')[2])))

  const today = now.getDate()
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() === month

  const cells: (number | null)[] = Array(startDow).fill(null)
  for (let i = 1; i <= daysInMonth; i++) cells.push(i)
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-[#1a1a2e] dark:text-white">
          {MONTH_NAMES[month]} {year}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setOffset((o) => o - 1)}
            className="w-6 h-6 rounded-full flex items-center justify-center text-[#64748b] dark:text-slate-400 hover:bg-[#f0f4f0] dark:hover:bg-white/5 transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => setOffset((o) => o + 1)}
            className="w-6 h-6 rounded-full flex items-center justify-center text-[#64748b] dark:text-slate-400 hover:bg-[#f0f4f0] dark:hover:bg-white/5 transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {DAY_NAMES.map((d) => (
          <div key={d} className="text-center text-[10px] font-medium text-[#94a3b8] dark:text-slate-500 py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />
          const isToday = isCurrentMonth && day === today
          const hasLease = leaseSet.has(day)
          const hasPay = paySet.has(day)
          return (
            <div
              key={i}
              className={`relative flex flex-col items-center justify-center h-8 rounded-lg text-xs font-medium transition-colors ${
                isToday
                  ? 'bg-emerald-500 text-white'
                  : 'text-[#64748b] dark:text-slate-400 hover:bg-[#f0f4f0] dark:hover:bg-white/5'
              }`}
            >
              {day}
              {(hasLease || hasPay) && !isToday && (
                <div className="absolute bottom-1 flex gap-0.5">
                  {hasPay && <span className="w-1 h-1 rounded-full bg-emerald-500" />}
                  {hasLease && <span className="w-1 h-1 rounded-full bg-amber-400" />}
                </div>
              )}
            </div>
          )
        })}
      </div>
      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[#f0f4f0] dark:border-[#2d3148]">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-[10px] text-[#64748b] dark:text-slate-500">Pagos</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="text-[10px] text-[#64748b] dark:text-slate-500">Vencimientos</span>
        </div>
      </div>
    </div>
  )
}
