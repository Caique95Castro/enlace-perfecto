export type VisualStyleSlug =
  "nenhum" | "botanical" | "romantic" | "minimal" | "editorial" | "classic";

export type VisualStyle = {
  slug: VisualStyleSlug;
  name: string;
  emoji: string;
  description: string;
  /** O que esse estilo inclui, mostrado no preview antes de aplicar. */
  includes: string[];
  /** Motivos decorativos (SVG de linha, desenhados à mão) usados no banner. */
  motifs: ("flor" | "folha" | "borboleta" | "florzinha")[];
  /** Textura de fundo sutil. */
  texture: "papel" | "aquarela" | "nenhuma";
  /** Efeito de borda irregular tipo "papel rasgado" nas transições entre seções. */
  tornEdges: boolean;
  /** Divisor decorativo (traço fino ornamentado) entre seções. */
  divider: "fino" | "ornamentado" | "nenhum";
  /** Velocidade/estilo geral das animações de entrada. */
  motion: "suave" | "reveal_lateral" | "fade_simples";
};

/**
 * Estética original do produto — inspirada apenas no CONCEITO de "estilos visuais prontos"
 * (papel, aquarela, elementos botânicos, tipografia elegante), sem reproduzir composição,
 * identidade ou conteúdo de nenhuma referência externa específica.
 */
export const VISUAL_STYLES: VisualStyle[] = [
  {
    slug: "nenhum",
    name: "Visual atual (sem estilo)",
    emoji: "◻️",
    description: "Sem elementos decorativos — exatamente como o site está hoje.",
    includes: ["Nenhuma alteração visual"],
    motifs: [],
    texture: "nenhuma",
    tornEdges: false,
    divider: "nenhum",
    motion: "fade_simples",
  },
  {
    slug: "botanical",
    name: "Botanical",
    emoji: "🌿",
    description: "Flores e folhas em traço fino, textura de papel e borboleta discreta.",
    includes: [
      "Textura de papel sutil",
      "Flores e folhas desenhadas em linha, nos cantos do banner",
      "Borboleta com leve balanço",
      "Divisor ornamentado entre seções",
      "Títulos com entrada suave",
    ],
    motifs: ["flor", "folha", "borboleta"],
    texture: "papel",
    tornEdges: true,
    divider: "ornamentado",
    motion: "suave",
  },
  {
    slug: "romantic",
    name: "Romantic",
    emoji: "🌸",
    description: "Florzinhas delicadas, cores suaves e ornamentos discretos.",
    includes: [
      "Florzinhas em traço fino espalhadas com moderação",
      "Divisor ornamentado entre seções",
      "Animações suaves de entrada",
    ],
    motifs: ["florzinha"],
    texture: "aquarela",
    tornEdges: false,
    divider: "ornamentado",
    motion: "suave",
  },
  {
    slug: "minimal",
    name: "Minimal",
    emoji: "🤍",
    description: "Fundo limpo, sem decoração, bastante espaço em branco.",
    includes: [
      "Nenhum elemento decorativo",
      "Divisores finos entre seções",
      "Entrada em fade simples",
    ],
    motifs: [],
    texture: "nenhuma",
    tornEdges: false,
    divider: "fino",
    motion: "fade_simples",
  },
  {
    slug: "editorial",
    name: "Editorial",
    emoji: "🖤",
    description: "Visual contemporâneo, sem decoração floral, com entrada lateral marcante.",
    includes: [
      "Sem elementos decorativos",
      "Sem divisores",
      "Títulos entram com leve deslocamento lateral",
    ],
    motifs: [],
    texture: "nenhuma",
    tornEdges: false,
    divider: "nenhum",
    motion: "reveal_lateral",
  },
  {
    slug: "classic",
    name: "Classic",
    emoji: "🏛️",
    description: "Moldura fina nos cantos do banner e divisor ornamentado, discreto e atemporal.",
    includes: [
      "Moldura fina nos cantos do banner",
      "Divisor ornamentado entre seções",
      "Entrada em fade suave",
    ],
    motifs: [],
    texture: "nenhuma",
    tornEdges: false,
    divider: "ornamentado",
    motion: "suave",
  },
];

export function getVisualStyle(slug: string | null | undefined): VisualStyle {
  return VISUAL_STYLES.find((s) => s.slug === slug) ?? (VISUAL_STYLES[0] as VisualStyle);
}
