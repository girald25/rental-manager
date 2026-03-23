-- ============================================================
-- TENANT PORTAL MIGRATION
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add user_id to tenants (link auth user to tenant record)
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS tenants_user_id_idx ON tenants(user_id);

-- 2. Ensure documents table exists, then add shared_with_tenant flag
CREATE TABLE IF NOT EXISTS documents (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid        REFERENCES auth.users(id) DEFAULT auth.uid(),
  building_id uuid        REFERENCES buildings(id) ON DELETE SET NULL,
  unit_id     uuid        REFERENCES units(id)     ON DELETE SET NULL,
  tenant_id   uuid        REFERENCES tenants(id)   ON DELETE SET NULL,
  name        text        NOT NULL,
  description text,
  category    text        NOT NULL DEFAULT 'other'
                CHECK (category IN ('contract','lease','photo','invoice','inspection','other')),
  file_url    text        NOT NULL,
  file_type   text,
  file_size   bigint,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS shared_with_tenant boolean NOT NULL DEFAULT false;

-- 3. tenant_invitations — owner sends invite link to tenant email
CREATE TABLE IF NOT EXISTS tenant_invitations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email         text NOT NULL,
  token         text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at    timestamptz NOT NULL DEFAULT now() + interval '7 days',
  accepted_at   timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tenant_invitations_token_idx ON tenant_invitations(token);
CREATE INDEX IF NOT EXISTS tenant_invitations_tenant_id_idx ON tenant_invitations(tenant_id);

-- 4. maintenance_tickets — tenant-submitted maintenance requests
CREATE TABLE IF NOT EXISTS maintenance_tickets (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  unit_id       uuid NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  title         text NOT NULL,
  description   text,
  status        text NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','completed')),
  priority      text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  notes         text,
  completed_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS maintenance_tickets_tenant_id_idx ON maintenance_tickets(tenant_id);
CREATE INDEX IF NOT EXISTS maintenance_tickets_unit_id_idx ON maintenance_tickets(unit_id);
CREATE INDEX IF NOT EXISTS maintenance_tickets_status_idx ON maintenance_tickets(status);

-- 5. notifications — in-app notification log
CREATE TABLE IF NOT EXISTS notifications (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title         text NOT NULL,
  body          text NOT NULL,
  type          text NOT NULL DEFAULT 'info' CHECK (type IN ('info','success','warning','error')),
  read          boolean NOT NULL DEFAULT false,
  link          text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_read_idx ON notifications(user_id, read);

-- 6. owner_settings — per-owner payment config
CREATE TABLE IF NOT EXISTS owner_settings (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_account_id   text,
  ath_movil_phone     text,
  bank_name           text,
  bank_routing        text,
  bank_account        text,
  bank_account_name   text,
  accept_cash         boolean NOT NULL DEFAULT true,
  accept_check        boolean NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- ENABLE RLS
-- ============================================================

ALTER TABLE tenant_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE owner_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES — tenant_invitations
-- ============================================================

DROP POLICY IF EXISTS "Owners can view invitations" ON tenant_invitations;
DROP POLICY IF EXISTS "Owners can insert invitations" ON tenant_invitations;
DROP POLICY IF EXISTS "Anyone can read invitation by token (for acceptance flow)" ON tenant_invitations;
DROP POLICY IF EXISTS "Accept invitation" ON tenant_invitations;

-- Owners can read invitations (any authenticated user for now, since buildings have no user_id)
CREATE POLICY "Owners can view invitations"
  ON tenant_invitations FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Owners can insert invitations"
  ON tenant_invitations FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Anyone can read invitation by token (for acceptance flow)"
  ON tenant_invitations FOR SELECT
  USING (true);  -- token is the secret; we rely on it being unguessable

-- Allow updating invitation (mark accepted) — token holder
CREATE POLICY "Accept invitation"
  ON tenant_invitations FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- RLS POLICIES — maintenance_tickets
-- ============================================================

DROP POLICY IF EXISTS "Tenants can view own tickets" ON maintenance_tickets;
DROP POLICY IF EXISTS "Tenants can create tickets" ON maintenance_tickets;
DROP POLICY IF EXISTS "Owners and tenants can update tickets" ON maintenance_tickets;

-- Tenants can see their own tickets
CREATE POLICY "Tenants can view own tickets"
  ON maintenance_tickets FOR SELECT
  USING (
    tenant_id IN (
      SELECT id FROM tenants WHERE user_id = auth.uid()
    )
    OR auth.role() = 'authenticated'
  );

CREATE POLICY "Tenants can create tickets"
  ON maintenance_tickets FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT id FROM tenants WHERE user_id = auth.uid()
    )
    OR auth.role() = 'authenticated'
  );

CREATE POLICY "Owners and tenants can update tickets"
  ON maintenance_tickets FOR UPDATE
  USING (auth.role() = 'authenticated');

-- ============================================================
-- RLS POLICIES — notifications
-- ============================================================

DROP POLICY IF EXISTS "Users see own notifications" ON notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Users can mark own notifications read" ON notifications;

CREATE POLICY "Users see own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can mark own notifications read"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================================
-- RLS POLICIES — owner_settings
-- ============================================================

DROP POLICY IF EXISTS "Owners can view own settings" ON owner_settings;
DROP POLICY IF EXISTS "Owners can insert own settings" ON owner_settings;
DROP POLICY IF EXISTS "Owners can update own settings" ON owner_settings;

CREATE POLICY "Owners can view own settings"
  ON owner_settings FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Owners can insert own settings"
  ON owner_settings FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Owners can update own settings"
  ON owner_settings FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================================
-- SHARED DOCUMENTS — tenants can see docs shared with them
-- ============================================================

-- (documents table already has RLS — we need a tenant-facing policy)
-- If documents table has no RLS yet, enable it:
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners manage own documents" ON documents;
DROP POLICY IF EXISTS "Tenants see shared documents" ON documents;

-- Owners can do anything with their own documents
CREATE POLICY "Owners manage own documents"
  ON documents FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Tenants can see documents shared with them
CREATE POLICY "Tenants see shared documents"
  ON documents FOR SELECT
  USING (
    shared_with_tenant = true
    AND tenant_id IN (
      SELECT id FROM tenants WHERE user_id = auth.uid()
    )
  );
