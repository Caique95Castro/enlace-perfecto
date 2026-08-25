import type { SectionType, WebsiteSection } from "@/types";
import { fieldText, sectionSettings } from "@/lib/sections";

/**
 * BIBLIOTECA DE LAYOUTS PRONTOS (camada adicional — não substitui o editor).
 *
 * Um "layout pronto" é apenas um pacote de configurações visuais que é mesclado
 * dentro do `settings` (jsonb) das seções que já existem, mais (opcionalmente) as
 * cores/fontes de `website_settings`. Nenhum texto, foto, data ou dado do casamento
 * é tocado: os presets só escrevem chaves visuais já reconhecidas pelo renderizador
 * (`spacing`, `border_*`, `frame_*`, `layout`, `align`, `height`, `mode`, etc.) mais
 * duas chaves próprias:
 *
 * - `_skin`   → estilo decorativo aplicado à seção (papel, aquarela, botânico…)
 * - `_preset` → id do modelo aplicado (para destacar o escolhido no painel)
 *
 * Antes da primeira aplicação, o `settings` original de cada seção é copiado para
 * `_preset_backup`, o que permite o botão "Restaurar visual original" sem perder nada.
 */

export type SkinId = "none" | "botanical" | "romantic" | "minimal" | "editorial" | "classic";

export type PresetPatch = Record<string, unknown>;

export type LayoutPreset = {
  id: string;
  name: string;
  emoji: string;
  description: string;
  skin: SkinId;
  features: string[];
  style: {
    primary_color: string;
    secondary_color: string;
    background_color: string;
    heading_font: string;
    body_font: string;
  };
  /** Ajustes aplicados a tipos específicos de seção. */
  perType: Partial<Record<SectionType, PresetPatch>>;
  /** Ajustes aplicados a todas as seções de conteúdo. */
  common: PresetPatch;
};

const CONTENT_TYPES: SectionType[] = [
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
];

