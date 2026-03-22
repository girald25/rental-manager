-- ============================================================
-- Row Level Security setup
-- Run this AFTER schema.sql in the Supabase SQL editor.
-- ============================================================

-- 1. Add user_id to root-level tables
ALTER TABLE buildings
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) DEFAULT auth.uid();

-- 2. Add financial columns to buildings
ALTER TABLE buildings ADD COLUMN IF NOT EXISTS investment_value numeric(12,2);
ALTER TABLE buildings ADD COLUMN IF NOT EXISTS market_value numeric(12,2);

-- 3. Enable RLS on every table
ALTER TABLE buildings             ENABLE ROW LEVEL SECURITY;
ALTER TABLE units                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants               ENABLE ROW LEVEL SECURITY;
ALTER TABLE leases                ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments              ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_requests  ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses              ENABLE ROW LEVEL SECURITY;
ALTER TABLE other_income          ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents             ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects              ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_notes         ENABLE ROW LEVEL SECURITY;

-- 4. Drop old policies (safe to re-run)
DROP POLICY IF EXISTS "users_own_buildings"    ON buildings;
DROP POLICY IF EXISTS "users_own_tenants"      ON tenants;
DROP POLICY IF EXISTS "users_own_units"        ON units;
DROP POLICY IF EXISTS "users_own_leases"       ON leases;
DROP POLICY IF EXISTS "users_own_payments"     ON payments;
DROP POLICY IF EXISTS "users_own_maintenance"  ON maintenance_requests;
DROP POLICY IF EXISTS "users_own_expenses"      ON expenses;
DROP POLICY IF EXISTS "users_own_other_income"  ON other_income;
DROP POLICY IF EXISTS "users_own_documents"     ON documents;
DROP POLICY IF EXISTS "users_own_projects"      ON projects;
DROP POLICY IF EXISTS "users_own_project_notes" ON project_notes;

-- 5. Buildings — direct user_id
CREATE POLICY "users_own_buildings" ON buildings
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 6. Tenants — direct user_id
CREATE POLICY "users_own_tenants" ON tenants
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 7. Units — via building
CREATE POLICY "users_own_units" ON units
  FOR ALL USING (
    building_id IN (SELECT id FROM buildings WHERE user_id = auth.uid())
  );

-- 8. Leases — via unit → building
CREATE POLICY "users_own_leases" ON leases
  FOR ALL USING (
    unit_id IN (
      SELECT u.id FROM units u
      JOIN buildings b ON b.id = u.building_id
      WHERE b.user_id = auth.uid()
    )
  );

-- 9. Payments — via lease → unit → building
CREATE POLICY "users_own_payments" ON payments
  FOR ALL USING (
    lease_id IN (
      SELECT l.id FROM leases l
      JOIN units u ON u.id = l.unit_id
      JOIN buildings b ON b.id = u.building_id
      WHERE b.user_id = auth.uid()
    )
  );

-- 10. Maintenance — via unit → building
CREATE POLICY "users_own_maintenance" ON maintenance_requests
  FOR ALL USING (
    unit_id IN (
      SELECT u.id FROM units u
      JOIN buildings b ON b.id = u.building_id
      WHERE b.user_id = auth.uid()
    )
  );

-- 11. Expenses — direct user_id
CREATE POLICY "users_own_expenses" ON expenses
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 12. Other Income — direct user_id
CREATE POLICY "users_own_other_income" ON other_income
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 13. Documents — direct user_id
CREATE POLICY "users_own_documents" ON documents
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 14. Projects — direct user_id
CREATE POLICY "users_own_projects" ON projects
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 15. Project notes — via project → user_id
CREATE POLICY "users_own_project_notes" ON project_notes
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );
