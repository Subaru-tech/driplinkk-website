-- Migration: 20260912120000_escrow_payment_state_machine.sql
-- Purpose: Implement Phase 4 Escrow-Style Payment Hold State Machine (Schema, Transitions, RLS)
--   States:
--     - authorized_held (funds secured upon order placement)
--     - released_to_vendor (escrow released upon successful delivery / buyer completion)
--     - refunded_to_buyer (funds returned upon cancellation or unfulfilled SLA)
--     - disputed (order under formal admin dispute adjudication)

-- 1. Create Payment Hold State Enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_hold_state') THEN
    CREATE TYPE public.payment_hold_state AS ENUM (
      'authorized_held',
      'released_to_vendor',
      'refunded_to_buyer',
      'disputed'
    );
  END IF;
END $$;

-- 2. Create order_payments table
CREATE TABLE IF NOT EXISTS public.order_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.mart_orders(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES public.profiles(id),
  vendor_id uuid NOT NULL REFERENCES public.providers(id),
  amount numeric NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'INR',
  status public.payment_hold_state NOT NULL DEFAULT 'authorized_held',
  gateway_provider text NOT NULL DEFAULT 'stub', -- 'stub', 'razorpay', 'stripe'
  gateway_payment_id text,
  gateway_order_id text,
  hold_expires_at timestamptz,
  released_at timestamptz,
  refunded_at timestamptz,
  disputed_at timestamptz,
  dispute_reason text,
  dispute_resolution text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_order_payments_order UNIQUE (order_id)
);

-- 3. Create order_payment_transitions audit ledger
CREATE TABLE IF NOT EXISTS public.order_payment_transitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL REFERENCES public.order_payments(id) ON DELETE CASCADE,
  from_state public.payment_hold_state,
  to_state public.payment_hold_state NOT NULL,
  transitioned_by uuid REFERENCES public.profiles(id),
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Enable RLS
ALTER TABLE public.order_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_payment_transitions ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies on order_payments
DROP POLICY IF EXISTS "order_payments: buyer select own" ON public.order_payments;
CREATE POLICY "order_payments: buyer select own" ON public.order_payments
  FOR SELECT USING (buyer_id = auth.uid());

DROP POLICY IF EXISTS "order_payments: vendor select own" ON public.order_payments;
CREATE POLICY "order_payments: vendor select own" ON public.order_payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.providers p
      WHERE p.id = order_payments.vendor_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "order_payments: admin view all" ON public.order_payments;
CREATE POLICY "order_payments: admin view all" ON public.order_payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles prof
      WHERE prof.id = auth.uid() AND prof.role = 'admin'
    )
  );

-- No direct client insert/update/delete; mutations strictly via service_role / RPC
DROP POLICY IF EXISTS "order_payments: mutation locked" ON public.order_payments;
CREATE POLICY "order_payments: mutation locked" ON public.order_payments
  FOR ALL USING (false);

-- 6. RPC Function: transition_order_payment_state
CREATE OR REPLACE FUNCTION public.transition_order_payment_state(
  p_payment_id uuid,
  p_target_state public.payment_hold_state,
  p_actor_id uuid DEFAULT NULL,
  p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_payment public.order_payments%ROWTYPE;
  v_is_legal boolean := false;
BEGIN
  SELECT * INTO v_payment FROM public.order_payments WHERE id = p_payment_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order payment record not found for ID: %', p_payment_id;
  END IF;

  -- Verify Legal State Machine Transitions:
  -- 1. authorized_held -> released_to_vendor
  -- 2. authorized_held -> refunded_to_buyer
  -- 3. authorized_held -> disputed
  -- 4. disputed        -> released_to_vendor
  -- 5. disputed        -> refunded_to_buyer
  IF v_payment.status = 'authorized_held' THEN
    IF p_target_state IN ('released_to_vendor', 'refunded_to_buyer', 'disputed') THEN
      v_is_legal := true;
    END IF;
  ELSIF v_payment.status = 'disputed' THEN
    IF p_target_state IN ('released_to_vendor', 'refunded_to_buyer') THEN
      v_is_legal := true;
    END IF;
  END IF;

  IF NOT v_is_legal THEN
    RAISE EXCEPTION 'Illegal payment state transition: Cannot transition from % to %', v_payment.status, p_target_state;
  END IF;

  -- Apply transition updates
  UPDATE public.order_payments
  SET 
    status = p_target_state,
    released_at = CASE WHEN p_target_state = 'released_to_vendor' THEN now() ELSE released_at END,
    refunded_at = CASE WHEN p_target_state = 'refunded_to_buyer' THEN now() ELSE refunded_at END,
    disputed_at = CASE WHEN p_target_state = 'disputed' THEN now() ELSE disputed_at END,
    dispute_reason = CASE WHEN p_target_state = 'disputed' THEN p_reason ELSE dispute_reason END,
    dispute_resolution = CASE WHEN v_payment.status = 'disputed' AND p_target_state IN ('released_to_vendor', 'refunded_to_buyer') THEN p_reason ELSE dispute_resolution END,
    updated_at = now()
  WHERE id = p_payment_id;

  -- Record audit transition event
  INSERT INTO public.order_payment_transitions (
    payment_id,
    from_state,
    to_state,
    transitioned_by,
    reason
  ) VALUES (
    p_payment_id,
    v_payment.status,
    p_target_state,
    p_actor_id,
    p_reason
  );

  RETURN jsonb_build_object(
    'success', true,
    'payment_id', p_payment_id,
    'from_state', v_payment.status,
    'to_state', p_target_state,
    'reason', p_reason
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.transition_order_payment_state(uuid, public.payment_hold_state, uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.transition_order_payment_state(uuid, public.payment_hold_state, uuid, text) TO service_role;
