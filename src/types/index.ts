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
  | "hero"
  | "story"
  | "countdown"
  | "gallery"
  | "event"
  | "location"
  | "dress_code"
  | "rsvp"
  | "gifts"
  | "message"
  | "footer";

export const SECTION_LABELS: Record<SectionType, string> = {
  hero: "Capa",
  story: "Nossa história",
  countdown: "Contagem regressiva",
  gallery: "Galeria",
  event: "Cerimônia",
  location: "Local",
  dress_code: "Dress code",
  rsvp: "Confirmação de presença",
  gifts: "Lista de presentes",
  message: "Mensagem aos convidados",
  footer: "Rodapé",
};

export const SECTION_ORDER: SectionType[] = [
  "hero",
  "countdown",
  "story",
  "gallery",
  "event",
  "location",
  "dress_code",
  "rsvp",
  "gifts",
  "message",
  "footer",
];

export type TemplateSlug = "elegante" | "romantico" | "minimalista";

export const TEMPLATES: {
  slug: TemplateSlug;
  name: string;
  description: string;
  primary: string;
  secondary: string;
  background: string;
  heading: string;
  body: string;
}[] = [
  {
    slug: "elegante",
    name: "Elegante",
    description: "Serifas clássicas, tons de areia e dourado suave.",
    primary: "#8a6f52",
    secondary: "#c9b8a3",
    background: "#fbf8f4",
    heading: "Cormorant Garamond",
    body: "Karla",
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

