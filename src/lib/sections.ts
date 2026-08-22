import type { WebsiteSection, SectionType } from "@/types";

export type FieldType =
  "text" | "textarea" | "switch" | "image" | "url" | "select" | "order" | "color" | "heading";

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

/** Ícones disponíveis para os campos do tipo Dress Code (nomes de lucide-react). */
export const DRESS_CODE_ICON_OPTIONS: FieldOption[] = [
  { value: "Shirt", label: "Camisa" },
  { value: "Gem", label: "Joia" },
  { value: "Sparkles", label: "Brilho" },
  { value: "Watch", label: "Relógio" },
  { value: "Star", label: "Estrela" },
  { value: "AlertTriangle", label: "Alerta" },
  { value: "Info", label: "Informação" },
  { value: "Heart", label: "Coração" },
];

function iconField(key: string, label: string, fallback: string): FieldDef {
  return { key, label, type: "select", fallback, options: DRESS_CODE_ICON_OPTIONS };
}

/** Campo de espaçamento vertical, reaproveitado pelas seções de conteúdo. */
const SPACING_FIELD: FieldDef = {
  key: "spacing",
  label: "Espaçamento da seção",
  type: "select",
  fallback: "padrao",
  options: [
    { value: "compacto", label: "Compacto" },
    { value: "padrao", label: "Padrão" },
    { value: "espacoso", label: "Espaçoso" },
  ],
};

/** Campos de moldura (bordas, cantos e sombra) reaproveitados pelas seções de conteúdo. */
const BORDER_FIELDS: FieldDef[] = [
  { key: "_h_frame", label: "Moldura da seção", type: "heading" },
  {
    key: "border_style",
    label: "Borda",
    type: "select",
    fallback: "nenhuma",
    options: [
      { value: "nenhuma", label: "Sem borda" },
      { value: "fina", label: "Fina" },
      { value: "media", label: "Média" },
      { value: "tracejada", label: "Tracejada" },
    ],
  },
  { key: "border_color", label: "Cor da borda", type: "color" },
  {
    key: "border_radius",
    label: "Cantos arredondados",
    type: "select",
    fallback: "medio",
    options: [
      { value: "nenhum", label: "Retos" },
      { value: "pequeno", label: "Levemente arredondados" },
      { value: "medio", label: "Arredondados" },
      { value: "grande", label: "Bem arredondados" },
    ],
  },
  {
    key: "border_shadow",
    label: "Sombra suave",
    type: "select",
    fallback: "nenhuma",
    options: [
      { value: "nenhuma", label: "Sem sombra" },
      { value: "suave", label: "Suave" },
      { value: "media", label: "Média" },
    ],
  },
  { key: "frame_bg", label: "Cor de fundo do quadro", type: "color" },
  {
    key: "frame_padding",
    label: "Espaço interno do quadro",
    type: "select",
    fallback: "medio",
    options: [
      { value: "pequeno", label: "Pequeno" },
      { value: "medio", label: "Médio" },
      { value: "grande", label: "Grande" },
    ],
  },
];

/**
 * Campos próprios de cada seção. Os valores ficam em website_sections.settings (jsonb),
 * então o conteúdo do site público sempre vem do banco — nunca de texto fixo no código.
 */
