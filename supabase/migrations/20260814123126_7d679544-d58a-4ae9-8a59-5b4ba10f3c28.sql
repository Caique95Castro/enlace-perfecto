-- 1. ROLES
CREATE TYPE public.app_role AS ENUM ('user','admin','root');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin','root')
  );
$$;

CREATE POLICY user_roles_select_own ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff());

-- 2. bootstrap root + default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'))
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN lower(NEW.email) = 'caiqueocastro@gmail.com'
                       THEN 'root'::public.app_role ELSE 'user'::public.app_role END)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'user'::public.app_role FROM auth.users u
ON CONFLICT DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'root'::public.app_role FROM auth.users u
WHERE lower(u.email) = 'caiqueocastro@gmail.com'
ON CONFLICT DO NOTHING;

-- 3. staff read access across tenant tables
CREATE POLICY couples_staff_read ON public.couples FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY weddings_staff_read ON public.weddings FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY website_settings_staff_read ON public.website_settings FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY website_sections_staff_read ON public.website_sections FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY photos_staff_read ON public.photos FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY guests_staff_read ON public.guests FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY rsvps_staff_read ON public.rsvps FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY gift_items_staff_read ON public.gift_items FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY gift_orders_staff_read ON public.gift_orders FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY payments_staff_read ON public.payments FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY subscriptions_staff_read ON public.subscriptions FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY profiles_staff_read ON public.profiles FOR SELECT TO authenticated USING (public.is_staff());

-- 4. FEATURE FLAGS
CREATE TABLE public.feature_flags (
  key text PRIMARY KEY,
  label text NOT NULL,
  description text,
  enabled boolean NOT NULL DEFAULT true,
  min_plan text NOT NULL DEFAULT 'free',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.feature_flags TO authenticated, anon;
GRANT ALL ON public.feature_flags TO service_role;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY feature_flags_read ON public.feature_flags FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY feature_flags_staff_write ON public.feature_flags FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());
CREATE TRIGGER feature_flags_updated_at BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.feature_flags (key, label, description, enabled, min_plan) VALUES
  ('enable_rsvp','Confirmação de presença','Formulário de RSVP no site público',true,'free'),
  ('enable_gift_list','Lista de presentes','Presentes e cotas com pagamento',true,'free'),
  ('enable_messages','Mural de mensagens','Recados dos convidados com moderação',true,'free'),
  ('enable_save_the_date','Save the Date','Página e arte de Save the Date',true,'premium'),
  ('enable_invitation','Convite digital','Convite digital compartilhável',true,'premium'),
  ('enable_qr_code','QR Code','QR Code do site do casal',true,'free'),
  ('enable_custom_domain','Domínio próprio','Domínio personalizado do site',true,'premium_plus'),
  ('enable_analytics','Analytics','Visitas e interações no site',true,'premium');

-- 5. GUEST MESSAGES
CREATE TABLE public.guest_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  message text NOT NULL,
  photo_url text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.guest_messages TO authenticated;
GRANT SELECT ON public.guest_messages TO anon;
GRANT ALL ON public.guest_messages TO service_role;
ALTER TABLE public.guest_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY guest_messages_owner_all ON public.guest_messages FOR ALL TO authenticated
  USING (public.owns_couple(couple_id)) WITH CHECK (public.owns_couple(couple_id));
CREATE POLICY guest_messages_staff_read ON public.guest_messages FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY guest_messages_public_read ON public.guest_messages FOR SELECT TO anon
  USING (status = 'approved' AND public.couple_is_published(couple_id));
