-- Migration: 20260912130000_freelance_request_alignment.sql
-- Purpose: Fix parameter alignment and enforce strict approval gating for create_freelance_request & respond_to_freelance_request

DROP FUNCTION IF EXISTS public.create_freelance_request(uuid, uuid, text, text[]);

CREATE OR REPLACE FUNCTION public.create_freelance_request(
  p_buyer_user_id uuid,
  p_freelancer_provider_id uuid,
  p_brief text,
  p_reference_file_paths text[] DEFAULT '{}'::text[]
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

  IF NULLIF(TRIM(p_brief), '') IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Project brief is required.');
  END IF;

  -- Check provider exists and is approved freelancer
  SELECT * INTO v_provider FROM public.providers WHERE id = p_freelancer_provider_id AND type = 'freelancer';
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Freelancer provider not found.');
  END IF;

  IF v_provider.status <> 'approved' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot request freelance service from an unapproved freelancer (provider status: ' || v_provider.status || ').');
  END IF;

  SELECT * INTO v_freelancer_profile FROM public.freelancer_profiles WHERE provider_id = p_freelancer_provider_id;
  IF NOT FOUND OR v_freelancer_profile.status <> 'approved' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot request freelance service from an unapproved freelancer (profile status: ' || COALESCE(v_freelancer_profile.status, 'missing') || ').');
  END IF;

  IF v_provider.user_id = p_buyer_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'You cannot send a freelance request to yourself.');
  END IF;

  INSERT INTO public.freelance_requests (
    buyer_user_id,
    freelancer_provider_id,
    brief,
    reference_file_paths,
    status
  ) VALUES (
    p_buyer_user_id,
    p_freelancer_provider_id,
    TRIM(p_brief),
    COALESCE(p_reference_file_paths, '{}'),
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

-- Update respond_to_freelance_request to enforce approval gate on freelancer responses
CREATE OR REPLACE FUNCTION public.respond_to_freelance_request(
  p_user_id uuid,
  p_request_id uuid,
  p_action text,
  p_agreed_price numeric DEFAULT NULL::numeric,
  p_final_file_path text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_req public.freelance_requests%ROWTYPE;
  v_prov public.providers%ROWTYPE;
  v_fp public.freelancer_profiles%ROWTYPE;
  v_is_freelancer boolean := false;
  v_is_buyer boolean := false;
BEGIN
  SELECT * INTO v_req
  FROM public.freelance_requests
  WHERE id = p_request_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request not found.');
  END IF;

  SELECT * INTO v_prov
  FROM public.providers
  WHERE id = v_req.freelancer_provider_id;

  IF v_prov.user_id = p_user_id THEN
    v_is_freelancer := true;
  END IF;

  IF v_req.buyer_user_id = p_user_id THEN
    v_is_buyer := true;
  END IF;

  IF NOT v_is_freelancer AND NOT v_is_buyer THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized.');
  END IF;

  -- If freelancer, ensure they are approved before performing work/accepting
  IF v_is_freelancer THEN
    SELECT * INTO v_fp FROM public.freelancer_profiles WHERE provider_id = v_prov.id;
    IF v_prov.status <> 'approved' OR v_fp.status <> 'approved' THEN
      RETURN jsonb_build_object('success', false, 'error', 'Freelancer profile is not approved. Cannot respond to requests.');
    END IF;
  END IF;

  -- Actions for freelancer
  IF p_action = 'accept' THEN
    IF NOT v_is_freelancer THEN
      RETURN jsonb_build_object('success', false, 'error', 'Only the freelancer can accept this request.');
    END IF;
    IF v_req.status <> 'requested' THEN
      RETURN jsonb_build_object('success', false, 'error', 'Request cannot be accepted in its current status.');
    END IF;
    IF p_agreed_price IS NULL OR p_agreed_price <= 0 THEN
      RETURN jsonb_build_object('success', false, 'error', 'A valid agreed price is required to accept.');
    END IF;

    UPDATE public.freelance_requests
    SET status = 'accepted',
        agreed_price = p_agreed_price,
        updated_at = now()
    WHERE id = p_request_id;

    RETURN jsonb_build_object('success', true, 'status', 'accepted');

  ELSIF p_action = 'start_work' THEN
    IF NOT v_is_freelancer THEN
      RETURN jsonb_build_object('success', false, 'error', 'Only the freelancer can start work.');
    END IF;
    IF v_req.status <> 'accepted' THEN
      RETURN jsonb_build_object('success', false, 'error', 'Request must be accepted before starting work.');
    END IF;

    UPDATE public.freelance_requests
    SET status = 'in_progress',
        updated_at = now()
    WHERE id = p_request_id;

    RETURN jsonb_build_object('success', true, 'status', 'in_progress');

  ELSIF p_action = 'deliver' THEN
    IF NOT v_is_freelancer THEN
      RETURN jsonb_build_object('success', false, 'error', 'Only the freelancer can deliver files.');
    END IF;
    IF v_req.status NOT IN ('accepted', 'in_progress') THEN
      RETURN jsonb_build_object('success', false, 'error', 'Request cannot be delivered in its current status.');
    END IF;
    IF NULLIF(TRIM(p_final_file_path), '') IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Deliverable file path is required.');
    END IF;

    UPDATE public.freelance_requests
    SET status = 'delivered',
        final_file_path = TRIM(p_final_file_path),
        updated_at = now()
    WHERE id = p_request_id;

    RETURN jsonb_build_object('success', true, 'status', 'delivered');

  ELSIF p_action = 'complete' THEN
    IF NOT v_is_buyer THEN
      RETURN jsonb_build_object('success', false, 'error', 'Only the buyer can mark the job completed.');
    END IF;
    IF v_req.status <> 'delivered' THEN
      RETURN jsonb_build_object('success', false, 'error', 'Request can only be completed once delivered.');
    END IF;

    UPDATE public.freelance_requests
    SET status = 'completed',
        updated_at = now()
    WHERE id = p_request_id;

    RETURN jsonb_build_object('success', true, 'status', 'completed');

  ELSIF p_action = 'cancel' THEN
    IF v_req.status IN ('completed', 'cancelled') THEN
      RETURN jsonb_build_object('success', false, 'error', 'Request is already finalized.');
    END IF;

    UPDATE public.freelance_requests
    SET status = 'cancelled',
        updated_at = now()
    WHERE id = p_request_id;

    RETURN jsonb_build_object('success', true, 'status', 'cancelled');

  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Unknown action.');
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.respond_to_freelance_request(uuid, uuid, text, numeric, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.respond_to_freelance_request(uuid, uuid, text, numeric, text) TO service_role;
