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

/**
 * Plano efetivo, limites e liberação de recursos do casal logado.
 * Conta ROOT: plano máximo, sem cobrança e sem limites.
 */
export function useEntitlements(coupleId: string | undefined) {
  const { isRoot, isAdmin, isLoading: rolesLoading } = useRoles();
  const { data: flags = [], isLoading: flagsLoading } = useFeatureFlags();

  const subscription = useQuery({
    queryKey: ["subscription", coupleId],
    enabled: Boolean(coupleId) && !isRoot,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("plan, status")
        .eq("couple_id", coupleId!)
        .in("status", ["active", "trialing"])
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const plan = effectivePlan(subscription.data?.plan, isRoot);
  const limits = limitsFor(plan, isRoot);

  return {
    isLoading: rolesLoading || flagsLoading || subscription.isLoading,
    isRoot,
    isAdmin,
    plan,
    limits,
    billable: isBillable(isRoot),
    can: (key: string) => canUseFeature(key, flags, plan, isRoot),
    within: (current: number, limit: number) => withinLimit(current, limit, isRoot),
  };
}
