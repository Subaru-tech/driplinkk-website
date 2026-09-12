-- Migration: 20260912100000_vendor_freelancer_approval_gates.sql
-- Purpose: Implement strict Vendor & Freelancer Approval Gate:
--   1. Add status (pending, approved, rejected) to vendor_profiles and freelancer_profiles.
--   2. Default providers.status to 'pending' (never auto-approved).
--   3. Gate RPCs & directory queries so only 'approved' providers can receive orders/requests or appear publicly.
--   4. Provide admin_review_provider and admin_get_pending_providers RPCs.

-- 1. Alter default on providers.status to 'pending'
ALTER TABLE public.providers 
  ALTER COLUMN status SET DEFAULT 'pending';

-- 2. Add status column to vendor_profiles and freelancer_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'vendor_profiles' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.vendor_profiles 
      ADD COLUMN status text NOT NULL DEFAULT 'pending' 
      CHECK (status IN ('pending', 'approved', 'rejected'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'freelancer_profiles' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.freelancer_profiles 
      ADD COLUMN status text NOT NULL DEFAULT 'pending' 
      CHECK (status IN ('pending', 'approved', 'rejected'));
  END IF;
END $$;

DROP FUNCTION IF EXISTS public.create_freelance_request(uuid, uuid, text, text[]);
DROP FUNCTION IF EXISTS public.create_mart_order(uuid, uuid, uuid, text, numeric);
DROP FUNCTION IF EXISTS public.get_freelance_browse_profiles(text, text, text, integer, integer);
DROP FUNCTION IF EXISTS public.get_freelancer_profile_by_id(uuid);
DROP FUNCTION IF EXISTS public.get_mart_vendor_quotes(numeric, text);


-- Backfill profile status from parent providers table
UPDATE public.vendor_profiles vp
SET status = p.status
FROM public.providers p
WHERE vp.provider_id = p.id;

UPDATE public.freelancer_profiles fp
SET status = p.status
FROM public.providers p
WHERE fp.provider_id = p.id;

-- 3. Atomic RPC: apply_vendor_profile (Fixed to strictly default to 'pending')
CREATE OR REPLACE FUNCTION public.apply_vendor_profile(
  p_user_id uuid,
  p_business_name text,
  p_location text DEFAULT NULL::text,
  p_materials_supported text[] DEFAULT '{}'::text[],
  p_capacity_notes text DEFAULT NULL::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth', 'pg_temp'
AS $$
DECLARE
  v_provider_id uuid;
  v_current_status text := 'pending';
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'User ID is required';
  END IF;

  -- If provider already exists, keep current status if approved, else set to pending
  SELECT id, status INTO v_provider_id, v_current_status
  FROM public.providers
  WHERE user_id = p_user_id AND type = 'vendor';

  IF v_provider_id IS NULL THEN
    INSERT INTO public.providers (user_id, type, status)
    VALUES (p_user_id, 'vendor', 'pending')
    RETURNING id INTO v_provider_id;
    v_current_status := 'pending';
  END IF;

  -- Upsert vendor profile with status
  INSERT INTO public.vendor_profiles (
    provider_id,
    business_name,
    location,
    materials_supported,
    capacity_notes,
    status,
    updated_at
  ) VALUES (
    v_provider_id,
    p_business_name,
    p_location,
    p_materials_supported,
    p_capacity_notes,
    v_current_status,
    now()
  )
  ON CONFLICT (provider_id)
  DO UPDATE SET
    business_name = EXCLUDED.business_name,
    location = EXCLUDED.location,
    materials_supported = EXCLUDED.materials_supported,
    capacity_notes = EXCLUDED.capacity_notes,
    updated_at = now();

  RETURN v_provider_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.apply_vendor_profile(uuid, text, text, text[], text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_vendor_profile(uuid, text, text, text[], text) TO service_role;

-- 4. Atomic RPC: register_freelancer_profile (Fixed to strictly default to 'pending')
CREATE OR REPLACE FUNCTION public.register_freelancer_profile(
  p_user_id uuid,
  p_display_name text,
  p_bio text,
  p_skills text[],
  p_portfolio_urls text[],
  p_rate_type text,
  p_base_rate numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_provider_id uuid;
  v_existing_provider public.providers%ROWTYPE;
  v_status text := 'pending';
BEGIN
  IF p_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User ID is required.');
  END IF;

  IF NULLIF(TRIM(p_display_name), '') IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Display name is required.');
  END IF;

  IF p_rate_type NOT IN ('hourly', 'fixed') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Rate type must be hourly or fixed.');
  END IF;

  IF p_base_rate IS NULL OR p_base_rate < 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Base rate must be non-negative.');
  END IF;

  SELECT * INTO v_existing_provider
  FROM public.providers
  WHERE user_id = p_user_id AND type = 'freelancer';

  IF FOUND THEN
    v_provider_id := v_existing_provider.id;
    -- Do NOT auto-approve. Preserve existing approved status if already approved, otherwise pending
    IF v_existing_provider.status = 'approved' THEN
      v_status := 'approved';
    ELSE
      v_status := 'pending';
    END IF;

    UPDATE public.providers
    SET status = v_status
    WHERE id = v_provider_id;

    INSERT INTO public.freelancer_profiles (
      provider_id, display_name, bio, skills, portfolio_urls, rate_type, base_rate, status, updated_at
    ) VALUES (
      v_provider_id,
      TRIM(p_display_name),
      NULLIF(TRIM(p_bio), ''),
      COALESCE(p_skills, '{}'),
      COALESCE(p_portfolio_urls, '{}'),
      p_rate_type,
      p_base_rate,
      v_status,
      now()
    )
    ON CONFLICT (provider_id) DO UPDATE SET
      display_name = EXCLUDED.display_name,
      bio = EXCLUDED.bio,
      skills = EXCLUDED.skills,
      portfolio_urls = EXCLUDED.portfolio_urls,
      rate_type = EXCLUDED.rate_type,
      base_rate = EXCLUDED.base_rate,
      updated_at = now();
  ELSE
    INSERT INTO public.providers (user_id, type, status)
    VALUES (p_user_id, 'freelancer', 'pending')
    RETURNING id INTO v_provider_id;

    INSERT INTO public.freelancer_profiles (
      provider_id, display_name, bio, skills, portfolio_urls, rate_type, base_rate, status, updated_at
    ) VALUES (
      v_provider_id,
      TRIM(p_display_name),
      NULLIF(TRIM(p_bio), ''),
      COALESCE(p_skills, '{}'),
      COALESCE(p_portfolio_urls, '{}'),
      p_rate_type,
      p_base_rate,
      'pending',
      now()
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'provider_id', v_provider_id,
    'status', v_status,
    'message', 'Freelancer profile submitted for review.'
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.register_freelancer_profile(uuid, text, text, text[], text[], text, numeric) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_freelancer_profile(uuid, text, text, text[], text[], text, numeric) TO service_role;

-- 5. Admin Review Provider RPC
CREATE OR REPLACE FUNCTION public.admin_review_provider(
  p_provider_id uuid,
  p_status text,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_provider public.providers%ROWTYPE;
BEGIN
  IF p_status NOT IN ('approved', 'rejected', 'pending') THEN
    RAISE EXCEPTION 'Invalid status: %. Must be approved, rejected, or pending.', p_status;
  END IF;

  SELECT * INTO v_provider FROM public.providers WHERE id = p_provider_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Provider not found with ID: %', p_provider_id;
  END IF;

  UPDATE public.providers
  SET status = p_status
  WHERE id = p_provider_id;

  IF v_provider.type = 'vendor' THEN
    UPDATE public.vendor_profiles
    SET status = p_status, updated_at = now()
    WHERE provider_id = p_provider_id;
  ELSIF v_provider.type = 'freelancer' THEN
    UPDATE public.freelancer_profiles
    SET status = p_status, updated_at = now()
    WHERE provider_id = p_provider_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'provider_id', p_provider_id,
    'status', p_status,
    'notes', p_notes
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_review_provider(uuid, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_review_provider(uuid, text, text) TO service_role;

-- 6. Admin Get Pending Providers RPC
CREATE OR REPLACE FUNCTION public.admin_get_pending_providers(
  p_type text DEFAULT NULL
)
RETURNS TABLE (
  provider_id uuid,
  user_id uuid,
  type text,
  status text,
  created_at timestamptz,
  applicant_name text,
  applicant_email text,
  details jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pr.id AS provider_id,
    pr.user_id,
    pr.type,
    pr.status,
    pr.created_at,
    COALESCE(prof.full_name, 'Unknown Applicant') AS applicant_name,
    COALESCE(u.email, prof.email, 'No email') AS applicant_email,
    CASE 
      WHEN pr.type = 'vendor' THEN
        jsonb_build_object(
          'business_name', vp.business_name,
          'location', vp.location,
          'materials_supported', vp.materials_supported,
          'capacity_notes', vp.capacity_notes,
          'profile_status', vp.status
        )
      WHEN pr.type = 'freelancer' THEN
        jsonb_build_object(
          'display_name', fp.display_name,
          'bio', fp.bio,
          'skills', fp.skills,
          'portfolio_urls', fp.portfolio_urls,
          'rate_type', fp.rate_type,
          'base_rate', fp.base_rate,
          'profile_status', fp.status
        )
      ELSE '{}'::jsonb
    END AS details
  FROM public.providers pr
  LEFT JOIN public.profiles prof ON prof.id = pr.user_id
  LEFT JOIN auth.users u ON u.id = pr.user_id
  LEFT JOIN public.vendor_profiles vp ON vp.provider_id = pr.id
  LEFT JOIN public.freelancer_profiles fp ON fp.provider_id = pr.id
  WHERE (p_type IS NULL OR pr.type = p_type)
  ORDER BY 
    CASE WHEN pr.status = 'pending' THEN 0 ELSE 1 END,
    pr.created_at DESC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_get_pending_providers(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_pending_providers(text) TO service_role;

-- 7. Hardened Gate: create_mart_order (Vendor must have status = 'approved' on both provider & profile)
CREATE OR REPLACE FUNCTION public.create_mart_order(
  p_buyer_user_id uuid,
  p_quote_request_id uuid,
  p_provider_id uuid,
  p_material text,
  p_price numeric
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth', 'pg_temp'
AS $$
DECLARE
  v_provider public.providers%ROWTYPE;
  v_vendor_profile public.vendor_profiles%ROWTYPE;
  v_order_id uuid;
BEGIN
  -- Verify provider is an approved vendor
  SELECT * INTO v_provider FROM public.providers WHERE id = p_provider_id AND type = 'vendor';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Vendor provider not found';
  END IF;

  IF v_provider.status <> 'approved' THEN
    RAISE EXCEPTION 'Cannot place order with unapproved vendor (provider status: %)', v_provider.status;
  END IF;

  SELECT * INTO v_vendor_profile FROM public.vendor_profiles WHERE provider_id = p_provider_id;
  IF NOT FOUND OR v_vendor_profile.status <> 'approved' THEN
    RAISE EXCEPTION 'Cannot place order with unapproved vendor (profile status: %)', COALESCE(v_vendor_profile.status, 'none');
  END IF;

  IF v_provider.user_id = p_buyer_user_id THEN
    RAISE EXCEPTION 'You cannot order from your own print hub';
  END IF;

  -- Verify quote request exists and belongs to buyer
  IF NOT EXISTS (SELECT 1 FROM public.quote_requests WHERE id = p_quote_request_id AND user_id = p_buyer_user_id) THEN
    RAISE EXCEPTION 'Invalid quote request';
  END IF;

  INSERT INTO public.mart_orders (
    quote_request_id,
    buyer_user_id,
    provider_id,
    price,
    material,
    status
  ) VALUES (
    p_quote_request_id,
    p_buyer_user_id,
    p_provider_id,
    p_price,
    p_material,
    'placed'
  ) RETURNING id INTO v_order_id;

  RETURN v_order_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_mart_order(uuid, uuid, uuid, text, numeric) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_mart_order(uuid, uuid, uuid, text, numeric) TO service_role;

-- 8. Hardened Gate: create_freelance_request (Freelancer must have status = 'approved' on both provider & profile)
CREATE OR REPLACE FUNCTION public.create_freelance_request(
  p_buyer_user_id uuid,
  p_provider_id uuid,
  p_scope_description text,
  p_reference_files text[] DEFAULT '{}'::text[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_provider public.providers%ROWTYPE;
  v_freelancer_profile public.freelancer_profiles%ROWTYPE;
  v_request_id uuid;
BEGIN
  IF p_buyer_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Buyer user ID is required.');
  END IF;

  IF NULLIF(TRIM(p_scope_description), '') IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Scope description is required.');
  END IF;

  -- Check provider exists and is approved freelancer
  SELECT * INTO v_provider FROM public.providers WHERE id = p_provider_id AND type = 'freelancer';
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Freelancer provider not found.');
  END IF;

  IF v_provider.status <> 'approved' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot request freelance service from an unapproved freelancer.');
  END IF;

  SELECT * INTO v_freelancer_profile FROM public.freelancer_profiles WHERE provider_id = p_provider_id;
  IF NOT FOUND OR v_freelancer_profile.status <> 'approved' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot request freelance service from an unapproved freelancer.');
  END IF;

  IF v_provider.user_id = p_buyer_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'You cannot send a freelance request to yourself.');
  END IF;

  INSERT INTO public.freelance_requests (
    buyer_user_id,
    provider_id,
    scope_description,
    reference_files,
    status
  ) VALUES (
    p_buyer_user_id,
    p_provider_id,
    TRIM(p_scope_description),
    COALESCE(p_reference_files, '{}'),
    'requested'
  ) RETURNING id INTO v_request_id;

  RETURN jsonb_build_object(
    'success', true,
    'request_id', v_request_id,
    'message', 'Freelance request created successfully.'
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_freelance_request(uuid, uuid, text, text[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_freelance_request(uuid, uuid, text, text[]) TO service_role;

-- 9. Hardened Public Directory: get_freelance_browse_profiles (Strictly status = 'approved')
CREATE OR REPLACE FUNCTION public.get_freelance_browse_profiles(
  p_search text DEFAULT NULL::text,
  p_rate_type text DEFAULT NULL::text,
  p_skill text DEFAULT NULL::text,
  p_page integer DEFAULT 1,
  p_page_size integer DEFAULT 12
)
RETURNS TABLE (
  provider_id uuid,
  user_id uuid,
  display_name text,
  bio text,
  skills text[],
  portfolio_urls text[],
  rate_type text,
  base_rate numeric,
  avatar_url text,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_offset integer := (GREATEST(p_page, 1) - 1) * p_page_size;
  v_clean_search text := NULLIF(TRIM(p_search), '');
  v_clean_rate_type text := NULLIF(TRIM(p_rate_type), '');
  v_clean_skill text := NULLIF(TRIM(p_skill), '');
BEGIN
  RETURN QUERY
  WITH filtered AS (
    SELECT 
      pr.id AS provider_id,
      pr.user_id,
      fp.display_name,
      fp.bio,
      fp.skills,
      fp.portfolio_urls,
      fp.rate_type,
      fp.base_rate,
      prof.avatar_url,
      COUNT(*) OVER() AS total_count
    FROM public.providers pr
    JOIN public.freelancer_profiles fp ON fp.provider_id = pr.id
    LEFT JOIN public.profiles prof ON prof.id = pr.user_id
    WHERE pr.type = 'freelancer'
      AND pr.status = 'approved'
      AND fp.status = 'approved'
      AND (v_clean_rate_type IS NULL OR fp.rate_type = v_clean_rate_type)
      AND (v_clean_skill IS NULL OR v_clean_skill = ANY(fp.skills))
      AND (
        v_clean_search IS NULL OR
        fp.display_name ILIKE '%' || v_clean_search || '%' OR
        fp.bio ILIKE '%' || v_clean_search || '%'
      )
  )
  SELECT 
    f.provider_id,
    f.user_id,
    f.display_name,
    f.bio,
    f.skills,
    f.portfolio_urls,
    f.rate_type,
    f.base_rate,
    f.avatar_url,
    f.total_count
  FROM filtered f
  ORDER BY f.base_rate ASC
  LIMIT p_page_size
  OFFSET v_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_freelance_browse_profiles(text, text, text, integer, integer) TO anon, authenticated, service_role;

-- 10. Hardened Single Profile: get_freelancer_profile_by_id (Approved or owner)
CREATE OR REPLACE FUNCTION public.get_freelancer_profile_by_id(p_provider_id uuid)
RETURNS TABLE (
  provider_id uuid,
  user_id uuid,
  display_name text,
  bio text,
  skills text[],
  portfolio_urls text[],
  rate_type text,
  base_rate numeric,
  avatar_url text,
  status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pr.id AS provider_id,
    pr.user_id,
    fp.display_name,
    fp.bio,
    fp.skills,
    fp.portfolio_urls,
    fp.rate_type,
    fp.base_rate,
    prof.avatar_url,
    pr.status
  FROM public.providers pr
  JOIN public.freelancer_profiles fp ON fp.provider_id = pr.id
  LEFT JOIN public.profiles prof ON prof.id = pr.user_id
  WHERE pr.id = p_provider_id
    AND pr.type = 'freelancer'
    AND (pr.status = 'approved' OR pr.user_id = auth.uid());
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_freelancer_profile_by_id(uuid) TO anon, authenticated, service_role;

-- 11. Hardened Quotes Calculation: get_mart_vendor_quotes (Only approved vendors)
CREATE OR REPLACE FUNCTION public.get_mart_vendor_quotes(
  p_weight_g numeric,
  p_material text
)
RETURNS TABLE (
  provider_id uuid,
  business_name text,
  location text,
  material text,
  price numeric,
  delivery_days integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pr.id AS provider_id,
    vp.business_name,
    vp.location,
    p_material AS material,
    ROUND((p_weight_g * 4.5)::numeric, 2) AS price,
    3 AS delivery_days
  FROM public.providers pr
  JOIN public.vendor_profiles vp ON vp.provider_id = pr.id
  WHERE pr.type = 'vendor'
    AND pr.status = 'approved'
    AND vp.status = 'approved'
    AND (
      cardinality(vp.materials_supported) = 0 
      OR p_material = ANY(vp.materials_supported)
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_mart_vendor_quotes(numeric, text) TO anon, authenticated, service_role;
