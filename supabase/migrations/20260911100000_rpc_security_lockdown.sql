-- Migration: 20260911100000_rpc_security_lockdown.sql
-- Purpose: Security remediation to revoke execution privileges from public/anon/authenticated
--          on all mutating and private-data SECURITY DEFINER RPCs, granting access strictly
--          to the service_role for server-side verification.

-- 1. Mart & Vendor RPCs
REVOKE EXECUTE ON FUNCTION public.create_mart_order(uuid, uuid, uuid, text, numeric) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_mart_order(uuid, uuid, uuid, text, numeric) TO service_role;
ALTER FUNCTION public.create_mart_order(uuid, uuid, uuid, text, numeric) SET search_path = public, auth, pg_temp;

REVOKE EXECUTE ON FUNCTION public.respond_to_mart_order(uuid, uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.respond_to_mart_order(uuid, uuid, text) TO service_role;
ALTER FUNCTION public.respond_to_mart_order(uuid, uuid, text) SET search_path = public, auth, pg_temp;

REVOKE EXECUTE ON FUNCTION public.create_quote_request(uuid, text, text, numeric) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_quote_request(uuid, text, text, numeric) TO service_role;
ALTER FUNCTION public.create_quote_request(uuid, text, text, numeric) SET search_path = public, auth, pg_temp;

REVOKE EXECUTE ON FUNCTION public.apply_vendor_profile(uuid, text, text, text[], text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_vendor_profile(uuid, text, text, text[], text) TO service_role;
ALTER FUNCTION public.apply_vendor_profile(uuid, text, text, text[], text) SET search_path = public, auth, pg_temp;

REVOKE EXECUTE ON FUNCTION public.get_mart_orders_for_user(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_mart_orders_for_user(uuid, text) TO service_role;
ALTER FUNCTION public.get_mart_orders_for_user(uuid, text) SET search_path = public, auth, pg_temp;

-- 2. Freelance Marketplace RPCs
REVOKE EXECUTE ON FUNCTION public.register_freelancer_profile(uuid, text, text, text[], text[], text, numeric) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_freelancer_profile(uuid, text, text, text[], text[], text, numeric) TO service_role;
ALTER FUNCTION public.register_freelancer_profile(uuid, text, text, text[], text[], text, numeric) SET search_path = public, auth, pg_temp;

REVOKE EXECUTE ON FUNCTION public.create_freelance_request(uuid, uuid, text, text[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_freelance_request(uuid, uuid, text, text[]) TO service_role;
ALTER FUNCTION public.create_freelance_request(uuid, uuid, text, text[]) SET search_path = public, auth, pg_temp;

REVOKE EXECUTE ON FUNCTION public.respond_to_freelance_request(uuid, uuid, text, numeric, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.respond_to_freelance_request(uuid, uuid, text, numeric, text) TO service_role;
ALTER FUNCTION public.respond_to_freelance_request(uuid, uuid, text, numeric, text) SET search_path = public, auth, pg_temp;

REVOKE EXECUTE ON FUNCTION public.get_freelance_requests_for_user(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_freelance_requests_for_user(uuid, text) TO service_role;
ALTER FUNCTION public.get_freelance_requests_for_user(uuid, text) SET search_path = public, auth, pg_temp;

-- 3. Models, Claims & Storage Access RPCs
REVOKE EXECUTE ON FUNCTION public.claim_model_acquisition(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_model_acquisition(uuid, uuid) TO service_role;
ALTER FUNCTION public.claim_model_acquisition(uuid, uuid) SET search_path = public, auth, pg_temp;

REVOKE EXECUTE ON FUNCTION public.get_user_model_acquisitions(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_model_acquisitions(uuid) TO service_role;
ALTER FUNCTION public.get_user_model_acquisitions(uuid) SET search_path = public, auth, pg_temp;

REVOKE EXECUTE ON FUNCTION public.can_user_access_model_file(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.can_user_access_model_file(uuid, uuid) TO service_role;
ALTER FUNCTION public.can_user_access_model_file(uuid, uuid) SET search_path = public, auth, pg_temp;

REVOKE EXECUTE ON FUNCTION public.can_upload_to_storage_folder(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.can_upload_to_storage_folder(text) TO service_role;
ALTER FUNCTION public.can_upload_to_storage_folder(text) SET search_path = public, auth, pg_temp;

REVOKE EXECUTE ON FUNCTION public.sync_clerk_user_profile(text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_clerk_user_profile(text, text, text) TO service_role;
ALTER FUNCTION public.sync_clerk_user_profile(text, text, text) SET search_path = public, auth, pg_temp;

REVOKE EXECUTE ON FUNCTION public.become_seller(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.become_seller(text) TO service_role;
ALTER FUNCTION public.become_seller(text) SET search_path = public, auth, pg_temp;

REVOKE EXECUTE ON FUNCTION public.user_role(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.user_role(uuid) TO service_role;
ALTER FUNCTION public.user_role(uuid) SET search_path = public, auth, pg_temp;

-- 4. Admin RPCs
REVOKE EXECUTE ON FUNCTION public.admin_approve_vendor_and_set_pricing(text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_approve_vendor_and_set_pricing(text, jsonb) TO service_role;
ALTER FUNCTION public.admin_approve_vendor_and_set_pricing(text, jsonb) SET search_path = public, auth, pg_temp;

REVOKE EXECUTE ON FUNCTION public.admin_approve_vendor_and_set_pricing(uuid, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_approve_vendor_and_set_pricing(uuid, jsonb) TO service_role;
ALTER FUNCTION public.admin_approve_vendor_and_set_pricing(uuid, jsonb) SET search_path = public, auth, pg_temp;

REVOKE EXECUTE ON FUNCTION public.admin_update_mart_order(uuid, text, text, public.order_status) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_mart_order(uuid, text, text, public.order_status) TO service_role;
ALTER FUNCTION public.admin_update_mart_order(uuid, text, text, public.order_status) SET search_path = public, auth, pg_temp;

REVOKE EXECUTE ON FUNCTION public.admin_update_listing_status(uuid, public.listing_status) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_listing_status(uuid, public.listing_status) TO service_role;
ALTER FUNCTION public.admin_update_listing_status(uuid, public.listing_status) SET search_path = public, auth, pg_temp;

REVOKE EXECUTE ON FUNCTION public.admin_get_mart_order(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_mart_order(uuid) TO service_role;
ALTER FUNCTION public.admin_get_mart_order(uuid) SET search_path = public, auth, pg_temp;

REVOKE EXECUTE ON FUNCTION public.admin_get_pending_listings() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_pending_listings() TO service_role;
ALTER FUNCTION public.admin_get_pending_listings() SET search_path = public, auth, pg_temp;

-- 5. Explicitly reaffirm public read RPCs remain accessible to anon and authenticated
GRANT EXECUTE ON FUNCTION public.get_mart_vendor_quotes(numeric, text) TO anon, authenticated, service_role;
ALTER FUNCTION public.get_mart_vendor_quotes(numeric, text) SET search_path = public, auth, pg_temp;

GRANT EXECUTE ON FUNCTION public.get_marketplace_models(text, text, text, text, integer, integer) TO anon, authenticated, service_role;
ALTER FUNCTION public.get_marketplace_models(text, text, text, text, integer, integer) SET search_path = public, auth, pg_temp;

GRANT EXECUTE ON FUNCTION public.get_marketplace_model_by_id(uuid) TO anon, authenticated, service_role;
ALTER FUNCTION public.get_marketplace_model_by_id(uuid) SET search_path = public, auth, pg_temp;

GRANT EXECUTE ON FUNCTION public.get_freelance_browse_profiles(text, text, text, integer, integer) TO anon, authenticated, service_role;
ALTER FUNCTION public.get_freelance_browse_profiles(text, text, text, integer, integer) SET search_path = public, auth, pg_temp;

GRANT EXECUTE ON FUNCTION public.get_freelancer_profile_by_id(uuid) TO anon, authenticated, service_role;
ALTER FUNCTION public.get_freelancer_profile_by_id(uuid) SET search_path = public, auth, pg_temp;