export const LAYOUT_PRESETS: LayoutPreset[] = [
  {
    id: "botanical",
    name: "Botanical",
    emoji: "🌿",
    description: "Papel texturizado, aquarela, folhas e borboletas desenhadas à mão.",
    skin: "botanical",
    features: [
      "Textura de papel",
      "Fundo aquarelado",
      "Elementos botânicos e borboletas",
      "Bordas orgânicas",
      "Tipografia elegante",
      "Animações suaves",
    ],
    style: {
      primary_color: "#7d8a5f",
      secondary_color: "#d9c3a5",
      background_color: "#f7f2e9",
      heading_font: "Cormorant Garamond",
      body_font: "Karla",
    },
    common: {
      spacing: "espacoso",
      border_style: "nenhuma",
      border_radius: "grande",
      border_shadow: "nenhuma",
      frame_padding: "grande",
    },
    perType: {
      hero: { height: "grande", content_align: "centro", title_size: "extra_grande", overlay: true },
      story: { layout: "side", align: "left", spacing: "espacoso" },
      gallery: { mode: "carousel", ratio: "retrato", per_view: "3", loop: true },
    },
  },
  {
    id: "romantic",
    name: "Romantic",
    emoji: "🌸",
    description: "Flores delicadas, ornamentos suaves e cores afetuosas.",
    skin: "romantic",
    features: [
      "Flores e ornamentos delicados",
      "Cores suaves",
      "Bordas orgânicas",
      "Divisores decorativos",
      "Animações suaves",
    ],
    style: {
      primary_color: "#b06a76",
      secondary_color: "#e8c9cf",
      background_color: "#fdf6f6",
      heading_font: "Cormorant Garamond",
      body_font: "Nunito",
    },
    common: {
      spacing: "espacoso",
      border_style: "fina",
      border_color: "#e8c9cf",
      border_radius: "grande",
      border_shadow: "suave",
      frame_padding: "grande",
    },
    perType: {
      hero: { height: "grande", content_align: "centro", title_size: "extra_grande" },
      story: { layout: "stacked", align: "center" },
      gallery: { mode: "grid", ratio: "quadrado", columns: "3" },
    },
  },
  {
    id: "minimal",
    name: "Minimal",
    emoji: "🤍",
    description: "Fundo limpo, muito espaço em branco e tipografia moderna.",
    skin: "minimal",
    features: [
      "Fundo limpo",
      "Poucos elementos decorativos",
      "Bastante espaço em branco",
      "Tipografia moderna",
      "Fade-in simples",
    ],
    style: {
      primary_color: "#2f2f2f",
      secondary_color: "#9a9a9a",
      background_color: "#ffffff",
      heading_font: "Karla",
      body_font: "Karla",
    },
    common: {
      spacing: "padrao",
      border_style: "nenhuma",
      border_radius: "nenhum",
      border_shadow: "nenhuma",
      frame_padding: "medio",
    },
    perType: {
      hero: { height: "compacto", content_align: "esquerda", title_size: "medio", overlay: false },
      story: { layout: "stacked", align: "left" },
      gallery: { mode: "grid", ratio: "quadrado", columns: "4" },
    },
  },
  {
    id: "editorial",
    name: "Editorial",
    emoji: "🖤",
    description: "Layouts assimétricos, títulos grandes e imagens marcantes.",
    skin: "editorial",
    features: [
      "Composição assimétrica",
      "Títulos grandes",
      "Imagens grandes",
      "Tipografia contemporânea",
      "Reveal lateral",
    ],
    style: {
      primary_color: "#141414",
      secondary_color: "#b8974f",
      background_color: "#f5f4f2",
      heading_font: "Marcellus",
      body_font: "Inter",
    },
    common: {
      spacing: "espacoso",
      border_style: "nenhuma",
      border_radius: "nenhum",
      border_shadow: "nenhuma",
      frame_padding: "grande",
    },
    perType: {
      hero: {
        height: "tela_cheia",
        content_align: "esquerda",
        title_size: "extra_grande",
        overlay: true,
      },
      story: { layout: "side", align: "left" },
      gallery: { mode: "grid", ratio: "retrato", columns: "2" },
    },
  },
  {
    id: "classic",
    name: "Classic",
    emoji: "🏛️",
    description: "Serifas elegantes, molduras e ornamentos clássicos.",
    skin: "classic",
    features: [
      "Serifas elegantes",
      "Molduras nas seções",
      "Ornamentos clássicos",
      "Paleta atemporal",
      "Fade suave",
    ],
    style: {
      primary_color: "#1c2740",
      secondary_color: "#c9a84c",
      background_color: "#fbf9f4",
      heading_font: "EB Garamond",
      body_font: "Lato",
    },
    common: {
      spacing: "padrao",
      border_style: "fina",
      border_color: "#c9a84c",
      border_radius: "pequeno",
      border_shadow: "suave",
      frame_padding: "grande",
    },
    perType: {
      hero: { height: "grande", content_align: "centro", title_size: "grande" },
      story: { layout: "stacked", align: "center" },
      gallery: { mode: "grid", ratio: "paisagem", columns: "3" },
    },
  },
];

export function presetById(id: string): LayoutPreset | undefined {
  return LAYOUT_PRESETS.find((p) => p.id === id);
}

/** Modelos específicos por seção (aplicáveis individualmente). */
export type SectionPreset = {
  id: string;
  name: string;
  description: string;
  skin: SkinId;
  patch: PresetPatch;
};

