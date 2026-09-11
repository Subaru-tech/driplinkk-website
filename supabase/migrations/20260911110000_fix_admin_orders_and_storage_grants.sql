-- Migration: 20260911110000_fix_admin_orders_and_storage_grants.sql
-- Purpose:
--   1. Add assigned_vendor / vendor_notes to mart_orders (used by the admin
--      fulfillment UI but missing from the vendor_marketplace migration).
--   2. Create admin_get_mart_orders RPC (the admin page calls it; only the
--      singular admin_get_mart_order existed).
--   3. Restore anon/authenticated EXECUTE on helper functions that the
--      rpc_security_lockdown migration revoked too broadly:
--        - can_upload_to_storage_folder: invoked from storage RLS policies on
--          every browser upload; without anon/authenticated EXECUTE all
--          Clerk-authenticated uploads fail.
--        - become_seller: called from the browser during seller onboarding.
--   Everything is idempotent and guarded, so it is safe to re-run against a
--   database where the functions live in another repo's migrations.

-- 1. mart_orders admin fulfillment columns ----------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mart_orders' AND column_name = 'assigned_vendor'
  ) THEN
    ALTER TABLE public.mart_orders ADD COLUMN assigned_vendor text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mart_orders' AND column_name = 'vendor_notes'
  ) THEN
    ALTER TABLE public.mart_orders ADD COLUMN vendor_notes text;
  END IF;
END $$;

-- 2. admin_get_mart_orders RPC ----------------------------------------------
-- Returns the flat shape the admin page expects. `buyer` is a jsonb object so
-- PostgREST hands the UI exactly one nested value. Created only if absent so a
-- version managed elsewhere is never clobbered.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'admin_get_mart_orders'
      AND pronamespace = 'public'::regnamespace
  ) THEN
    CREATE OR REPLACE FUNCTION public.admin_get_mart_orders(p_status text DEFAULT NULL)
    RETURNS TABLE (
      id uuid,
      reference text,
      model_name text,
      status text,
      total_inr numeric,
      created_at timestamptz,
      shipping_address text,
      assigned_vendor text,
      vendor_notes text,
      buyer jsonb
    )
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public, auth, pg_temp
    AS $fn$
    BEGIN
      RETURN QUERY
      SELECT
        mo.id,
        'DL-' || upper(substring(mo.id::text from 1 for 6)) AS reference,
        COALESCE(qr.file_path, 'Custom upload') AS model_name,
        mo.status,
        mo.price AS total_inr,
        mo.created_at,
        NULL::text AS shipping_address,
        mo.assigned_vendor,
        mo.vendor_notes,
        jsonb_build_object(
          'id', bp.id,
          'full_name', bp.full_name
        ) AS buyer
      FROM public.mart_orders mo
      LEFT JOIN public.quote_requests qr ON qr.id = mo.quote_request_id
      LEFT JOIN public.profiles bp ON bp.id = mo.buyer_user_id
      WHERE p_status IS NULL OR lower(mo.status) = lower(p_status)
      ORDER BY mo.created_at DESC;
    END;
    $fn$;

    REVOKE EXECUTE ON FUNCTION public.admin_get_mart_orders(text) FROM PUBLIC, anon, authenticated;
    GRANT EXECUTE ON FUNCTION public.admin_get_mart_orders(text) TO service_role;
  END IF;
END $$;

-- 3. Restore helper grants the lockdown revoked too broadly ------------------

DO $$
BEGIN
  -- Storage RLS policies call this on every browser upload.
  IF EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'can_upload_to_storage_folder'
      AND pronamespace = 'public'::regnamespace
  ) THEN
    GRANT EXECUTE ON FUNCTION public.can_upload_to_storage_folder(text) TO anon, authenticated, service_role;
  END IF;

  -- Seller onboarding runs from the browser.
  IF EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'become_seller'
      AND pronamespace = 'public'::regnamespace
  ) THEN
    GRANT EXECUTE ON FUNCTION public.become_seller(text) TO authenticated, service_role;
  END IF;
END $$;
