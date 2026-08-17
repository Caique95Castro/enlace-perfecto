import type { WebsiteSection, SectionType } from "@/types";

export type FieldType = "text" | "textarea" | "switch" | "image" | "url";

export type FieldDef = {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  /** Valor padrão quando o campo nunca foi preenchido. */
  fallback?: string | boolean;
};

/**
 * Campos próprios de cada seção. Os valores ficam em website_sections.settings (jsonb),
 * então o conteúdo do site público sempre vem do banco — nunca de texto fixo no código.
 */
export const SECTION_FIELDS: Record<SectionType, FieldDef[]> = {
  hero: [
    { key: "eyebrow", label: "Chamada curta", type: "text", placeholder: "Vamos nos casar" },
    { key: "headline", label: "Título", type: "text", placeholder: "Nomes do casal" },
    { key: "subheadline", label: "Subtítulo", type: "text" },
    { key: "image_url", label: "Imagem de capa (URL)", type: "image" },
    { key: "cta_enabled", label: "Mostrar botão", type: "switch", fallback: true },
    { key: "cta_label", label: "Texto do botão", type: "text", placeholder: "Confirmar presença" },
    { key: "cta_link", label: "Link do botão", type: "url", placeholder: "#rsvp" },
  ],
  countdown: [
    { key: "subtitle", label: "Subtítulo", type: "text" },
    { key: "show_days", label: "Mostrar dias", type: "switch", fallback: true },
    { key: "show_hours", label: "Mostrar horas", type: "switch", fallback: true },
    { key: "show_minutes", label: "Mostrar minutos", type: "switch", fallback: true },
    { key: "show_seconds", label: "Mostrar segundos", type: "switch", fallback: true },
  ],
  story: [
    { key: "text", label: "Nossa história", type: "textarea" },
    { key: "image_url", label: "Imagem (URL)", type: "image" },
    { key: "layout", label: "Layout (centro / lado)", type: "text", placeholder: "centro" },
  ],
  event: [
    { key: "venue_name", label: "Local da cerimônia", type: "text" },
    { key: "address", label: "Endereço", type: "text" },
    { key: "time", label: "Horário", type: "text" },
    { key: "description", label: "Descrição", type: "textarea" },
    { key: "map_url", label: "Link do mapa", type: "url" },
  ],
  location: [
    { key: "venue_name", label: "Nome do local", type: "text" },
    { key: "address", label: "Endereço", type: "text" },
    { key: "map_url", label: "Link do mapa", type: "url" },
  ],
  dress_code: [
    { key: "description", label: "Descrição", type: "textarea" },
    { key: "guidelines", label: "Orientações", type: "textarea" },
  ],
  gallery: [{ key: "description", label: "Descrição", type: "textarea" }],
  rsvp: [
    { key: "description", label: "Descrição", type: "textarea" },
    { key: "cta_label", label: "Texto do botão", type: "text", placeholder: "Confirmar presença" },
  ],
  gifts: [{ key: "description", label: "Descrição", type: "textarea" }],
  message: [{ key: "description", label: "Descrição", type: "textarea" }],
  footer: [
    { key: "text", label: "Texto do rodapé", type: "textarea" },
    { key: "instagram", label: "Instagram", type: "url" },
    { key: "whatsapp", label: "WhatsApp", type: "url" },
  ],
};

/** Campos extras da recepção ficam na seção de cerimônia quando não há seção própria. */
export type SectionSettings = Record<string, unknown>;

export function sectionSettings(section: Pick<WebsiteSection, "settings"> | null | undefined): SectionSettings {
  const raw = section?.settings;
  return raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as SectionSettings) : {};
}

export function fieldText(
  section: Pick<WebsiteSection, "settings"> | null | undefined,
  key: string,
): string {
  const value = sectionSettings(section)[key];
  return typeof value === "string" ? value.trim() : "";
}

export function fieldBool(
  section: Pick<WebsiteSection, "settings"> | null | undefined,
  key: string,
  fallback = true,
): boolean {
  const value = sectionSettings(section)[key];
  return typeof value === "boolean" ? value : fallback;
}
