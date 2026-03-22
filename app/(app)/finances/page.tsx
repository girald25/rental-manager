import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import FinancesClient from './FinancesClient'
import type {
  FinanceMetrics,
  MonthlyFinancialData,
  CategoryBreakdown,
} from '@/types'

// Generate last N months as { year, month(1-12), label }
function getLast12Months() {
  const now = new Date()
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1)
    return {
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      label: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    }
  })
}

function monthOf(dateStr: string) {
  const d = new Date(dateStr)
  return { year: d.getFullYear(), month: d.getMonth() + 1 }
}

const CATEGORY_COLORS: Record<string, string> = {
  maintenance: '#18181B',
  repairs:     '#3F3F46',
  utilities:   '#52525B',
  management:  '#71717A',
  taxes:       '#A1A1AA',
  insurance:   '#27272A',
  capex:       '#D4D4D8',
  other:       '#E4E4E7',
}

export default async function FinancesPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const last12 = getLast12Months()
  const startDate = `${last12[0].year}-${String(last12[0].month).padStart(2, '0')}-01`

  const [
    { data: paidPayments },
    { data: allExpenses },
    { data: allOtherIncome },
    { data: buildings },
    { count: totalUnits },
    { count: vacantUnits },
    { data: units },
  ] = await Promise.all([
    supabase
      .from('payments')
      .select('id, amount, paid_date, lease:leases(tenant:tenants(first_name, last_name), unit:units(unit_number, building:buildings(name)))')
      .eq('status', 'paid')
      .order('paid_date', { ascending: false }),
    supabase
      .from('expenses')
      .select('*, building:buildings(id, name), unit:units(id, unit_number)')
      .order('date', { ascending: false }),
    supabase
      .from('other_income')
      .select('*, building:buildings(id, name), unit:units(id, unit_number)')
      .order('date', { ascending: false }),
    supabase.from('buildings').select('*').order('name'),
    supabase.from('units').select('*', { count: 'exact', head: true }),
    supabase.from('units').select('*', { count: 'exact', head: true }).eq('status', 'vacant'),
    supabase.from('units').select('id, unit_number, building_id, building:buildings(id, name)').order('unit_number'),
  ])

  // Filter payments + expenses + other_income to last 12 months for chart data
  const recentPayments = (paidPayments ?? []).filter(
    (p) => p.paid_date && p.paid_date >= startDate
  )
  const recentExpenses = (allExpenses ?? []).filter((e) => e.date >= startDate)
  const recentOtherIncome = (allOtherIncome ?? []).filter((o) => o.date >= startDate)

  // Monthly chart data
  const monthly: MonthlyFinancialData[] = last12.map(({ year, month, label }) => {
    const inc =
      recentPayments
        .filter((p) => {
          const m = monthOf(p.paid_date!)
          return m.year === year && m.month === month
        })
        .reduce((s, p) => s + Number(p.amount), 0) +
      recentOtherIncome
        .filter((o) => {
          const m = monthOf(o.date)
          return m.year === year && m.month === month
        })
        .reduce((s, o) => s + Number(o.amount), 0)

    const exp = recentExpenses
      .filter((e) => {
        const m = monthOf(e.date)
        return m.year === year && m.month === month
      })
      .reduce((s, e) => s + Number(e.amount), 0)

    return { month: label, income: inc, expenses: exp, noi: inc - exp, runningBalance: 0 }
  })

  // Running balance (cumulative NOI)
  let balance = 0
  for (const m of monthly) {
    balance += m.noi
    m.runningBalance = balance
  }

  // Expense breakdown by category (all time)
  const categoryTotals: Record<string, number> = {}
  for (const e of allExpenses ?? []) {
    categoryTotals[e.category] = (categoryTotals[e.category] ?? 0) + Number(e.amount)
  }
  const categoryBreakdown: CategoryBreakdown[] = Object.entries(categoryTotals)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value, color: CATEGORY_COLORS[name] ?? '#A1A1AA' }))
    .sort((a, b) => b.value - a.value)

  // Metrics (last 12 months)
  const annualIncome =
    recentPayments.reduce((s, p) => s + Number(p.amount), 0) +
    recentOtherIncome.reduce((s, o) => s + Number(o.amount), 0)
  const annualExpenses = recentExpenses.reduce((s, e) => s + Number(e.amount), 0)
  const noi = annualIncome - annualExpenses

  const totalInvestment = (buildings ?? []).reduce(
    (s, b) => s + (b.investment_value ? Number(b.investment_value) : 0),
    0
  )
  const totalMarketValue = (buildings ?? []).reduce(
    (s, b) => s + (b.market_value ? Number(b.market_value) : 0),
    0
  )

  const metrics: FinanceMetrics = {
    noi,
    annualIncome,
    annualExpenses,
    vacancyRate: totalUnits ? ((vacantUnits ?? 0) / totalUnits) * 100 : 0,
    oer: annualIncome > 0 ? (annualExpenses / annualIncome) * 100 : 0,
    cashOnCash: totalInvestment > 0 ? (noi / totalInvestment) * 100 : null,
    grm: annualIncome > 0 && totalMarketValue > 0 ? totalMarketValue / annualIncome : null,
    capRate: totalMarketValue > 0 ? (noi / totalMarketValue) * 100 : null,
    totalInvestment,
    totalMarketValue,
  }

  return (
    <div className="p-8">
      <FinancesClient
        metrics={metrics}
        monthlyData={monthly}
        categoryBreakdown={categoryBreakdown}
        allExpenses={allExpenses ?? []}
        allOtherIncome={allOtherIncome ?? []}
        allPaidPayments={paidPayments ?? []}
        buildings={buildings ?? []}
        units={(units as any) ?? []}
      />
    </div>
  )
}
