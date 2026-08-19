import { useQuery } from "@tanstack/react-query";
import { getMyRoles, type AppRole } from "@/services/roles";
import { listFeatureFlags } from "@/services/flags";
import { listMessages } from "@/services/messages";
import { supabase } from "@/integrations/supabase/client";
import {
  canUseFeature,
  effectivePlan,
  isBillable,
  limitsFor,
  withinLimit,
} from "@/lib/entitlements";

/** Papéis do usuário logado — a autorização real é feita no banco (RLS + is_staff). */
export function useRoles() {
  const query = useQuery({ queryKey: ["roles"], queryFn: getMyRoles, staleTime: 60_000 });
  const roles: AppRole[] = query.data ?? [];
  return {
    ...query,
    roles,
    isRoot: roles.includes("root"),
    isAdmin: roles.includes("admin") || roles.includes("root"),
  };
}

export function useFeatureFlags() {
  return useQuery({ queryKey: ["feature-flags"], queryFn: listFeatureFlags, staleTime: 60_000 });
}

export function useMessages(coupleId: string | undefined) {
  return useQuery({
    queryKey: ["messages", coupleId],
    queryFn: () => listMessages(coupleId!),
    enabled: Boolean(coupleId),
  });
}
