'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts'
import type { MonthlyFinancialData, CategoryBreakdown } from '@/types'

const fmt = (v: number) =>
  v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v.toLocaleString()}`

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: any[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-zinc-200 rounded-lg shadow-lg px-3 py-2.5 text-xs">
      {label && <p className="font-medium text-zinc-900 mb-1.5">{label}</p>}
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: entry.color || entry.fill }} />
          <span className="text-zinc-500 capitalize">{entry.name}:</span>
          <span className="font-medium text-zinc-900">${Number(entry.value).toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

export function IncomeExpenseChart({ data }: { data: MonthlyFinancialData[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} barGap={2} barCategoryGap="30%">
        <CartesianGrid strokeDasharray="3 3" stroke="#F4F4F5" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#A1A1AA' }} tickLine={false} axisLine={false} />
        <YAxis tickFormatter={fmt} tick={{ fontSize: 11, fill: '#A1A1AA' }} tickLine={false} axisLine={false} width={48} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: '#F4F4F5' }} />
        <Legend
          iconType="square"
          iconSize={8}
          formatter={(v) => <span style={{ fontSize: 11, color: '#71717A', textTransform: 'capitalize' }}>{v}</span>}
        />
        <Bar dataKey="income" fill="#18181B" radius={[3, 3, 0, 0]} name="income" />
        <Bar dataKey="expenses" fill="#D4D4D8" radius={[3, 3, 0, 0]} name="expenses" />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function NOITrendChart({ data }: { data: MonthlyFinancialData[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F4F4F5" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#A1A1AA' }} tickLine={false} axisLine={false} />
        <YAxis tickFormatter={fmt} tick={{ fontSize: 11, fill: '#A1A1AA' }} tickLine={false} axisLine={false} width={48} />
        <Tooltip content={<ChartTooltip />} />
        <Line
          type="monotone"
          dataKey="noi"
          stroke="#18181B"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: '#18181B' }}
          name="noi"
        />
        <Line
          type="monotone"
          dataKey="runningBalance"
          stroke="#A1A1AA"
          strokeWidth={1.5}
          strokeDasharray="4 4"
          dot={false}
          name="cumulative"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

const RADIAN = Math.PI / 180
function CustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) {
  if (percent < 0.05) return null
  const r = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + r * Math.cos(-midAngle * RADIAN)
  const y = cy + r * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight={500}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export function ExpenseBreakdownChart({ data }: { data: CategoryBreakdown[] }) {
  if (data.length === 0) {
    return (
      <div className="h-[220px] flex items-center justify-center text-sm text-zinc-400">
        No expense data
      </div>
    )
  }
  return (
    <div className="flex items-center gap-4">
      <ResponsiveContainer width="60%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={90}
            dataKey="value"
            labelLine={false}
            label={CustomLabel}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v: any) => [`$${Number(v).toLocaleString()}`, '']}
            contentStyle={{ fontSize: 12, border: '1px solid #E4E4E7', borderRadius: 8 }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex-1 space-y-2">
        {data.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: entry.color }} />
            <span className="text-xs text-zinc-600 capitalize flex-1">{entry.name}</span>
            <span className="text-xs font-medium text-zinc-900 tabular-nums">
              ${Number(entry.value).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
