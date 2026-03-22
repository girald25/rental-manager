-- Buildings
create table if not exists buildings (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  address text not null,
  city text not null,
  state text not null,
  zip text not null,
  created_at timestamptz default now()
);

-- Units
create table if not exists units (
  id uuid default gen_random_uuid() primary key,
  building_id uuid references buildings(id) on delete cascade,
  unit_number text not null,
  floor integer,
  bedrooms integer not null default 1,
  bathrooms numeric(3,1) not null default 1,
  sqft integer,
  status text not null default 'vacant' check (status in ('vacant', 'occupied')),
  created_at timestamptz default now()
);

-- Tenants
create table if not exists tenants (
  id uuid default gen_random_uuid() primary key,
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  emergency_contact text,
  emergency_phone text,
  created_at timestamptz default now()
);

-- Leases
create table if not exists leases (
  id uuid default gen_random_uuid() primary key,
  unit_id uuid references units(id) on delete cascade,
  tenant_id uuid references tenants(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  rent_amount numeric(10,2) not null,
  deposit_amount numeric(10,2) not null default 0,
  status text not null default 'active' check (status in ('active', 'expired', 'terminated')),
  created_at timestamptz default now()
);

-- Payments
create table if not exists payments (
  id uuid default gen_random_uuid() primary key,
  lease_id uuid references leases(id) on delete cascade,
  amount numeric(10,2) not null,
  due_date date not null,
  paid_date date,
  status text not null default 'pending' check (status in ('pending', 'paid', 'late')),
  payment_method text,
  notes text,
  created_at timestamptz default now()
);

-- Maintenance Requests
create table if not exists maintenance_requests (
  id uuid default gen_random_uuid() primary key,
  unit_id uuid references units(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'open' check (status in ('open', 'in_progress', 'completed')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  notes text,
  completed_at timestamptz,
  created_at timestamptz default now()
);
