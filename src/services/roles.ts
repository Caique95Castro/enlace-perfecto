import { supabase } from "@/integrations/supabase/client";

export type AppRole = "user" | "admin" | "root";

/** Papéis do usuário logado (fonte da verdade: tabela user_roles, protegida por RLS). */
export async function getMyRoles(): Promise<AppRole[]> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return [];
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", auth.user.id);
  if (error) throw error;
  return (data ?? []).map((r) => r.role as AppRole);
}
