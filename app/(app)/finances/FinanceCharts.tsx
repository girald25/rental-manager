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
    <div className="bg-white border border-[#e8edf0] rounded-lg shadow-lg px-3 py-2.5 text-xs">
      {label && <p className="font-medium text-[#1a1a2e] mb-1.5">{label}</p>}
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: entry.color || entry.fill }} />
          <span className="text-[#64748b] capitalize">{entry.name}:</span>
          <span className="font-medium text-[#1a1a2e]">${Number(entry.value).toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

export function IncomeExpenseChart({ data }: { data: MonthlyFinancialData[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} barGap={2} barCategoryGap="30%">
        <CartesianGrid strokeDasharray="3 3" stroke="#e8edf0" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
        <YAxis tickFormatter={fmt} tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} width={48} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(240,244,240,0.8)' }} />
        <Legend
          iconType="square"
          iconSize={8}
          formatter={(v) => <span style={{ fontSize: 11, color: '#94a3b8', textTransform: 'capitalize' }}>{v}</span>}
        />
        <Bar dataKey="income" fill="#10b981" radius={[3, 3, 0, 0]} name="ingresos" />
        <Bar dataKey="expenses" fill="#cbd5e1" radius={[3, 3, 0, 0]} name="gastos" />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function NOITrendChart({ data }: { data: MonthlyFinancialData[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e8edf0" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
        <YAxis tickFormatter={fmt} tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} width={48} />
        <Tooltip content={<ChartTooltip />} />
        <Line
          type="monotone"
          dataKey="noi"
          stroke="#10b981"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: '#10b981' }}
          name="ini"
        />
        <Line
          type="monotone"
          dataKey="runningBalance"
          stroke="#94a3b8"
          strokeWidth={1.5}
          strokeDasharray="4 4"
          dot={false}
          name="acumulado"
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
      <div className="h-[220px] flex items-center justify-center text-sm text-slate-500">
        Sin datos de gastos
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
            contentStyle={{ fontSize: 12, background: '#ffffff', border: '1px solid #e8edf0', borderRadius: 8, color: '#1a1a2e' }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex-1 space-y-2">
        {data.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: entry.color }} />
            <span className="text-xs text-[#64748b] capitalize flex-1">{entry.name}</span>
            <span className="text-xs font-medium text-[#1a1a2e] tabular-nums">
              ${Number(entry.value).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