export const SECTION_FIELDS: Record<SectionType, FieldDef[]> = {
  header: [
    { key: "brand", label: "Nome exibido no topo", type: "text", placeholder: "Ana & João" },
    { key: "logo_url", label: "Logo (opcional)", type: "image" },
    { key: "sticky", label: "Menu fixo ao rolar", type: "switch", fallback: true },
    {
      key: "transparent",
      label: "Fundo transparente sobre a capa",
      type: "switch",
      fallback: true,
    },
    { key: "text_color", label: "Cor do texto do menu", type: "text", placeholder: "#ffffff" },
    { key: "show_nav", label: "Mostrar links de navegação", type: "switch", fallback: true },
    { key: "cta_label", label: "Botão do topo", type: "text", placeholder: "Confirmar presença" },
    { key: "cta_link", label: "Link do botão do topo", type: "url", placeholder: "#rsvp" },
  ],
  hero: [
    { key: "eyebrow", label: "Chamada curta", type: "text", placeholder: "Vamos nos casar" },
    { key: "headline", label: "Título", type: "text", placeholder: "Nomes do casal" },
    { key: "subheadline", label: "Subtítulo", type: "text" },
    {
      key: "date_text",
      label: "Data exibida (deixe vazio para usar a data do casamento)",
      type: "text",
    },
    { key: "image_url", label: "Imagem de fundo", type: "image" },
    { key: "overlay", label: "Escurecer imagem de fundo", type: "switch", fallback: true },
    { key: "cta_enabled", label: "Mostrar botão", type: "switch", fallback: true },
    { key: "cta_label", label: "Texto do botão", type: "text", placeholder: "Confirmar presença" },
    { key: "cta_link", label: "Link do botão", type: "url", placeholder: "#rsvp" },
    {
      key: "cta_secondary_label",
      label: "Texto do 2º botão",
      type: "text",
      placeholder: "Ver presentes",
    },
    {
      key: "cta_secondary_link",
      label: "Link do 2º botão",
      type: "url",
      placeholder: "#presentes",
    },
    {
      key: "height",
      label: "Altura do banner",
      type: "select",
      fallback: "padrao",
      options: [
        { value: "compacto", label: "Compacto" },
        { value: "padrao", label: "Padrão" },
        { value: "grande", label: "Grande" },
        { value: "tela_cheia", label: "Tela cheia" },
      ],
    },
    {
      key: "content_align",
      label: "Alinhamento do texto",
      type: "select",
      fallback: "centro",
      options: [
        { value: "esquerda", label: "Esquerda" },
        { value: "centro", label: "Centro" },
        { value: "direita", label: "Direita" },
      ],
    },
    {
      key: "title_size",
      label: "Tamanho do título",
      type: "select",
      fallback: "grande",
      options: [
        { value: "medio", label: "Médio" },
        { value: "grande", label: "Grande" },
        { value: "extra_grande", label: "Extra grande" },
      ],
    },
  ],
  countdown: [
    { key: "subtitle", label: "Subtítulo", type: "text" },
    { key: "show_days", label: "Mostrar dias", type: "switch", fallback: true },
    { key: "show_hours", label: "Mostrar horas", type: "switch", fallback: true },
    { key: "show_minutes", label: "Mostrar minutos", type: "switch", fallback: true },
    { key: "show_seconds", label: "Mostrar segundos", type: "switch", fallback: true },
  ],
  story: [
    {
      key: "text",
      label: "Nossa história (use linhas em branco para separar parágrafos)",
      type: "textarea",
    },
    { key: "image_url", label: "Imagem", type: "image" },
    {
      key: "show_gallery",
      label: "Mostrar fotos da categoria história",
      type: "switch",
      fallback: true,
    },
    {
      key: "layout",
      label: "Disposição da imagem e do texto",
      type: "select",
      fallback: "stacked",
      options: [
        { value: "stacked", label: "Empilhado (imagem em cima, texto embaixo)" },
        { value: "side", label: "Lado a lado (imagem e texto na mesma linha)" },
      ],
    },
    {
      key: "media_order",
      label: "Arraste para definir a ordem",
      type: "order",
      fallback: ["image", "text"],
      options: [
        { value: "image", label: "Imagem" },
        { value: "text", label: "Texto" },
      ],
    },
    {
      key: "align",
      label: "Alinhamento do texto",
      type: "select",
      fallback: "center",
      options: [
        { value: "center", label: "Centralizado" },
        { value: "left", label: "À esquerda" },
      ],
    },
    SPACING_FIELD,
    ...BORDER_FIELDS,
  ],
  wedding_party: [
    { key: "description", label: "Descrição", type: "textarea" },
    {
      key: "groom_side_label",
      label: "Título do lado do noivo",
      type: "text",
      placeholder: "Padrinhos",
    },
    {
      key: "bride_side_label",
      label: "Título do lado da noiva",
      type: "text",
      placeholder: "Madrinhas",
    },
    SPACING_FIELD,
    ...BORDER_FIELDS,
  ],
  info: [
    { key: "description", label: "Descrição", type: "textarea" },
    { key: "notes", label: "Informações importantes (uma por linha)", type: "textarea" },
    SPACING_FIELD,
    ...BORDER_FIELDS,
  ],
  event: [
    { key: "venue_name", label: "Local da cerimônia", type: "text" },
    { key: "address", label: "Endereço", type: "text" },
    { key: "time", label: "Horário", type: "text" },
    { key: "description", label: "Descrição", type: "textarea" },
    { key: "map_url", label: "Link do mapa", type: "url" },
    SPACING_FIELD,
    ...BORDER_FIELDS,
  ],
  location: [
    { key: "venue_name", label: "Nome do local", type: "text" },
    { key: "address", label: "Endereço", type: "text" },
    { key: "map_url", label: "Link do mapa", type: "url" },
    SPACING_FIELD,
    ...BORDER_FIELDS,
  ],
  dress_code: [
    { key: "_h_content", label: "Conteúdo", type: "heading" },
    {
      key: "description",
      label: "Subtítulo / descrição",
      type: "textarea",
      placeholder: "Queremos que você se sinta confortável e elegante para celebrar conosco.",
    },
    {
      key: "dress_type",
      label: "Tipo de traje",
      type: "select",
      fallback: "social",
      options: [
        { value: "social", label: "Traje Social" },
        { value: "esporte_fino", label: "Esporte Fino" },
        { value: "formal", label: "Traje Formal" },
        { value: "black_tie", label: "Black Tie" },
        { value: "casual", label: "Casual" },
        { value: "casual_chic", label: "Casual Chic" },
        { value: "personalizado", label: "Personalizado" },
      ],
    },
    {
      key: "dress_type_custom",
      label: "Nome do traje personalizado (usado quando 'Personalizado' está selecionado)",
      type: "text",
    },
    { key: "_h_men", label: "Homens", type: "heading" },
    { key: "show_men", label: "Mostrar orientação para homens", type: "switch", fallback: true },
    { key: "men_title", label: "Título", type: "text", placeholder: "Homens" },
    {
      key: "men_description",
      label: "Descrição",
      type: "textarea",
      placeholder: "Terno, costume ou traje social.",
    },
    iconField("men_icon", "Ícone", "Shirt"),
    { key: "_h_women", label: "Mulheres", type: "heading" },
    {
      key: "show_women",
      label: "Mostrar orientação para mulheres",
      type: "switch",
      fallback: true,
    },
    { key: "women_title", label: "Título", type: "text", placeholder: "Mulheres" },
    {
      key: "women_description",
      label: "Descrição",
      type: "textarea",
      placeholder: "Vestido, conjunto ou traje social.",
    },
    iconField("women_icon", "Ícone", "Gem"),
    { key: "_h_important", label: "Observação", type: "heading" },
    { key: "show_important", label: "Mostrar observação", type: "switch", fallback: true },
    { key: "important_title", label: "Título", type: "text", placeholder: "Importante" },
    {
      key: "important_description",
      label: "Texto",
      type: "textarea",
      placeholder: "Evite branco e tons muito próximos ao branco.",
    },
    iconField("important_icon", "Ícone", "AlertTriangle"),
    { key: "_h_image", label: "Imagem", type: "heading" },
    { key: "show_image", label: "Mostrar imagem", type: "switch", fallback: false },
    { key: "image_url", label: "Imagem", type: "image" },
    {
      key: "image_fit",
      label: "Ajuste da imagem",
      type: "select",
      fallback: "cover",
      options: [
        { value: "cover", label: "Preencher (cortar bordas)" },
        { value: "contain", label: "Conter (mostrar tudo)" },
      ],
    },
    {
      key: "image_position",
      label: "Posição da imagem",
      type: "select",
      fallback: "centro",
      options: [
        { value: "centro", label: "Centro" },
        { value: "centro_superior", label: "Centro superior" },
        { value: "centro_inferior", label: "Centro inferior" },
        { value: "esquerda", label: "Esquerda" },
        { value: "direita", label: "Direita" },
      ],
    },
    {
      key: "image_radius",
      label: "Bordas da imagem",
      type: "select",
      fallback: "grande",
      options: [
        { value: "nenhum", label: "Sem arredondamento" },
        { value: "pequeno", label: "Levemente arredondada" },
        { value: "grande", label: "Bem arredondada" },
        { value: "circular", label: "Circular" },
      ],
    },
    { key: "_h_layout", label: "Layout", type: "heading" },
    {
      key: "layout",
      label: "Layout",
      type: "select",
      fallback: "centralizado",
      options: [
        { value: "centralizado", label: "Centralizado (imagem em cima, se houver)" },
        { value: "imagem_esquerda", label: "Imagem à esquerda" },
        { value: "imagem_direita", label: "Imagem à direita" },
      ],
    },
    { key: "_h_appearance", label: "Aparência", type: "heading" },
    {
      key: "align",
      label: "Alinhamento",
      type: "select",
      fallback: "centro",
      options: [
        { value: "esquerda", label: "Esquerda" },
        { value: "centro", label: "Centro" },
        { value: "direita", label: "Direita" },
      ],
    },
    {
      key: "title_size",
      label: "Tamanho do título",
      type: "select",
      fallback: "grande",
      options: [
        { value: "medio", label: "Médio" },
        { value: "grande", label: "Grande" },
        { value: "extra_grande", label: "Extra grande" },
      ],
    },
    { key: "bg_color", label: "Cor de fundo", type: "color" },
    { key: "title_color", label: "Cor do título", type: "color" },
    { key: "text_color", label: "Cor do texto", type: "color" },
    { key: "accent_color", label: "Cor de destaque (traje)", type: "color" },
    { key: "icon_color", label: "Cor dos ícones", type: "color" },
    SPACING_FIELD,
    ...BORDER_FIELDS,
  ],
  gallery: [{ key: "description", label: "Descrição", type: "textarea" }, SPACING_FIELD, ...BORDER_FIELDS],
  rsvp: [
    { key: "description", label: "Descrição", type: "textarea" },
    { key: "cta_label", label: "Texto do botão", type: "text", placeholder: "Confirmar presença" },
    SPACING_FIELD,
    ...BORDER_FIELDS,
  ],
  gifts: [{ key: "description", label: "Descrição", type: "textarea" }, SPACING_FIELD, ...BORDER_FIELDS],
  message: [{ key: "description", label: "Descrição", type: "textarea" }, SPACING_FIELD, ...BORDER_FIELDS],
  footer: [
    { key: "text", label: "Texto do rodapé", type: "textarea" },
    { key: "instagram", label: "Instagram", type: "url" },
    { key: "whatsapp", label: "WhatsApp", type: "url" },
  ],
};

