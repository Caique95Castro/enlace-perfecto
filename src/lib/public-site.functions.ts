import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { PublicWeddingData } from "@/types";

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const url = process.env["SUPABASE_URL"]!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

/** Busca pública (somente casamentos publicados) para SSR/SEO do site do casal. */
export const getPublicWedding = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => ({ slug: String(data.slug) }))
  .handler(async ({ data }): Promise<PublicWeddingData | null> => {
    const supabase = publicClient();

    const { data: couple } = await supabase
      .from("couples")
      .select("id, display_name, partner_1_name, partner_2_name, slug")
      .eq("slug", data.slug)
      .maybeSingle();
    if (!couple) return null;

    const { data: settings } = await supabase
      .from("website_settings")
      .select("*")
      .eq("couple_id", couple.id)
      .eq("published", true)
      .maybeSingle();
    if (!settings) return null;

    const [wedding, sections, photos, gifts] = await Promise.all([
      supabase.from("weddings").select("*").eq("couple_id", couple.id).maybeSingle(),
      supabase
        .from("website_sections")
        .select("*")
        .eq("couple_id", couple.id)
        .order("position", { ascending: true }),
      supabase
        .from("photos")
        .select("*")
        .eq("couple_id", couple.id)
        .order("position", { ascending: true }),
      supabase
        .from("gift_items")
        .select("*")
        .eq("couple_id", couple.id)
        .eq("active", true)
        .order("created_at", { ascending: true }),
    ]);

    return {
      couple,
      wedding: wedding.data ?? null,
      settings,
      sections: sections.data ?? [],
      photos: photos.data ?? [],
      gifts: gifts.data ?? [],
    };
  });
