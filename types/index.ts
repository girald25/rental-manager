export type Building = {
  id: string
  name: string
  address: string
  city: string
  state: string
  zip: string
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

export type ActionState = { error?: string; success?: boolean } | null
