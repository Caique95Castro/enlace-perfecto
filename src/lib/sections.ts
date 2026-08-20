import type { WebsiteSection, SectionType } from "@/types";

export type FieldType = "text" | "textarea" | "switch" | "image" | "url" | "select" | "order";

export type FieldOption = { value: string; label: string };

export type FieldDef = {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  /** Opções para campos do tipo `select`, ou itens arrastáveis para `order`. */
  options?: FieldOption[];
  /** Valor padrão quando o campo nunca foi preenchido. */
  fallback?: string | boolean | string[];
};


/**
 * Campos próprios de cada seção. Os valores ficam em website_sections.settings (jsonb),
 * então o conteúdo do site público sempre vem do banco — nunca de texto fixo no código.
 */
export const SECTION_FIELDS: Record<SectionType, FieldDef[]> = {
  header: [
    { key: "brand", label: "Nome exibido no topo", type: "text", placeholder: "Ana & João" },
    { key: "logo_url", label: "Logo (opcional)", type: "image" },
    { key: "sticky", label: "Menu fixo ao rolar", type: "switch", fallback: true },
    { key: "transparent", label: "Fundo transparente sobre a capa", type: "switch", fallback: true },
    { key: "text_color", label: "Cor do texto do menu", type: "text", placeholder: "#ffffff" },
    { key: "show_nav", label: "Mostrar links de navegação", type: "switch", fallback: true },
    { key: "cta_label", label: "Botão do topo", type: "text", placeholder: "Confirmar presença" },
    { key: "cta_link", label: "Link do botão do topo", type: "url", placeholder: "#rsvp" },
  ],
  hero: [
    { key: "eyebrow", label: "Chamada curta", type: "text", placeholder: "Vamos nos casar" },
    { key: "headline", label: "Título", type: "text", placeholder: "Nomes do casal" },
    { key: "subheadline", label: "Subtítulo", type: "text" },
    { key: "date_text", label: "Data exibida (deixe vazio para usar a data do casamento)", type: "text" },
    { key: "image_url", label: "Imagem de fundo", type: "image" },
    { key: "overlay", label: "Escurecer imagem de fundo", type: "switch", fallback: true },
    { key: "cta_enabled", label: "Mostrar botão", type: "switch", fallback: true },
    { key: "cta_label", label: "Texto do botão", type: "text", placeholder: "Confirmar presença" },
    { key: "cta_link", label: "Link do botão", type: "url", placeholder: "#rsvp" },
    { key: "cta_secondary_label", label: "Texto do 2º botão", type: "text", placeholder: "Ver presentes" },
    { key: "cta_secondary_link", label: "Link do 2º botão", type: "url", placeholder: "#presentes" },
  ],
  countdown: [
    { key: "subtitle", label: "Subtítulo", type: "text" },
    { key: "show_days", label: "Mostrar dias", type: "switch", fallback: true },
    { key: "show_hours", label: "Mostrar horas", type: "switch", fallback: true },
    { key: "show_minutes", label: "Mostrar minutos", type: "switch", fallback: true },
    { key: "show_seconds", label: "Mostrar segundos", type: "switch", fallback: true },
  ],
  story: [
    { key: "text", label: "Nossa história (use linhas em branco para separar parágrafos)", type: "textarea" },
    { key: "image_url", label: "Imagem", type: "image" },
    { key: "show_gallery", label: "Mostrar fotos da categoria história", type: "switch", fallback: true },
    { key: "layout", label: "Layout (centro / lado)", type: "text", placeholder: "centro" },
  ],
  wedding_party: [
    { key: "description", label: "Descrição", type: "textarea" },
    { key: "groom_side_label", label: "Título do lado do noivo", type: "text", placeholder: "Padrinhos" },
    { key: "bride_side_label", label: "Título do lado da noiva", type: "text", placeholder: "Madrinhas" },
  ],
  info: [
    { key: "description", label: "Descrição", type: "textarea" },
    { key: "notes", label: "Informações importantes (uma por linha)", type: "textarea" },
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

/** Quebra um texto livre em parágrafos (linhas em branco separam blocos). */
export function paragraphsOf(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** Linhas de uma lista simples (uma por linha). */
export function linesOf(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}
