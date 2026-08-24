import type { Database } from "@/integrations/supabase/types";

type T = Database["public"]["Tables"];

export type Profile = T["profiles"]["Row"];
export type Couple = T["couples"]["Row"];
export type Wedding = T["weddings"]["Row"];
export type WebsiteSettings = T["website_settings"]["Row"];
export type WebsiteSection = T["website_sections"]["Row"];
export type Photo = T["photos"]["Row"];
export type Guest = T["guests"]["Row"];
export type Rsvp = T["rsvps"]["Row"];
export type GiftItem = T["gift_items"]["Row"];
export type GiftOrder = T["gift_orders"]["Row"];
export type Payment = T["payments"]["Row"];
export type Subscription = T["subscriptions"]["Row"];
export type GuestMessage = T["guest_messages"]["Row"];
export type FeatureFlag = T["feature_flags"]["Row"];
export type SiteEvent = T["site_events"]["Row"];
export type Notification = T["notifications"]["Row"];
export type MessageStatus = "pending" | "approved" | "hidden";
export type AppRole = "user" | "admin" | "root";
export type PlanTier = "free" | "premium" | "premium_plus";

export type GuestStatus = "pending" | "confirmed" | "declined";
export type SectionType =
  | "header"
  | "hero"
  | "story"
  | "countdown"
  | "gallery"
  | "event"
  | "wedding_party"
  | "location"
  | "dress_code"
  | "info"
  | "rsvp"
  | "gifts"
  | "message"
  | "footer";

export const SECTION_LABELS: Record<SectionType, string> = {
  header: "Cabeçalho e navegação",
  hero: "Capa (banner)",
  story: "Nossa história",
  countdown: "Contagem regressiva",
  gallery: "Galeria",
  event: "Cerimônia e recepção",
  wedding_party: "Padrinhos e madrinhas",
  location: "Local",
  dress_code: "Dress code",
  info: "Informações importantes",
  rsvp: "Confirmação de presença",
  gifts: "Lista de presentes",
  message: "Mural de recados",
  footer: "Rodapé",
};

export const SECTION_ORDER: SectionType[] = [
  "header",
  "hero",
  "countdown",
  "story",
  "gallery",
  "event",
  "wedding_party",
  "location",
  "dress_code",
  "info",
  "rsvp",
  "gifts",
  "message",
  "footer",
];

export type TemplateSlug =
  | "elegante"
  | "romantico"
  | "minimalista"
  | "boho"
  | "tropical"
  | "vintage"
  | "moderno"
  | "praia"
  | "jardim"
  | "industrial"
  | "cha_de_jardim"
  | "classico_preto"
  | "dourado_noturno"
  | "aquarela"
  | "rustico_chique"
  | "urbano"
  | "provencal";

export type TemplateHeroHeight = "compacto" | "padrao" | "grande" | "tela_cheia";
export type TemplateHeroAlign = "esquerda" | "centro" | "direita";
export type TemplateHeroTitleSize = "medio" | "grande" | "extra_grande";
export type TemplateStoryLayout = "stacked" | "side";
export type TemplateSpacing = "compacto" | "padrao" | "espacoso";

export type Template = {
  slug: TemplateSlug;
  name: string;
  description: string;
  primary: string;
  secondary: string;
  background: string;
  heading: string;
  body: string;
  /** Altura do banner que este layout aplica de cara. */
  heroHeight: TemplateHeroHeight;
  /** Alinhamento do texto do banner. */
  heroAlign: TemplateHeroAlign;
  /** Tamanho do título do banner. */
  heroTitleSize: TemplateHeroTitleSize;
  /** Disposição padrão da seção "Nossa história". */
  storyLayout: TemplateStoryLayout;
  /** Espaçamento vertical aplicado às seções de conteúdo. */
  spacing: TemplateSpacing;
};

