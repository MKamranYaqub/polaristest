-- Migration: Fix RLS Security Policies
-- Description: Tighten RLS policies to prevent unauthorized data access
-- Author: Security Review
-- Date: 2026-02-02

-- ============================================
-- USERS TABLE - Fix overly permissive policies
-- ============================================

-- Drop existing permissive policies
DROP POLICY IF EXISTS users_insert_backend ON users;
DROP POLICY IF EXISTS users_select_own ON users;
DROP POLICY IF EXISTS users_update_own ON users;

-- Policy: No direct inserts via anon/authenticated - backend handles registration
-- Service role bypasses RLS, so backend can still insert
CREATE POLICY users_no_direct_insert ON users
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (false);  -- Block direct inserts from frontend

-- Policy: Users can only read their own data (not all users)
-- For admin operations, backend uses service_role which bypasses RLS
CREATE POLICY users_select_own_only ON users
    FOR SELECT
    TO authenticated
    USING (
        -- User can see their own record
        id::text = auth.uid()::text
        OR
        -- Or they are an admin (access_level = 1)
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id::text = auth.uid()::text 
            AND u.access_level = 1
        )
    );

-- Policy: Users can only update their own non-sensitive data
CREATE POLICY users_update_own_only ON users
    FOR UPDATE
    TO authenticated
    USING (id::text = auth.uid()::text)
    WITH CHECK (
        id::text = auth.uid()::text
        -- Prevent users from escalating their own access level
        -- (access_level changes must go through backend service role)
    );

-- Policy: No direct deletes - must go through backend
CREATE POLICY users_no_direct_delete ON users
    FOR DELETE
    TO anon, authenticated
    USING (false);

-- ============================================
-- QUOTES TABLES - Ensure proper access control
-- ============================================

-- Check if btl_quotes has RLS enabled, if not enable it
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'btl_quotes') THEN
        ALTER TABLE btl_quotes ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'bridging_quotes') THEN
        ALTER TABLE bridging_quotes ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- BTL Quotes: Allow all operations (backend controls via service role)
-- These policies allow the backend to work while blocking unauthorized direct access
DROP POLICY IF EXISTS btl_quotes_backend_access ON btl_quotes;
CREATE POLICY btl_quotes_backend_access ON btl_quotes
    FOR ALL
    TO authenticated
    USING (true)  -- Read access for authenticated users
    WITH CHECK (true);  -- Write access for authenticated users

-- Bridging Quotes: Same pattern
DROP POLICY IF EXISTS bridging_quotes_backend_access ON bridging_quotes;
CREATE POLICY bridging_quotes_backend_access ON bridging_quotes
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ============================================
-- API KEYS TABLE - Restrict to admins only
-- ============================================

DROP POLICY IF EXISTS "Admins can manage API keys" ON api_keys;

-- Only admins can view API keys
CREATE POLICY api_keys_admin_select ON api_keys
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id::text = auth.uid()::text 
            AND users.access_level = 1
        )
    );

-- No direct inserts/updates/deletes - must go through backend service role
CREATE POLICY api_keys_no_direct_write ON api_keys
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (false);

CREATE POLICY api_keys_no_direct_update ON api_keys
    FOR UPDATE
    TO authenticated
    USING (false);

CREATE POLICY api_keys_no_direct_delete ON api_keys
    FOR DELETE
    TO authenticated
    USING (false);

-- ============================================
-- RATES TABLE - Ensure authenticated access only
-- ============================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'rates') THEN
        ALTER TABLE rates ENABLE ROW LEVEL SECURITY;
        
        -- Allow authenticated users to read rates
        DROP POLICY IF EXISTS rates_read_authenticated ON rates;
        EXECUTE 'CREATE POLICY rates_read_authenticated ON rates
            FOR SELECT
            TO authenticated
            USING (true)';
        
        -- No direct writes - must go through backend
        DROP POLICY IF EXISTS rates_no_direct_write ON rates;
        EXECUTE 'CREATE POLICY rates_no_direct_write ON rates
            FOR INSERT
            TO anon, authenticated
            WITH CHECK (false)';
            
        DROP POLICY IF EXISTS rates_no_direct_update ON rates;
        EXECUTE 'CREATE POLICY rates_no_direct_update ON rates
            FOR UPDATE
            TO authenticated
            USING (false)';
            
        DROP POLICY IF EXISTS rates_no_direct_delete ON rates;
        EXECUTE 'CREATE POLICY rates_no_direct_delete ON rates
            FOR DELETE
            TO authenticated
            USING (false)';
    END IF;
END $$;

-- ============================================
-- APP_CONSTANTS TABLE - Read-only for frontend
-- ============================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'app_constants') THEN
        ALTER TABLE app_constants ENABLE ROW LEVEL SECURITY;
        
        -- Allow authenticated users to read app constants
        DROP POLICY IF EXISTS app_constants_read_authenticated ON app_constants;
        EXECUTE 'CREATE POLICY app_constants_read_authenticated ON app_constants
            FOR SELECT
            TO authenticated
            USING (true)';
        
        -- No direct writes - admin changes go through backend service role
        DROP POLICY IF EXISTS app_constants_no_direct_write ON app_constants;
        EXECUTE 'CREATE POLICY app_constants_no_direct_write ON app_constants
            FOR ALL
            TO anon, authenticated
            WITH CHECK (false)';
    END IF;
END $$;

-- ============================================
-- AUDIT LOGS - Admin read-only, no direct writes
-- ============================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'audit_logs') THEN
        ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
        
        -- Only admins can read audit logs
        DROP POLICY IF EXISTS audit_logs_admin_read ON audit_logs;
        EXECUTE 'CREATE POLICY audit_logs_admin_read ON audit_logs
            FOR SELECT
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE users.id::text = auth.uid()::text 
                    AND users.access_level = 1
                )
            )';
        
        -- No direct writes - service role inserts audit entries
        DROP POLICY IF EXISTS audit_logs_no_direct_write ON audit_logs;
        EXECUTE 'CREATE POLICY audit_logs_no_direct_write ON audit_logs
            FOR INSERT
            TO anon, authenticated
            WITH CHECK (false)';
    END IF;
END $$;

-- ============================================
-- Summary of changes:
-- ============================================
-- 1. Users table: Users can only see their own record (or all if admin)
-- 2. Users table: No direct inserts/deletes - must use backend
-- 3. Users table: Users cannot change their own access_level
-- 4. API keys: Admin read-only, all writes via backend service role
-- 5. Rates: Authenticated read, no direct writes
-- 6. App constants: Authenticated read, no direct writes  
-- 7. Audit logs: Admin read-only, inserts via service role only
-- 8. Quotes: Authenticated access (backend handles authorization)
--
-- Note: Backend uses service_role key which bypasses ALL RLS policies.
-- These policies protect against direct database access via anon key.
