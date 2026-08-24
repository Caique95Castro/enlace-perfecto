import { supabase } from "@/integrations/supabase/client";
import { slugify } from "@/lib/format";
import { sectionSettings } from "@/lib/sections";
import type { Couple, Wedding, WebsiteSettings, WebsiteSection, SectionType } from "@/types";
import { SECTION_ORDER, SECTION_LABELS } from "@/types";

export async function getMyCouple(): Promise<Couple | null> {
  const { data, error } = await supabase
    .from("couples")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function isSlugAvailable(slug: string, ignoreId?: string): Promise<boolean> {
  let query = supabase.from("couples").select("id").eq("slug", slug);
  if (ignoreId) query = query.neq("id", ignoreId);
  const { data, error } = await query.limit(1);
  if (error) throw error;
  return (data ?? []).length === 0;
}

async function uniqueSlug(base: string): Promise<string> {
  const root = slugify(base) || "nosso-casamento";
  let candidate = root;
  let i = 2;
  // Pequeno laço: tenta sufixos numéricos até encontrar um slug livre.
  while (!(await isSlugAvailable(candidate))) {
    candidate = `${root}-${i}`;
    i += 1;
    if (i > 50) {
      candidate = `${root}-${Date.now().toString(36)}`;
      break;
    }
  }
  return candidate;
}

export type CreateCoupleInput = {
  partner1: string;
  partner2: string;
  slug?: string;
};

export async function createCouple(input: CreateCoupleInput): Promise<Couple> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  const user = userData.user;
  if (!user) throw new Error("Sessão expirada. Faça login novamente.");

  const displayName = `${input.partner1.trim()} & ${input.partner2.trim()}`;
  const slug = await uniqueSlug(input.slug?.trim() || displayName);

  const { data: couple, error } = await supabase
    .from("couples")
    .insert({
      owner_id: user.id,
      partner_1_name: input.partner1.trim(),
      partner_2_name: input.partner2.trim(),
      display_name: displayName,
      slug,
      status: "draft",
    })
    .select("*")
    .single();
  if (error) throw error;

  await Promise.all([
    supabase
      .from("weddings")
      .insert({ couple_id: couple.id, title: `Casamento de ${displayName}` }),
    supabase.from("website_settings").insert({ couple_id: couple.id }),
    supabase.from("subscriptions").insert({ couple_id: couple.id, plan: "free", status: "active" }),
    createDefaultSections(couple.id),
  ]);

  return couple;
}

export async function createDefaultSections(coupleId: string) {
  const rows = SECTION_ORDER.map((type, index) => ({
    couple_id: coupleId,
    section_type: type,
    title: SECTION_LABELS[type],
    content: null as string | null,
    position: index,
    visible: true,
  }));
  const { error } = await supabase.from("website_sections").insert(rows);
  if (error) throw error;
}

export async function updateCouple(id: string, values: Partial<Couple>): Promise<Couple> {
  const { data, error } = await supabase
    .from("couples")
    .update(values)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function getWedding(coupleId: string): Promise<Wedding | null> {
  const { data, error } = await supabase
    .from("weddings")
    .select("*")
    .eq("couple_id", coupleId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertWedding(coupleId: string, values: Partial<Wedding>): Promise<Wedding> {
  const { data, error } = await supabase
    .from("weddings")
    .upsert({ couple_id: coupleId, ...values }, { onConflict: "couple_id" })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function getSettings(coupleId: string): Promise<WebsiteSettings | null> {
  const { data, error } = await supabase
    .from("website_settings")
    .select("*")
    .eq("couple_id", coupleId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertSettings(
  coupleId: string,
  values: Partial<WebsiteSettings>,
): Promise<WebsiteSettings> {
  const { data, error } = await supabase
    .from("website_settings")
    .upsert({ couple_id: coupleId, ...values }, { onConflict: "couple_id" })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function listSections(coupleId: string): Promise<WebsiteSection[]> {
  const { data, error } = await supabase
    .from("website_sections")
    .select("*")
    .eq("couple_id", coupleId)
    .order("position", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function updateSection(
  id: string,
  values: Partial<WebsiteSection>,
): Promise<WebsiteSection> {
  const { data, error } = await supabase
    .from("website_sections")
    .update(values)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function reorderSections(sections: { id: string; position: number }[]) {
  await Promise.all(
    sections.map((s) =>
      supabase.from("website_sections").update({ position: s.position }).eq("id", s.id),
    ),
  );
}

export function sectionByType(sections: WebsiteSection[], type: SectionType) {
  return sections.find((s) => s.section_type === type) ?? null;
}

/** Garante que todas as seções previstas existam para o casal (inclui seções novas). */
export async function ensureSections(coupleId: string): Promise<WebsiteSection[]> {
  const existing = await listSections(coupleId);
  const have = new Set(existing.map((s) => s.section_type));
  const missing = SECTION_ORDER.filter((t) => !have.has(t));
  if (missing.length > 0) {
    const base = existing.length;
    const rows = missing.map((type, i) => ({
      couple_id: coupleId,
      section_type: type,
      title: SECTION_LABELS[type],
      content: null as string | null,
      position: base + i,
      visible: true,
    }));
    const { error } = await supabase.from("website_sections").insert(rows);
    if (error) throw error;
    return listSections(coupleId);
  }
  return existing;
}

/** Salva os campos dinâmicos (jsonb) de uma seção. */
export async function updateSectionSettings(
  id: string,
  settings: Record<string, unknown>,
  values?: Partial<WebsiteSection>,
): Promise<WebsiteSection> {
  return updateSection(id, { ...(values ?? {}), settings: settings as never });
}

/**
 * Aplica os ajustes de layout de um "Layout pronto" (altura/alinhamento/tamanho do banner,
 * disposição da história e espaçamento das seções de conteúdo) às seções já existentes do
 * casal. Mescla com o `settings` (jsonb) já salvo de cada seção — nunca sobrescreve textos,
 * imagens ou outros campos que o casal já tenha personalizado.
 */
export async function applyTemplateLayout(
  sections: WebsiteSection[],
  template: {
    heroHeight: string;
    heroAlign: string;
    heroTitleSize: string;
    storyLayout: string;
    spacing: string;
  },
): Promise<void> {
  const spacedTypes = new Set([
    "story",
    "gallery",
    "event",
    "location",
    "wedding_party",
    "info",
    "rsvp",
    "gifts",
    "message",
    "dress_code",
  ]);

  const updates = sections
    .map((section) => {
      const type = section.section_type;
      const current = sectionSettings(section);
      let next: Record<string, unknown> | null = null;

      if (type === "hero") {
        next = {
          ...current,
          height: template.heroHeight,
          content_align: template.heroAlign,
          title_size: template.heroTitleSize,
        };
      } else if (type === "story") {
        next = { ...current, layout: template.storyLayout, spacing: template.spacing };
      } else if (spacedTypes.has(type)) {
        next = { ...current, spacing: template.spacing };
      }

      return next ? { id: section.id, settings: next } : null;
    })
    .filter((u): u is { id: string; settings: Record<string, unknown> } => u !== null);

  await Promise.all(updates.map((u) => updateSectionSettings(u.id, u.settings)));
}
