/**
 * Fonte única de verdade para planos, limites e liberação de recursos.
 * Regra central: conta ROOT ignora plano, assinatura, cobrança e limites.
 * A autorização real acontece no banco (funções is_root / can_use_feature).
 */
import type { FeatureFlag, PlanTier } from "@/types";

export const PLAN_RANK: Record<PlanTier, number> = {
  free: 1,
  premium: 2,
  premium_plus: 3,
};

export type UsageLimits = {
  guests: number;
  photos: number;
  giftItems: number;
  customDomain: boolean;
  removeBranding: boolean;
};

const LIMITS: Record<PlanTier, UsageLimits> = {
  free: { guests: 50, photos: 15, giftItems: 10, customDomain: false, removeBranding: false },
  premium: { guests: 300, photos: 80, giftItems: 60, customDomain: false, removeBranding: true },
  premium_plus: {
    guests: Infinity,
    photos: Infinity,
    giftItems: Infinity,
    customDomain: true,
    removeBranding: true,
  },
};

const UNLIMITED: UsageLimits = {
  guests: Infinity,
  photos: Infinity,
  giftItems: Infinity,
  customDomain: true,
  removeBranding: true,
};

export function effectivePlan(plan: string | null | undefined, isRoot: boolean): PlanTier {
  if (isRoot) return "premium_plus";
  const value = (plan ?? "free") as PlanTier;
  return value in PLAN_RANK ? value : "free";
}

export function limitsFor(plan: PlanTier, isRoot: boolean): UsageLimits {
  return isRoot ? UNLIMITED : LIMITS[plan];
}

/** Root sempre pode. Demais dependem da flag global e do plano mínimo. */
export function canUseFeature(
  key: string,
  flags: FeatureFlag[],
  plan: PlanTier,
  isRoot: boolean,
): boolean {
  if (isRoot) return true;
  const flag = flags.find((f) => f.key === key);
  if (!flag) return true;
  if (!flag.enabled) return false;
  return PLAN_RANK[plan] >= PLAN_RANK[(flag.min_plan as PlanTier) ?? "free"];
}

/** Root nunca esbarra em limite de uso. */
export function withinLimit(current: number, limit: number, isRoot: boolean): boolean {
  return isRoot || current < limit;
}

/** Root nunca é cobrado. */
export function isBillable(isRoot: boolean): boolean {
  return !isRoot;
}
