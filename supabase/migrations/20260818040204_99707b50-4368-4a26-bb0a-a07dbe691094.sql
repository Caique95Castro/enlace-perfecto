
-- ============ EVENTOS ============
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  name text NOT NULL,
  event_type text NOT NULL DEFAULT 'ceremony',
  event_date date,
  start_time time,
  venue_name text,
  address text,
  maps_url text,
  description text,
  position integer NOT NULL DEFAULT 0,
  visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT SELECT ON public.events TO anon;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events_owner_all" ON public.events FOR ALL TO authenticated
  USING (public.owns_couple(couple_id)) WITH CHECK (public.owns_couple(couple_id));
CREATE POLICY "events_public_read" ON public.events FOR SELECT TO anon, authenticated
  USING (visible AND public.couple_is_published(couple_id));
CREATE POLICY "events_staff_read" ON public.events FOR SELECT TO authenticated USING (public.is_staff());
CREATE TRIGGER events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ PADRINHOS ============
CREATE TABLE public.wedding_party (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text,
  description text,
  photo_url text,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wedding_party TO authenticated;
GRANT SELECT ON public.wedding_party TO anon;
GRANT ALL ON public.wedding_party TO service_role;
ALTER TABLE public.wedding_party ENABLE ROW LEVEL SECURITY;
CREATE POLICY "party_owner_all" ON public.wedding_party FOR ALL TO authenticated
  USING (public.owns_couple(couple_id)) WITH CHECK (public.owns_couple(couple_id));
CREATE POLICY "party_public_read" ON public.wedding_party FOR SELECT TO anon, authenticated
  USING (public.couple_is_published(couple_id));
CREATE POLICY "party_staff_read" ON public.wedding_party FOR SELECT TO authenticated USING (public.is_staff());
CREATE TRIGGER wedding_party_updated_at BEFORE UPDATE ON public.wedding_party FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ INFORMAÇÕES IMPORTANTES ============
CREATE TABLE public.info_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text,
  icon text,
  position integer NOT NULL DEFAULT 0,
  visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.info_items TO authenticated;
GRANT SELECT ON public.info_items TO anon;
GRANT ALL ON public.info_items TO service_role;
ALTER TABLE public.info_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "info_owner_all" ON public.info_items FOR ALL TO authenticated
  USING (public.owns_couple(couple_id)) WITH CHECK (public.owns_couple(couple_id));
CREATE POLICY "info_public_read" ON public.info_items FOR SELECT TO anon, authenticated
  USING (visible AND public.couple_is_published(couple_id));
CREATE POLICY "info_staff_read" ON public.info_items FOR SELECT TO authenticated USING (public.is_staff());
CREATE TRIGGER info_items_updated_at BEFORE UPDATE ON public.info_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ HISTÓRIA (TIMELINE) ============
CREATE TABLE public.story_moments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  moment_date date,
  photo_url text,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.story_moments TO authenticated;
GRANT SELECT ON public.story_moments TO anon;
GRANT ALL ON public.story_moments TO service_role;
ALTER TABLE public.story_moments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "story_owner_all" ON public.story_moments FOR ALL TO authenticated
  USING (public.owns_couple(couple_id)) WITH CHECK (public.owns_couple(couple_id));
CREATE POLICY "story_public_read" ON public.story_moments FOR SELECT TO anon, authenticated
  USING (public.couple_is_published(couple_id));
CREATE POLICY "story_staff_read" ON public.story_moments FOR SELECT TO authenticated USING (public.is_staff());
CREATE TRIGGER story_moments_updated_at BEFORE UPDATE ON public.story_moments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ IDEMPOTÊNCIA DE PAGAMENTO ============
CREATE TABLE public.payment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway text NOT NULL DEFAULT 'mercadopago',
  gateway_event_id text NOT NULL,
  gateway_payment_id text,
  order_id uuid REFERENCES public.gift_orders(id) ON DELETE SET NULL,
  status text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (gateway, gateway_event_id)
);
GRANT ALL ON public.payment_events TO service_role;
GRANT SELECT ON public.payment_events TO authenticated;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payment_events_staff_read" ON public.payment_events FOR SELECT TO authenticated USING (public.is_staff());

-- ============ AUDITORIA ============
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  actor_email text,
  couple_id uuid REFERENCES public.couples(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id text,
  result text NOT NULL DEFAULT 'success',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.audit_logs TO service_role;
GRANT SELECT ON public.audit_logs TO authenticated;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_staff_read" ON public.audit_logs FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY "audit_owner_read" ON public.audit_logs FOR SELECT TO authenticated
  USING (couple_id IS NOT NULL AND public.owns_couple(couple_id));

-- ============ CONFIRMAÇÃO SEGURA DE PAGAMENTO ============
CREATE OR REPLACE FUNCTION public.apply_payment_event(
  _gateway_event_id text,
  _order_id uuid,
  _gateway_payment_id text,
  _status text,
  _method text DEFAULT NULL,
  _payload jsonb DEFAULT '{}'::jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_order public.gift_orders%ROWTYPE;
  v_inserted boolean := false;
BEGIN
  IF _status NOT IN ('pending','approved','rejected','cancelled','expired') THEN
    RAISE EXCEPTION 'Status inválido: %', _status;
  END IF;

  INSERT INTO public.payment_events (gateway_event_id, gateway_payment_id, order_id, status, payload)
  VALUES (_gateway_event_id, _gateway_payment_id, _order_id, _status, coalesce(_payload,'{}'::jsonb))
  ON CONFLICT (gateway, gateway_event_id) DO NOTHING
  RETURNING true INTO v_inserted;

  IF v_inserted IS NOT TRUE THEN
    RETURN jsonb_build_object('ok', true, 'duplicate', true);
  END IF;

  SELECT * INTO v_order FROM public.gift_orders WHERE id = _order_id FOR UPDATE;
  IF v_order.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'order_not_found');
  END IF;

  UPDATE public.payments SET
    status = _status,
    gateway_payment_id = coalesce(_gateway_payment_id, gateway_payment_id),
    payment_method = coalesce(_method, payment_method),
    paid_at = CASE WHEN _status = 'approved' THEN now() ELSE NULL END
  WHERE order_id = _order_id;

  IF _status = 'approved' AND v_order.status <> 'paid' THEN
    UPDATE public.gift_orders SET status = 'paid' WHERE id = _order_id;
    UPDATE public.gift_items
       SET available_quantity = GREATEST(available_quantity - v_order.quantity, 0)
     WHERE id = v_order.gift_item_id;
    INSERT INTO public.notifications (couple_id, type, title, body)
    VALUES (v_order.couple_id, 'payment', 'Pagamento confirmado', v_order.guest_name);
  ELSIF _status IN ('rejected','cancelled','expired') AND v_order.status <> 'paid' THEN
    UPDATE public.gift_orders SET status = _status WHERE id = _order_id;
  END IF;

  INSERT INTO public.audit_logs (couple_id, action, entity, entity_id, result, metadata)
  VALUES (v_order.couple_id, 'payment_' || _status, 'gift_order', _order_id::text, 'success',
          jsonb_build_object('gateway_payment_id', _gateway_payment_id));

  RETURN jsonb_build_object('ok', true, 'duplicate', false, 'status', _status);
END; $$;

REVOKE EXECUTE ON FUNCTION public.apply_payment_event(text, uuid, text, text, text, jsonb) FROM anon, authenticated;
