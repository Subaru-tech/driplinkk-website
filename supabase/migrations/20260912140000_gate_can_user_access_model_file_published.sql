-- Migration: 20260912140000_gate_can_user_access_model_file_published.sql
-- Purpose: Enforce that models with status != 'published' can NEVER receive download authorization
--          through can_user_access_model_file, even for the model's creator.

CREATE OR REPLACE FUNCTION public.can_user_access_model_file(
  p_user_id uuid,
  p_model_id uuid,
  p_file_id uuid DEFAULT NULL::uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_model public.models%ROWTYPE;
BEGIN
  SELECT * INTO v_model FROM public.models WHERE id = p_model_id;
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- GATING RULE: A model with status <> 'published' can NEVER be accessed
  -- through this public entitlement/download path, even by its own creator.
  IF v_model.status <> 'published' THEN
    RETURN false;
  END IF;

  -- 1. Check if user is the creator / owner of the model
  IF v_model.owner_id = p_user_id OR v_model.seller_user_id = p_user_id THEN
    RETURN true;
  END IF;

  -- 2. Check if user has an active acquisition
  IF EXISTS (
    SELECT 1 FROM public.model_acquisitions
    WHERE user_id = p_user_id AND model_id = p_model_id AND status = 'active'
  ) THEN
    -- If a specific file_id was requested, confirm it belongs to the model
    IF p_file_id IS NOT NULL THEN
      RETURN EXISTS (
        SELECT 1 FROM public.model_files
        WHERE id = p_file_id AND model_id = p_model_id
      );
    END IF;
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.can_user_access_model_file(uuid, uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.can_user_access_model_file(uuid, uuid, uuid) TO service_role;
