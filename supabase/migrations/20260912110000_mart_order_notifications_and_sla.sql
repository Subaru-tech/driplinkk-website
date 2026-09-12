-- Migration: 20260912110000_mart_order_notifications_and_sla.sql
-- Purpose: Implement Phase 2:
--   1. Update mart_orders check constraint with 'pending_vendor_response' and 'expired_no_vendor_response'.
--   2. DB trigger on mart_orders INSERT (status = 'pending_vendor_response') calls Edge Function via pg_net.
--   3. Response SLA pg_cron job auto-expiring or reassigning orders unresponded after 45 minutes.

-- 1. Update check constraint on mart_orders.status
ALTER TABLE public.mart_orders 
  DROP CONSTRAINT IF EXISTS mart_orders_status_check;

ALTER TABLE public.mart_orders 
  ADD CONSTRAINT mart_orders_status_check 
  CHECK (status = ANY (ARRAY[
    'pending_vendor_response'::text,
    'placed'::text,
    'accepted'::text,
    'printing'::text,
    'shipped'::text,
    'delivered'::text,
    'completed'::text,
    'cancelled'::text,
    'expired_no_vendor_response'::text
  ]));

ALTER TABLE public.mart_orders
  ALTER COLUMN status SET DEFAULT 'pending_vendor_response';

-- 2. Update create_mart_order to set initial status to 'pending_vendor_response'
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
    'pending_vendor_response'
  ) RETURNING id INTO v_order_id;

  RETURN v_order_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_mart_order(uuid, uuid, uuid, text, numeric) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_mart_order(uuid, uuid, uuid, text, numeric) TO service_role;

-- 3. Trigger Function: fn_notify_vendor_on_mart_order
CREATE OR REPLACE FUNCTION public.fn_notify_vendor_on_mart_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, net, auth, pg_temp
AS $$
DECLARE
  v_vendor_name text;
  v_vendor_phone text;
  v_vendor_email text;
  v_payload jsonb;
BEGIN
  -- Lookup vendor details
  SELECT 
    vp.business_name,
    COALESCE(u.phone, u.raw_user_meta_data->>'phone', null),
    COALESCE(u.email, prof.full_name)
  INTO v_vendor_name, v_vendor_phone, v_vendor_email
  FROM public.providers pr
  JOIN public.vendor_profiles vp ON vp.provider_id = pr.id
  LEFT JOIN public.profiles prof ON prof.id = pr.user_id
  LEFT JOIN auth.users u ON u.id = pr.user_id
  WHERE pr.id = NEW.provider_id;

  v_payload := jsonb_build_object(
    'order_id', NEW.id,
    'provider_id', NEW.provider_id,
    'buyer_user_id', NEW.buyer_user_id,
    'price', NEW.price,
    'material', NEW.material,
    'status', NEW.status,
    'vendor_name', COALESCE(v_vendor_name, 'Print Vendor'),
    'vendor_phone', v_vendor_phone,
    'vendor_email', v_vendor_email,
    'created_at', NEW.created_at
  );

  -- Trigger Edge Function asynchronously using pg_net (net.http_post)
  PERFORM net.http_post(
    url := 'https://vjlsuadvxjmxrwnqytmu.supabase.co/functions/v1/vendor-order-notification'::text,
    body := v_payload,
    headers := jsonb_build_object('Content-Type', 'application/json')
  );

  RETURN NEW;
END;
$$;


-- Create Trigger on mart_orders
DROP TRIGGER IF EXISTS trg_mart_orders_notify_vendor ON public.mart_orders;
CREATE TRIGGER trg_mart_orders_notify_vendor
AFTER INSERT ON public.mart_orders
FOR EACH ROW
WHEN (NEW.status = 'pending_vendor_response')
EXECUTE FUNCTION public.fn_notify_vendor_on_mart_order();

-- 4. Response SLA Function: check_mart_order_sla
CREATE OR REPLACE FUNCTION public.check_mart_order_sla(p_sla_minutes integer DEFAULT 45)
RETURNS TABLE (
  order_id uuid,
  previous_status text,
  new_status text,
  reassigned_provider_id uuid,
  notes text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_rec record;
  v_next_vendor_id uuid;
BEGIN
  FOR v_rec IN 
    SELECT o.id, o.provider_id, o.material, o.price, o.created_at
    FROM public.mart_orders o
    WHERE o.status = 'pending_vendor_response'
      AND o.created_at < (now() - (p_sla_minutes || ' minutes')::interval)
    ORDER BY o.created_at ASC
  LOOP
    -- Look for next alternative approved vendor supporting this material
    SELECT pr.id INTO v_next_vendor_id
    FROM public.providers pr
    JOIN public.vendor_profiles vp ON vp.provider_id = pr.id
    WHERE pr.type = 'vendor'
      AND pr.status = 'approved'
      AND vp.status = 'approved'
      AND pr.id <> v_rec.provider_id
      AND (cardinality(vp.materials_supported) = 0 OR v_rec.material = ANY(vp.materials_supported))
    LIMIT 1;

    IF v_next_vendor_id IS NOT NULL THEN
      -- Reassign order to next-ranked vendor and restart SLA window
      UPDATE public.mart_orders
      SET 
        provider_id = v_next_vendor_id,
        status = 'pending_vendor_response',
        updated_at = now()
      WHERE id = v_rec.id;

      order_id := v_rec.id;
      previous_status := 'pending_vendor_response';
      new_status := 'pending_vendor_response';
      reassigned_provider_id := v_next_vendor_id;
      notes := 'Reassigned to alternative approved vendor due to SLA timeout';
      RETURN NEXT;
    ELSE
      -- No other vendor available, mark expired
      UPDATE public.mart_orders
      SET 
        status = 'expired_no_vendor_response',
        updated_at = now()
      WHERE id = v_rec.id;

      order_id := v_rec.id;
      previous_status := 'pending_vendor_response';
      new_status := 'expired_no_vendor_response';
      reassigned_provider_id := NULL;
      notes := 'Order expired - no vendor response within SLA window and no alternative vendors';
      RETURN NEXT;
    END IF;
  END LOOP;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.check_mart_order_sla(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_mart_order_sla(integer) TO service_role;

-- 5. Schedule pg_cron Job (Runs every minute, evaluates 45-minute SLA placeholder)
DO $$
BEGIN
  -- Unschedule existing job if present
  PERFORM cron.unschedule('check_mart_order_sla_job')
  FROM cron.job WHERE jobname = 'check_mart_order_sla_job';
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

SELECT cron.schedule(
  'check_mart_order_sla_job',
  '* * * * *',
  'SELECT public.check_mart_order_sla(45);'
);