export const SECTION_PRESETS: Partial<Record<SectionType, SectionPreset[]>> = {
  hero: [
    {
      id: "hero-botanical",
      name: "Hero Botanical",
      description: "Banner alto, título grande e moldura orgânica com aquarela.",
      skin: "botanical",
      patch: { height: "grande", content_align: "centro", title_size: "extra_grande", overlay: true },
    },
    {
      id: "hero-minimal",
      name: "Hero Minimal",
      description: "Banner compacto, texto à esquerda, sem sobreposição escura.",
      skin: "minimal",
      patch: { height: "compacto", content_align: "esquerda", title_size: "medio", overlay: false },
    },
    {
      id: "hero-romantic",
      name: "Hero Romântico",
      description: "Banner alto e centralizado com ornamentos florais.",
      skin: "romantic",
      patch: { height: "grande", content_align: "centro", title_size: "extra_grande", overlay: true },
    },
    {
      id: "hero-editorial",
      name: "Hero Editorial",
      description: "Tela cheia, título deslocado para a esquerda.",
      skin: "editorial",
      patch: {
        height: "tela_cheia",
        content_align: "esquerda",
        title_size: "extra_grande",
        overlay: true,
      },
    },
    {
      id: "hero-classic",
      name: "Hero Clássico",
      description: "Banner equilibrado, título em serifa clássica.",
      skin: "classic",
      patch: { height: "grande", content_align: "centro", title_size: "grande", overlay: true },
    },
  ],
  story: [
    {
      id: "story-center",
      name: "História Centralizada",
      description: "Texto e foto empilhados, alinhados ao centro.",
      skin: "minimal",
      patch: { layout: "stacked", align: "center", media_order: ["image", "text"] },
    },
    {
      id: "story-side",
      name: "História com Foto Lateral",
      description: "Foto de um lado e texto do outro.",
      skin: "none",
      patch: { layout: "side", align: "left", media_order: ["image", "text"] },
    },
    {
      id: "story-watercolor",
      name: "História com Aquarela",
      description: "Fundo aquarelado, moldura orgânica e folhas.",
      skin: "botanical",
      patch: {
        layout: "side",
        align: "left",
        border_radius: "grande",
        frame_padding: "grande",
        spacing: "espacoso",
      },
    },
    {
      id: "story-editorial",
      name: "História Editorial",
      description: "Texto primeiro, foto grande depois, alinhamento à esquerda.",
      skin: "editorial",
      patch: {
        layout: "side",
        align: "left",
        media_order: ["text", "image"],
        spacing: "espacoso",
      },
    },
  ],
  dress_code: [
    {
      id: "dress-minimal",
      name: "Dress Code Minimal",
      description: "Sem moldura, espaçamento equilibrado.",
      skin: "minimal",
      patch: { spacing: "padrao", border_style: "nenhuma", border_radius: "nenhum" },
    },
    {
      id: "dress-botanical",
      name: "Dress Code Botanical",
      description: "Moldura orgânica com fundo de papel.",
      skin: "botanical",
      patch: { spacing: "espacoso", border_radius: "grande", frame_padding: "grande" },
    },
    {
      id: "dress-elegante",
      name: "Dress Code Elegante",
      description: "Moldura fina dourada e cantos discretos.",
      skin: "classic",
      patch: {
        spacing: "padrao",
        border_style: "fina",
        border_color: "#c9a84c",
        border_radius: "pequeno",
        border_shadow: "suave",
      },
    },
  ],
  gallery: [
    {
      id: "gallery-grid",
      name: "Grid",
      description: "Grade clássica de fotos quadradas.",
      skin: "none",
      patch: { mode: "grid", columns: "3", ratio: "quadrado" },
    },
    {
      id: "gallery-masonry",
      name: "Masonry",
      description: "Grade de duas colunas com fotos em retrato.",
      skin: "none",
      patch: { mode: "grid", columns: "2", ratio: "retrato" },
    },
    {
      id: "gallery-polaroid",
      name: "Polaroid",
      description: "Fotos com moldura branca e legendas visíveis.",
      skin: "romantic",
      patch: {
        mode: "grid",
        columns: "3",
        ratio: "quadrado",
        show_captions: true,
        frame_bg: "#ffffff",
        border_style: "fina",
        border_radius: "pequeno",
        border_shadow: "suave",
      },
    },
    {
      id: "gallery-carousel",
      name: "Carrossel Editorial",
      description: "Carrossel com fotos grandes em retrato.",
      skin: "editorial",
      patch: { mode: "carousel", per_view: "2", ratio: "retrato", loop: true },
    },
  ],
  footer: [
    {
      id: "footer-minimal",
      name: "Rodapé Minimal",
      description: "Apenas o essencial, bem discreto.",
      skin: "minimal",
      patch: {},
    },
    {
      id: "footer-botanical",
      name: "Rodapé Botanical",
      description: "Folhas e textura de papel no fechamento.",
      skin: "botanical",
      patch: {},
    },
    {
      id: "footer-elegante",
      name: "Rodapé Elegante",
      description: "Ornamento clássico centralizado.",
      skin: "classic",
      patch: {},
    },
  ],
};