CREATE TRIGGER guest_messages_updated_at BEFORE UPDATE ON public.guest_messages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX guest_messages_couple_idx ON public.guest_messages (couple_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.submit_guest_message(_slug text, _author_name text, _message text, _photo_url text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_couple uuid;
BEGIN
  IF coalesce(trim(_author_name),'') = '' OR coalesce(trim(_message),'') = '' THEN
    RAISE EXCEPTION 'Nome e mensagem são obrigatórios';
  END IF;
  IF length(_message) > 1000 THEN RAISE EXCEPTION 'Mensagem muito longa'; END IF;
  SELECT c.id INTO v_couple FROM public.couples c
   WHERE c.slug = _slug AND public.couple_is_published(c.id);
  IF v_couple IS NULL THEN RAISE EXCEPTION 'Casamento não encontrado'; END IF;
  INSERT INTO public.guest_messages (couple_id, author_name, message, photo_url)
  VALUES (v_couple, trim(_author_name), trim(_message), nullif(_photo_url,''));
  RETURN jsonb_build_object('ok', true);
END; $$;

-- 6. SITE SETTINGS / WEDDING / GIFT extensions
ALTER TABLE public.website_settings
  ADD COLUMN IF NOT EXISTS rsvp_mode text NOT NULL DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS button_style text NOT NULL DEFAULT 'rounded',
  ADD COLUMN IF NOT EXISTS card_style text NOT NULL DEFAULT 'soft',
  ADD COLUMN IF NOT EXISTS border_radius text NOT NULL DEFAULT 'md',
  ADD COLUMN IF NOT EXISTS layout_width text NOT NULL DEFAULT 'comfortable',
  ADD COLUMN IF NOT EXISTS messages_enabled boolean NOT NULL DEFAULT true;

ALTER TABLE public.weddings
  ADD COLUMN IF NOT EXISTS reception_time time,
  ADD COLUMN IF NOT EXISTS reception_venue_name text,
  ADD COLUMN IF NOT EXISTS reception_address text,
  ADD COLUMN IF NOT EXISTS our_story text;

ALTER TABLE public.gift_items
  ADD COLUMN IF NOT EXISTS is_quota boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS quota_label text,
  ADD COLUMN IF NOT EXISTS total_goal numeric;

-- 7. ANALYTICS
CREATE TABLE public.site_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_events TO authenticated;
GRANT ALL ON public.site_events TO service_role;
ALTER TABLE public.site_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY site_events_owner_read ON public.site_events FOR SELECT TO authenticated
  USING (public.owns_couple(couple_id) OR public.is_staff());
CREATE INDEX site_events_couple_idx ON public.site_events (couple_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.track_site_event(_slug text, _event_type text, _metadata jsonb DEFAULT '{}'::jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_couple uuid;
BEGIN
  IF _event_type NOT IN ('page_view','rsvp_click','gift_click','message_sent','rsvp_submitted') THEN RETURN; END IF;
  SELECT c.id INTO v_couple FROM public.couples c
   WHERE c.slug = _slug AND public.couple_is_published(c.id);
  IF v_couple IS NULL THEN RETURN; END IF;
  INSERT INTO public.site_events (couple_id, event_type, metadata)
  VALUES (v_couple, _event_type, coalesce(_metadata,'{}'::jsonb));
END; $$;

-- 8. NOTIFICATIONS
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY notifications_owner_all ON public.notifications FOR SELECT TO authenticated
  USING (public.owns_couple(couple_id) OR public.is_staff());
CREATE POLICY notifications_owner_update ON public.notifications FOR UPDATE TO authenticated
  USING (public.owns_couple(couple_id)) WITH CHECK (public.owns_couple(couple_id));
CREATE POLICY notifications_owner_delete ON public.notifications FOR DELETE TO authenticated
  USING (public.owns_couple(couple_id));
CREATE INDEX notifications_couple_idx ON public.notifications (couple_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.notify_couple()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_TABLE_NAME = 'rsvps' THEN
    INSERT INTO public.notifications (couple_id, type, title)
    VALUES (NEW.couple_id, 'rsvp', 'Nova confirmação de presença');
  ELSIF TG_TABLE_NAME = 'gift_orders' THEN
    INSERT INTO public.notifications (couple_id, type, title, body)
    VALUES (NEW.couple_id, 'gift', 'Novo presente recebido', NEW.guest_name);
  ELSIF TG_TABLE_NAME = 'guest_messages' THEN
    INSERT INTO public.notifications (couple_id, type, title, body)
    VALUES (NEW.couple_id, 'message', 'Nova mensagem no mural', NEW.author_name);
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER rsvps_notify AFTER INSERT ON public.rsvps FOR EACH ROW EXECUTE FUNCTION public.notify_couple();
CREATE TRIGGER gift_orders_notify AFTER INSERT ON public.gift_orders FOR EACH ROW EXECUTE FUNCTION public.notify_couple();
CREATE TRIGGER guest_messages_notify AFTER INSERT ON public.guest_messages FOR EACH ROW EXECUTE FUNCTION public.notify_couple();

REVOKE EXECUTE ON FUNCTION public.is_staff() FROM anon;
REVOKE EXECUTE ON FUNCTION public.notify_couple() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_guest_message(text,text,text,text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.track_site_event(text,text,jsonb) TO anon, authenticated;