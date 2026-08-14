import { supabase } from "@/integrations/supabase/client";
import type { FeatureFlag } from "@/types";

export async function listFeatureFlags(): Promise<FeatureFlag[]> {
  const { data, error } = await supabase.from("feature_flags").select("*").order("key");
  if (error) throw error;
  return data ?? [];
}

/** Ligar/desligar globalmente — permitido apenas para admin/root pelas policies. */
export async function setFeatureFlag(key: string, enabled: boolean) {
  const { error } = await supabase.from("feature_flags").update({ enabled }).eq("key", key);
  if (error) throw error;
}
