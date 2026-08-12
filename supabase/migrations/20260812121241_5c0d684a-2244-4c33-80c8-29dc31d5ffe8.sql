REVOKE EXECUTE ON FUNCTION public.owns_couple(UUID) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.couple_is_published(UUID) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM anon, authenticated;