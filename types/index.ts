export type Building = {
  id: string
  name: string
  address: string
  city: string
  state: string
  zip: string
  investment_value: number | null
  market_value: number | null
  created_at: string
}

export type Unit = {
  id: string
  building_id: string
  unit_number: string
  floor: number | null
  bedrooms: number
  bathrooms: number
  sqft: number | null
  status: 'vacant' | 'occupied'
  created_at: string
  building?: Building
}

export type Tenant = {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  emergency_contact: string | null
  emergency_phone: string | null
  created_at: string
}

export type Lease = {
  id: string
  unit_id: string
  tenant_id: string
  start_date: string
  end_date: string
  rent_amount: number
  deposit_amount: number
  status: 'active' | 'expired' | 'terminated'
  created_at: string
  unit?: Unit & { building?: Building }
  tenant?: Tenant
}

export type Payment = {
  id: string
  lease_id: string
  amount: number
  due_date: string
  paid_date: string | null
  status: 'pending' | 'paid' | 'late'
  payment_method: string | null
  notes: string | null
  created_at: string
  lease?: Lease & { unit?: Unit & { building?: Building }; tenant?: Tenant }
}

export type MaintenanceRequest = {
  id: string
  unit_id: string
  title: string
  description: string | null
  status: 'open' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  notes: string | null
  completed_at: string | null
  created_at: string
  unit?: Unit & { building?: Building }
}

export type ExpenseCategory =
  | 'maintenance'
  | 'utilities'
  | 'insurance'
  | 'taxes'
  | 'repairs'
  | 'capex'
  | 'management'
  | 'other'

export type Expense = {
  id: string
  user_id: string
  building_id: string | null
  unit_id: string | null
  category: ExpenseCategory
  description: string
  amount: number
  date: string
  receipt_url: string | null
  created_at: string
  building?: { id: string; name: string }
  unit?: { id: string; unit_number: string }
}

export type OtherIncomeCategory = 'late_fee' | 'parking' | 'laundry' | 'pet_fee' | 'other'

export type OtherIncome = {
  id: string
  user_id: string
  building_id: string | null
  unit_id: string | null
  category: OtherIncomeCategory
  description: string
  amount: number
  date: string
  created_at: string
  building?: { id: string; name: string }
  unit?: { id: string; unit_number: string }
}

export type MonthlyFinancialData = {
  month: string
  income: number
  expenses: number
  noi: number
  runningBalance: number
}

export type CategoryBreakdown = {
  name: string
  value: number
  color: string
}

export type FinanceMetrics = {
  noi: number
  annualIncome: number
  annualExpenses: number
  cashOnCash: number | null
  grm: number | null
  vacancyRate: number
  oer: number
  capRate: number | null
  totalInvestment: number
  totalMarketValue: number
}

export type DocumentCategory =
  | 'contract'
  | 'lease'
  | 'photo'
  | 'invoice'
  | 'inspection'
  | 'other'

export type Document = {
  id: string
  user_id: string
  building_id: string | null
  unit_id: string | null
  tenant_id: string | null
  name: string
  description: string | null
  category: DocumentCategory
  file_url: string
  file_type: string | null
  file_size: number | null
  created_at: string
  building?: { id: string; name: string }
  unit?: { id: string; unit_number: string }
  tenant?: { id: string; first_name: string; last_name: string }
}

export type ProjectStatus = 'planning' | 'in_progress' | 'on_hold' | 'completed'
export type ProjectPriority = 'low' | 'medium' | 'high' | 'urgent'

export type Project = {
  id: string
  user_id: string
  building_id: string | null
  unit_id: string | null
  title: string
  description: string | null
  status: ProjectStatus
  priority: ProjectPriority
  budget: number | null
  actual_cost: number | null
  progress: number
  contractor_name: string | null
  contractor_contact: string | null
  start_date: string | null
  estimated_end_date: string | null
  actual_end_date: string | null
  created_at: string
  updated_at: string
  building?: { id: string; name: string }
  unit?: { id: string; unit_number: string }
  notes?: ProjectNote[]
}

export type ProjectNote = {
  id: string
  project_id: string
  note: string
  created_at: string
}

export type ActionState = { error?: string; success?: boolean } | null

export type TenantInvitation = {
  id: string
  tenant_id: string
  email: string
  token: string
  expires_at: string
  accepted_at: string | null
  created_at: string
  tenant?: Tenant
}

export type MaintenanceTicket = {
  id: string
  tenant_id: string
  unit_id: string
  title: string
  description: string | null
  status: 'open' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  notes: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
  tenant?: Tenant
  unit?: Unit & { building?: Building }
}

export type Notification = {
  id: string
  user_id: string
  title: string
  body: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  link: string | null
  created_at: string
}

export type OwnerSettings = {
  id: string
  user_id: string
  stripe_account_id: string | null
  ath_movil_phone: string | null
  bank_name: string | null
  bank_routing: string | null
  bank_account: string | null
  bank_account_name: string | null
  accept_cash: boolean
  accept_check: boolean
  created_at: string
  updated_at: string
}