export function sectionPresetsFor(type: SectionType): SectionPreset[] {
  return SECTION_PRESETS[type] ?? [];
}

/** Chaves de estilo do preset global aplicadas a cada tipo de seção. */
export function presetPatchFor(preset: LayoutPreset, type: SectionType): PresetPatch {
  const base = CONTENT_TYPES.includes(type) ? preset.common : {};
  return {
    ...base,
    ...(preset.perType[type] ?? {}),
    _skin: preset.skin,
    _preset: preset.id,
  };
}

/** Skin decorativo salvo numa seção ("none" quando o casal nunca aplicou um modelo). */
export function skinOf(section: Pick<WebsiteSection, "settings"> | null | undefined): SkinId {
  const value = fieldText(section, "_skin");
  const valid: SkinId[] = ["botanical", "romantic", "minimal", "editorial", "classic"];
  return (valid as string[]).includes(value) ? (value as SkinId) : "none";
}

/** Id do modelo aplicado numa seção (vazio quando nenhum). */
export function presetOf(section: Pick<WebsiteSection, "settings"> | null | undefined): string {
  return fieldText(section, "_preset");
}

/** Skin dominante do site (o mais frequente entre as seções). */
export function siteSkin(sections: WebsiteSection[]): SkinId {
  const counts = new Map<SkinId, number>();
  for (const s of sections) {
    const skin = skinOf(s);
    if (skin === "none") continue;
    counts.set(skin, (counts.get(skin) ?? 0) + 1);
  }
  let best: SkinId = "none";
  let bestCount = 0;
  for (const [skin, count] of counts) {
    if (count > bestCount) {
      best = skin;
      bestCount = count;
    }
  }
  return best;
}

/** Preset global dominante (usado para destacar o cartão escolhido no painel). */
export function sitePreset(sections: WebsiteSection[]): string {
  const counts = new Map<string, number>();
  for (const s of sections) {
    const id = presetOf(s);
    if (!id || id.includes("-")) continue; // ignora modelos de seção (ex: "hero-minimal")
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  let best = "";
  let bestCount = 0;
  for (const [id, count] of counts) {
    if (count > bestCount) {
      best = id;
      bestCount = count;
    }
  }
  return best;
}

/** Verdadeiro quando existe algum modelo aplicado (habilita "Restaurar visual original"). */
export function hasPresetApplied(sections: WebsiteSection[]): boolean {
  return sections.some((s) => Boolean(presetOf(s)) || skinOf(s) !== "none");
}

/**
 * Mescla um patch no settings da seção, guardando (uma única vez) o settings original
 * em `_preset_backup` para permitir a restauração posterior.
 */
export function mergePreset(section: WebsiteSection, patch: PresetPatch): PresetPatch {
  const current = sectionSettings(section);
  const backup = current["_preset_backup"];
  const original = backup && typeof backup === "object" ? backup : stripPresetKeys(current);
  return { ...current, ...patch, _preset_backup: original };
}

/** Remove as chaves de controle do preset de um objeto de settings. */
export function stripPresetKeys(settings: PresetPatch): PresetPatch {
  const clone: PresetPatch = { ...settings };
  delete clone["_preset"];
  delete clone["_skin"];
  delete clone["_preset_backup"];
  return clone;
}

/** Settings de volta ao estado anterior ao primeiro modelo aplicado. */
export function restoredSettings(section: WebsiteSection): PresetPatch {
  const current = sectionSettings(section);
  const backup = current["_preset_backup"];
  if (backup && typeof backup === "object" && !Array.isArray(backup)) {
    return stripPresetKeys(backup as PresetPatch);
  }
  return stripPresetKeys(current);
}
