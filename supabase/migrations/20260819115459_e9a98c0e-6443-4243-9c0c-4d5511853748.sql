CREATE OR REPLACE FUNCTION public.plan_rank(_plan text)
RETURNS integer
LANGUAGE sql IMMUTABLE SET search_path = public
AS $$
  SELECT CASE lower(coalesce(_plan,'free'))
    WHEN 'premium_plus' THEN 3
    WHEN 'premium' THEN 2
    ELSE 1 END;
$$;

REVOKE EXECUTE ON FUNCTION public.is_root() FROM anon;
REVOKE EXECUTE ON FUNCTION public.user_is_root(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.effective_plan(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.can_use_feature(uuid, text) FROM anon;