/** Campos extras da recepção ficam na seção de cerimônia quando não há seção própria. */
export type SectionSettings = Record<string, unknown>;

export function sectionSettings(
  section: Pick<WebsiteSection, "settings"> | null | undefined,
): SectionSettings {
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

/** Valor de um campo `select`, com fallback quando ainda não foi escolhido. */
export function fieldChoice(
  section: Pick<WebsiteSection, "settings"> | null | undefined,
  key: string,
  fallback: string,
): string {
  const value = sectionSettings(section)[key];
  return typeof value === "string" && value ? value : fallback;
}

/** Ordem salva de um campo `order` (lista arrastável), normalizada contra os itens válidos. */
export function fieldOrder(
  section: Pick<WebsiteSection, "settings"> | null | undefined,
  key: string,
  fallback: string[],
): string[] {
  const value = sectionSettings(section)[key];
  const saved = Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
  const valid = saved.filter((v) => fallback.includes(v));
  return [...valid, ...fallback.filter((v) => !valid.includes(v))];
}

/** Classe + estilo do quadro (borda/cantos/sombra) configurado numa seção. */
export function sectionFrame(
  section: Pick<WebsiteSection, "settings"> | null | undefined,
): { className: string; style: Record<string, string> } | null {
  const style = fieldChoice(section, "border_style", "nenhuma");
  const shadow = fieldChoice(section, "border_shadow", "nenhuma");
  const bg = fieldText(section, "frame_bg");
  if (style === "nenhuma" && shadow === "nenhuma" && !bg) return null;

  const radius =
    { nenhum: "rounded-none", pequeno: "rounded-md", medio: "rounded-xl", grande: "rounded-3xl" }[
      fieldChoice(section, "border_radius", "medio")
    ] ?? "rounded-xl";
  const padding =
    { pequeno: "p-4 sm:p-5", medio: "p-6 sm:p-8", grande: "p-8 sm:p-12" }[
      fieldChoice(section, "frame_padding", "medio")
    ] ?? "p-6 sm:p-8";
  const shadowClass =
    { nenhuma: "", suave: "shadow-sm", media: "shadow-md" }[shadow] ?? "";
  const borderClass =
    {
      nenhuma: "",
      fina: "border",
      media: "border-2",
      tracejada: "border border-dashed",
    }[style] ?? "";

  const css: Record<string, string> = {};
  const color = fieldText(section, "border_color");
  if (color && borderClass) css["borderColor"] = color;
  if (bg) css["backgroundColor"] = bg;

  return {
    className: [radius, padding, shadowClass, borderClass].filter(Boolean).join(" "),
    style: css,
  };
}
