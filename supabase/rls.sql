-- ============================================================
-- Row Level Security setup
-- Run this AFTER schema.sql in the Supabase SQL editor.
-- ============================================================

-- 1. Add user_id to root-level tables
--    (buildings and tenants are the ownership anchors;
--     all other tables inherit access via foreign keys)

ALTER TABLE buildings
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) DEFAULT auth.uid();

ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) DEFAULT auth.uid();

-- 2. Enable RLS on every table

ALTER TABLE buildings           ENABLE ROW LEVEL SECURITY;
ALTER TABLE units               ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants             ENABLE ROW LEVEL SECURITY;
ALTER TABLE leases              ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments            ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;

-- 3. Drop old policies if re-running this script

DROP POLICY IF EXISTS "users_own_buildings"    ON buildings;
DROP POLICY IF EXISTS "users_own_tenants"      ON tenants;
DROP POLICY IF EXISTS "users_own_units"        ON units;
DROP POLICY IF EXISTS "users_own_leases"       ON leases;
DROP POLICY IF EXISTS "users_own_payments"     ON payments;
DROP POLICY IF EXISTS "users_own_maintenance"  ON maintenance_requests;

-- 4. Buildings — direct user_id check

CREATE POLICY "users_own_buildings" ON buildings
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. Tenants — direct user_id check

CREATE POLICY "users_own_tenants" ON tenants
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 6. Units — owned via building

CREATE POLICY "users_own_units" ON units
  FOR ALL USING (
    building_id IN (SELECT id FROM buildings WHERE user_id = auth.uid())
  );

-- 7. Leases — owned via unit → building

CREATE POLICY "users_own_leases" ON leases
  FOR ALL USING (
    unit_id IN (
      SELECT u.id FROM units u
      JOIN buildings b ON b.id = u.building_id
      WHERE b.user_id = auth.uid()
    )
  );

-- 8. Payments — owned via lease → unit → building

CREATE POLICY "users_own_payments" ON payments
  FOR ALL USING (
    lease_id IN (
      SELECT l.id FROM leases l
      JOIN units u ON u.id = l.unit_id
      JOIN buildings b ON b.id = u.building_id
      WHERE b.user_id = auth.uid()
    )
  );

-- 9. Maintenance requests — owned via unit → building

CREATE POLICY "users_own_maintenance" ON maintenance_requests
  FOR ALL USING (
    unit_id IN (
      SELECT u.id FROM units u
      JOIN buildings b ON b.id = u.building_id
      WHERE b.user_id = auth.uid()
    )
  );
