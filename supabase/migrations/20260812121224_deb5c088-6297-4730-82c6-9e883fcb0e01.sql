CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ---------- profiles ----------
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------- couples ----------
CREATE TABLE public.couples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  partner_1_name TEXT NOT NULL,
  partner_2_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX couples_owner_idx ON public.couples(owner_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.couples TO authenticated;
GRANT SELECT ON public.couples TO anon;
GRANT ALL ON public.couples TO service_role;
ALTER TABLE public.couples ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER couples_updated_at BEFORE UPDATE ON public.couples FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.owns_couple(_couple_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.couples c WHERE c.id = _couple_id AND c.owner_id = auth.uid());
$$;

-- ---------- website_settings ----------
CREATE TABLE public.website_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL UNIQUE REFERENCES public.couples(id) ON DELETE CASCADE,
  template_slug TEXT NOT NULL DEFAULT 'elegante',
  primary_color TEXT NOT NULL DEFAULT '#8a6f52',
  secondary_color TEXT NOT NULL DEFAULT '#c9b8a3',
  background_color TEXT NOT NULL DEFAULT '#fbf8f4',
  heading_font TEXT NOT NULL DEFAULT 'Cormorant Garamond',
  body_font TEXT NOT NULL DEFAULT 'Karla',
  hero_image_url TEXT,
  music_url TEXT,
  custom_domain TEXT,
  published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.website_settings TO authenticated;
GRANT SELECT ON public.website_settings TO anon;
GRANT ALL ON public.website_settings TO service_role;
ALTER TABLE public.website_settings ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER website_settings_updated_at BEFORE UPDATE ON public.website_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.couple_is_published(_couple_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.website_settings w WHERE w.couple_id = _couple_id AND w.published = true);
$$;

CREATE POLICY "couples_owner_all" ON public.couples FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "couples_public_read" ON public.couples FOR SELECT TO anon USING (public.couple_is_published(id));

CREATE POLICY "website_settings_owner_all" ON public.website_settings FOR ALL TO authenticated USING (public.owns_couple(couple_id)) WITH CHECK (public.owns_couple(couple_id));
CREATE POLICY "website_settings_public_read" ON public.website_settings FOR SELECT TO anon USING (published = true);

-- ---------- weddings ----------
CREATE TABLE public.weddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL UNIQUE REFERENCES public.couples(id) ON DELETE CASCADE,
  title TEXT,
  description TEXT,
  wedding_date DATE,
  ceremony_time TIME,
  venue_name TEXT,
  venue_address TEXT,
  city TEXT,
  state TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  dress_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.weddings TO authenticated;
GRANT SELECT ON public.weddings TO anon;
GRANT ALL ON public.weddings TO service_role;
ALTER TABLE public.weddings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "weddings_owner_all" ON public.weddings FOR ALL TO authenticated USING (public.owns_couple(couple_id)) WITH CHECK (public.owns_couple(couple_id));
CREATE POLICY "weddings_public_read" ON public.weddings FOR SELECT TO anon USING (public.couple_is_published(couple_id));
CREATE TRIGGER weddings_updated_at BEFORE UPDATE ON public.weddings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- website_sections ----------
CREATE TABLE public.website_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  section_type TEXT NOT NULL CHECK (section_type IN ('hero','story','countdown','gallery','event','location','dress_code','rsvp','gifts','message','footer')),
  title TEXT,
  content TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  visible BOOLEAN NOT NULL DEFAULT true,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX website_sections_couple_idx ON public.website_sections(couple_id, position);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.website_sections TO authenticated;
GRANT SELECT ON public.website_sections TO anon;
GRANT ALL ON public.website_sections TO service_role;
ALTER TABLE public.website_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "website_sections_owner_all" ON public.website_sections FOR ALL TO authenticated USING (public.owns_couple(couple_id)) WITH CHECK (public.owns_couple(couple_id));
CREATE POLICY "website_sections_public_read" ON public.website_sections FOR SELECT TO anon USING (public.couple_is_published(couple_id));
CREATE TRIGGER website_sections_updated_at BEFORE UPDATE ON public.website_sections FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- photos ----------
CREATE TABLE public.photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  section_id UUID REFERENCES public.website_sections(id) ON DELETE SET NULL,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  caption TEXT,
  category TEXT NOT NULL DEFAULT 'gallery',
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX photos_couple_idx ON public.photos(couple_id, position);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.photos TO authenticated;
GRANT SELECT ON public.photos TO anon;
GRANT ALL ON public.photos TO service_role;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "photos_owner_all" ON public.photos FOR ALL TO authenticated USING (public.owns_couple(couple_id)) WITH CHECK (public.owns_couple(couple_id));
CREATE POLICY "photos_public_read" ON public.photos FOR SELECT TO anon USING (public.couple_is_published(couple_id));

-- ---------- guests ----------
CREATE TABLE public.guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  group_name TEXT,
  plus_one_allowed BOOLEAN NOT NULL DEFAULT false,
  plus_one_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','declined')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX guests_couple_idx ON public.guests(couple_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.guests TO authenticated;
GRANT ALL ON public.guests TO service_role;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "guests_owner_all" ON public.guests FOR ALL TO authenticated USING (public.owns_couple(couple_id)) WITH CHECK (public.owns_couple(couple_id));
CREATE TRIGGER guests_updated_at BEFORE UPDATE ON public.guests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- rsvps ----------
CREATE TABLE public.rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL UNIQUE REFERENCES public.guests(id) ON DELETE CASCADE,
  response TEXT NOT NULL CHECK (response IN ('attending','not_attending')),
  guests_count INTEGER NOT NULL DEFAULT 1,
  dietary_restrictions TEXT,
  message TEXT,
  responded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX rsvps_couple_idx ON public.rsvps(couple_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rsvps TO authenticated;
GRANT ALL ON public.rsvps TO service_role;
ALTER TABLE public.rsvps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rsvps_owner_all" ON public.rsvps FOR ALL TO authenticated USING (public.owns_couple(couple_id)) WITH CHECK (public.owns_couple(couple_id));

-- ---------- gift_items ----------
CREATE TABLE public.gift_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  type TEXT NOT NULL DEFAULT 'physical' CHECK (type IN ('physical','quota')),
  quantity INTEGER NOT NULL DEFAULT 1,
  available_quantity INTEGER NOT NULL DEFAULT 1,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX gift_items_couple_idx ON public.gift_items(couple_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gift_items TO authenticated;
GRANT SELECT ON public.gift_items TO anon;
GRANT ALL ON public.gift_items TO service_role;
ALTER TABLE public.gift_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gift_items_owner_all" ON public.gift_items FOR ALL TO authenticated USING (public.owns_couple(couple_id)) WITH CHECK (public.owns_couple(couple_id));
CREATE POLICY "gift_items_public_read" ON public.gift_items FOR SELECT TO anon USING (active = true AND public.couple_is_published(couple_id));
CREATE TRIGGER gift_items_updated_at BEFORE UPDATE ON public.gift_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- gift_orders ----------
CREATE TABLE public.gift_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  gift_item_id UUID NOT NULL REFERENCES public.gift_items(id) ON DELETE CASCADE,
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  message TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','cancelled','refunded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX gift_orders_couple_idx ON public.gift_orders(couple_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gift_orders TO authenticated;
GRANT ALL ON public.gift_orders TO service_role;
ALTER TABLE public.gift_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gift_orders_owner_all" ON public.gift_orders FOR ALL TO authenticated USING (public.owns_couple(couple_id)) WITH CHECK (public.owns_couple(couple_id));
CREATE TRIGGER gift_orders_updated_at BEFORE UPDATE ON public.gift_orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- payments ----------
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  order_id UUID NOT NULL UNIQUE REFERENCES public.gift_orders(id) ON DELETE CASCADE,
  gateway TEXT NOT NULL DEFAULT 'mercadopago',
  gateway_payment_id TEXT,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_method TEXT CHECK (payment_method IN ('pix','credit_card','debit_card')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','refunded')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX payments_couple_idx ON public.payments(couple_id);
GRANT SELECT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments_owner_read" ON public.payments FOR SELECT TO authenticated USING (public.owns_couple(couple_id));
CREATE TRIGGER payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- subscriptions ----------
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free','premium','premium_plus')),
  status TEXT NOT NULL DEFAULT 'active',
  gateway TEXT,
  gateway_subscription_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX subscriptions_couple_idx ON public.subscriptions(couple_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subscriptions_owner_all" ON public.subscriptions FOR ALL TO authenticated USING (public.owns_couple(couple_id)) WITH CHECK (public.owns_couple(couple_id));
CREATE TRIGGER subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- funções públicas ----------
CREATE OR REPLACE FUNCTION public.submit_rsvp(
  _slug TEXT,
  _name TEXT,
  _email TEXT,
  _response TEXT,
  _guests_count INTEGER,
  _plus_one_name TEXT DEFAULT NULL,
  _dietary TEXT DEFAULT NULL,
  _message TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_couple UUID;
  v_guest UUID;
BEGIN
  IF _response NOT IN ('attending','not_attending') THEN
    RAISE EXCEPTION 'Resposta inválida';
  END IF;
  IF coalesce(trim(_name),'') = '' THEN
    RAISE EXCEPTION 'Nome obrigatório';
  END IF;

  SELECT c.id INTO v_couple FROM public.couples c
  WHERE c.slug = _slug AND public.couple_is_published(c.id);
  IF v_couple IS NULL THEN
    RAISE EXCEPTION 'Casamento não encontrado';
  END IF;

  SELECT g.id INTO v_guest FROM public.guests g
  WHERE g.couple_id = v_couple
    AND (
      (_email IS NOT NULL AND _email <> '' AND lower(g.email) = lower(_email))
      OR lower(g.name) = lower(trim(_name))
    )
  LIMIT 1;

  IF v_guest IS NULL THEN
    INSERT INTO public.guests (couple_id, name, email, plus_one_name, status)
    VALUES (v_couple, trim(_name), nullif(_email,''), nullif(_plus_one_name,''),
            CASE WHEN _response = 'attending' THEN 'confirmed' ELSE 'declined' END)
    RETURNING id INTO v_guest;
  ELSE
    UPDATE public.guests SET
      email = COALESCE(nullif(_email,''), email),
      plus_one_name = COALESCE(nullif(_plus_one_name,''), plus_one_name),
      status = CASE WHEN _response = 'attending' THEN 'confirmed' ELSE 'declined' END
    WHERE id = v_guest;
  END IF;

  INSERT INTO public.rsvps (couple_id, guest_id, response, guests_count, dietary_restrictions, message, responded_at)
  VALUES (v_couple, v_guest, _response, GREATEST(coalesce(_guests_count,1),1), nullif(_dietary,''), nullif(_message,''), now())
  ON CONFLICT (guest_id) DO UPDATE SET
    response = EXCLUDED.response,
    guests_count = EXCLUDED.guests_count,
    dietary_restrictions = EXCLUDED.dietary_restrictions,
    message = EXCLUDED.message,
    responded_at = now();

  RETURN jsonb_build_object('ok', true, 'guest_id', v_guest);
END; $$;
REVOKE ALL ON FUNCTION public.submit_rsvp(TEXT,TEXT,TEXT,TEXT,INTEGER,TEXT,TEXT,TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_rsvp(TEXT,TEXT,TEXT,TEXT,INTEGER,TEXT,TEXT,TEXT) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.create_gift_order(
  _gift_item_id UUID,
  _guest_name TEXT,
  _guest_email TEXT,
  _quantity INTEGER,
  _message TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_item public.gift_items%ROWTYPE;
  v_order UUID;
  v_qty INTEGER := GREATEST(coalesce(_quantity,1),1);
BEGIN
  SELECT * INTO v_item FROM public.gift_items WHERE id = _gift_item_id AND active = true;
  IF v_item.id IS NULL OR NOT public.couple_is_published(v_item.couple_id) THEN
    RAISE EXCEPTION 'Presente indisponível';
  END IF;
  IF v_item.available_quantity < v_qty THEN
    RAISE EXCEPTION 'Quantidade indisponível';
  END IF;
  IF coalesce(trim(_guest_name),'') = '' OR coalesce(trim(_guest_email),'') = '' THEN
    RAISE EXCEPTION 'Nome e e-mail são obrigatórios';
  END IF;

  INSERT INTO public.gift_orders (couple_id, gift_item_id, guest_name, guest_email, message, quantity, amount, status)
  VALUES (v_item.couple_id, v_item.id, trim(_guest_name), trim(_guest_email), nullif(_message,''), v_qty, v_item.price * v_qty, 'pending')
  RETURNING id INTO v_order;

  INSERT INTO public.payments (couple_id, order_id, gateway, amount, status)
  VALUES (v_item.couple_id, v_order, 'mercadopago', v_item.price * v_qty, 'pending');

  RETURN jsonb_build_object('ok', true, 'order_id', v_order, 'amount', v_item.price * v_qty);
END; $$;
REVOKE ALL ON FUNCTION public.create_gift_order(UUID,TEXT,TEXT,INTEGER,TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_gift_order(UUID,TEXT,TEXT,INTEGER,TEXT) TO anon, authenticated, service_role;

-- ---------- storage policies ----------
CREATE POLICY "wedding_images_public_read" ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'wedding-images');

CREATE POLICY "wedding_images_owner_insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'wedding-images' AND public.owns_couple(((storage.foldername(name))[1])::uuid));

CREATE POLICY "wedding_images_owner_update" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'wedding-images' AND public.owns_couple(((storage.foldername(name))[1])::uuid));

CREATE POLICY "wedding_images_owner_delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'wedding-images' AND public.owns_couple(((storage.foldername(name))[1])::uuid));