export const TEMPLATES: Template[] = [
  {
    slug: "elegante",
    name: "Elegante",
    description: "Serifas clássicas, tons de areia e dourado suave.",
    primary: "#8a6f52",
    secondary: "#c9b8a3",
    background: "#fbf8f4",
    heading: "Cormorant Garamond",
    body: "Karla",
    heroHeight: "padrao",
    heroAlign: "centro",
    heroTitleSize: "grande",
    storyLayout: "stacked",
    spacing: "padrao",
  },
  {
    slug: "romantico",
    name: "Romântico",
    description: "Rosé delicado, curvas suaves e atmosfera afetuosa.",
    primary: "#b06a76",
    secondary: "#e8c9cf",
    background: "#fdf6f6",
    heading: "Cormorant Garamond",
    body: "Karla",
    heroHeight: "grande",
    heroAlign: "centro",
    heroTitleSize: "extra_grande",
    storyLayout: "side",
    spacing: "espacoso",
  },
  {
    slug: "minimalista",
    name: "Minimalista",
    description: "Preto e branco, muito respiro e tipografia limpa.",
    primary: "#2f2f2f",
    secondary: "#8f8f8f",
    background: "#ffffff",
    heading: "Karla",
    body: "Karla",
    heroHeight: "compacto",
    heroAlign: "esquerda",
    heroTitleSize: "medio",
    storyLayout: "stacked",
    spacing: "compacto",
  },
  {
    slug: "boho",
    name: "Boho",
    description: "Terracota e verde-oliva, clima descontraído ao ar livre.",
    primary: "#a8623f",
    secondary: "#8a9a6f",
    background: "#faf3e8",
    heading: "Playfair Display",
    body: "Nunito",
    heroHeight: "grande",
    heroAlign: "centro",
    heroTitleSize: "grande",
    storyLayout: "side",
    spacing: "espacoso",
  },
  {
    slug: "tropical",
    name: "Tropical",
    description: "Verde-esmeralda e coral, energia leve e ensolarada.",
    primary: "#1f6f57",
    secondary: "#f2a488",
    background: "#f7fbf6",
    heading: "Fraunces",
    body: "Mulish",
    heroHeight: "tela_cheia",
    heroAlign: "centro",
    heroTitleSize: "extra_grande",
    storyLayout: "stacked",
    spacing: "padrao",
  },
  {
    slug: "vintage",
    name: "Vintage",
    description: "Mostarda e azul-petróleo, charme de outra época.",
    primary: "#c08a2e",
    secondary: "#3b6b73",
    background: "#f7f1e3",
    heading: "EB Garamond",
    body: "Lato",
    heroHeight: "padrao",
    heroAlign: "esquerda",
    heroTitleSize: "grande",
    storyLayout: "side",
    spacing: "padrao",
  },
  {
    slug: "moderno",
    name: "Moderno",
    description: "Grafite e lavanda, linhas contemporâneas e sofisticadas.",
    primary: "#4a4560",
    secondary: "#b7b0d8",
    background: "#f9f8fc",
    heading: "Marcellus",
    body: "Inter",
    heroHeight: "compacto",
    heroAlign: "esquerda",
    heroTitleSize: "medio",
    storyLayout: "side",
    spacing: "compacto",
  },
  {
    slug: "praia",
    name: "Praia",
    description: "Azul-turquesa e areia clara, brisa e leveza.",
    primary: "#2f8f9d",
    secondary: "#e8d5b5",
    background: "#f7fbfc",
    heading: "Fraunces",
    body: "Nunito",
    heroHeight: "tela_cheia",
    heroAlign: "centro",
    heroTitleSize: "extra_grande",
    storyLayout: "stacked",
    spacing: "espacoso",
  },
  {
    slug: "jardim",
    name: "Jardim",
    description: "Verde-folha e branco, natural e florido.",
    primary: "#4c7a4a",
    secondary: "#cfe0c6",
    background: "#fbfdf8",
    heading: "Playfair Display",
    body: "Karla",
    heroHeight: "grande",
    heroAlign: "centro",
    heroTitleSize: "grande",
    storyLayout: "side",
    spacing: "padrao",
  },
  {
    slug: "industrial",
    name: "Industrial",
    description: "Cinza-chumbo e cobre, clima de loft urbano.",
    primary: "#6b5b4f",
    secondary: "#3d3d3d",
    background: "#f2f0ed",
    heading: "Marcellus",
    body: "Inter",
    heroHeight: "padrao",
    heroAlign: "direita",
    heroTitleSize: "grande",
    storyLayout: "side",
    spacing: "compacto",
  },
  {
    slug: "cha_de_jardim",
    name: "Chá de Jardim",
    description: "Rosa-empoeirado e verde-sálvia, delicadeza de fim de tarde.",
    primary: "#c48a93",
    secondary: "#a3b18a",
    background: "#fdf9f4",
    heading: "Cormorant Garamond",
    body: "Nunito",
    heroHeight: "padrao",
    heroAlign: "centro",
    heroTitleSize: "grande",
    storyLayout: "stacked",
    spacing: "espacoso",
  },
  {
    slug: "classico_preto",
    name: "Clássico Preto",
    description: "Preto e branco com um toque de dourado, formal e atemporal.",
    primary: "#141414",
    secondary: "#b8974f",
    background: "#ffffff",
    heading: "EB Garamond",
    body: "Lato",
    heroHeight: "grande",
    heroAlign: "centro",
    heroTitleSize: "extra_grande",
    storyLayout: "stacked",
    spacing: "padrao",
  },
  {
    slug: "dourado_noturno",
    name: "Dourado Noturno",
    description: "Azul-marinho profundo e dourado, cerimônia à noite.",
    primary: "#c9a84c",
    secondary: "#1c2740",
    background: "#f7f6f2",
    heading: "Playfair Display",
    body: "Inter",
    heroHeight: "tela_cheia",
    heroAlign: "centro",
    heroTitleSize: "extra_grande",
    storyLayout: "side",
    spacing: "espacoso",
  },
  {
    slug: "aquarela",
    name: "Aquarela",
    description: "Lilás e rosa suaves, traços delicados de aquarela.",
    primary: "#9b7fb0",
    secondary: "#f0c3c9",
    background: "#fdfaff",
    heading: "Cormorant Garamond",
    body: "Mulish",
    heroHeight: "padrao",
    heroAlign: "centro",
    heroTitleSize: "grande",
    storyLayout: "side",
    spacing: "espacoso",
  },
  {
    slug: "rustico_chique",
    name: "Rústico Chique",
    description: "Marrom-café e creme, madeira e conforto.",
    primary: "#6f4e37",
    secondary: "#d9c7a3",
    background: "#faf6ef",
    heading: "Fraunces",
    body: "Lato",
    heroHeight: "grande",
    heroAlign: "esquerda",
    heroTitleSize: "grande",
    storyLayout: "side",
    spacing: "padrao",
  },
  {
    slug: "urbano",
    name: "Urbano",
    description: "Preto e vermelho-queimado, atitude contemporânea.",
    primary: "#b3402f",
    secondary: "#262626",
    background: "#f5f4f2",
    heading: "Marcellus",
    body: "Inter",
    heroHeight: "compacto",
    heroAlign: "direita",
    heroTitleSize: "medio",
    storyLayout: "stacked",
    spacing: "compacto",
  },
  {
    slug: "provencal",
    name: "Provençal",
    description: "Lavanda e amarelo-sol, campos da Provença.",
    primary: "#7c6a9c",
    secondary: "#e8c25f",
    background: "#faf8f2",
    heading: "Playfair Display",
    body: "Nunito",
    heroHeight: "padrao",
    heroAlign: "centro",
    heroTitleSize: "grande",
    storyLayout: "stacked",
    spacing: "padrao",
  },
];

/** Dados completos do site público. */
export type PublicWeddingData = {
  couple: Pick<Couple, "id" | "display_name" | "partner_1_name" | "partner_2_name" | "slug">;
  wedding: Wedding | null;
  settings: WebsiteSettings;
  sections: WebsiteSection[];
  photos: Photo[];
  gifts: GiftItem[];
  messages: Pick<GuestMessage, "id" | "author_name" | "message" | "photo_url" | "created_at">[];
};
