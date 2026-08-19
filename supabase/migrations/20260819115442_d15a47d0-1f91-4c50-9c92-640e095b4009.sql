-- Root/admin bypass: papéis continuam em user_roles (tabela separada, protegida por RLS)
CREATE OR REPLACE FUNCTION public.is_root()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'root');
$$;

CREATE OR REPLACE FUNCTION public.user_is_root(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'root');
$$;

-- Rank de planos para comparação
CREATE OR REPLACE FUNCTION public.plan_rank(_plan text)
RETURNS integer
LANGUAGE sql IMMUTABLE
AS $$
  SELECT CASE lower(coalesce(_plan,'free'))
    WHEN 'premium_plus' THEN 3
    WHEN 'premium' THEN 2
    ELSE 1 END;
$$;

-- Plano efetivo do casal: root sempre no plano máximo, sem cobrança
CREATE OR REPLACE FUNCTION public.effective_plan(_couple_id uuid)
RETURNS text
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_owner uuid; v_plan text;
BEGIN
  SELECT owner_id INTO v_owner FROM public.couples WHERE id = _couple_id;
  IF v_owner IS NULL THEN RETURN 'free'; END IF;
  IF public.user_is_root(v_owner) THEN RETURN 'premium_plus'; END IF;
  SELECT plan INTO v_plan FROM public.subscriptions
   WHERE couple_id = _couple_id AND status IN ('active','trialing')
   ORDER BY public.plan_rank(plan) DESC LIMIT 1;
  RETURN coalesce(v_plan,'free');
END; $$;

-- Uma funcionalidade está liberada? Root ignora flags, planos e limites.
CREATE OR REPLACE FUNCTION public.can_use_feature(_couple_id uuid, _key text)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_owner uuid; v_flag public.feature_flags%ROWTYPE;
BEGIN
  SELECT owner_id INTO v_owner FROM public.couples WHERE id = _couple_id;
  IF v_owner IS NOT NULL AND public.user_is_root(v_owner) THEN RETURN true; END IF;
  SELECT * INTO v_flag FROM public.feature_flags WHERE key = _key;
  IF v_flag.key IS NULL THEN RETURN true; END IF;
  IF NOT v_flag.enabled THEN RETURN false; END IF;
  RETURN public.plan_rank(public.effective_plan(_couple_id)) >= public.plan_rank(v_flag.min_plan);
END; $$;

REVOKE EXECUTE ON FUNCTION public.plan_rank(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_root() TO authenticated;
GRANT EXECUTE ON FUNCTION public.effective_plan(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_use_feature(uuid, text) TO authenticated;