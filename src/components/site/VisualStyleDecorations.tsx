import type { VisualStyle } from "@/lib/visual-styles";

/**
 * Motivos decorativos originais em traço fino (linha, não preenchimento) — estética própria
 * do produto, não uma cópia de nenhuma referência específica. Todos em `currentColor`, para
 * herdar a cor primária/secundária do site.
 */
function FlowerMotif({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" fill="none" className={className} aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1.1" strokeLinecap="round">
        <path d="M60 60c-6-18-4-34 4-42 6 10 4 28-4 42Z" />
        <path d="M60 60c14-10 28-12 38-6-6 10-24 14-38 6Z" />
        <path d="M60 60c6 18 4 34-4 42-6-10-4-28 4-42Z" />
        <path d="M60 60c-14 10-28 12-38 6 6-10 24-14 38-6Z" />
        <path d="M60 60c11-13 25-18 36-15-3 11-16 22-36 15Z" opacity="0.7" />
        <circle cx="60" cy="60" r="5.5" />
      </g>
    </svg>
  );
}

function LeafMotif({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 140" fill="none" className={className} aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1.1" strokeLinecap="round">
        <path d="M50 130C20 100 15 55 50 10c35 45 30 90 0 120Z" />
        <path d="M50 20v100" />
        <path d="M50 45c-10 4-16 10-20 18M50 45c10 4 16 10 20 18" />
        <path d="M50 75c-9 4-15 9-19 16M50 75c9 4 15 9 19 16" />
        <path d="M50 105c-7 3-11 7-14 12M50 105c7 3 11 7 14 12" />
      </g>
    </svg>
  );
}

function ButterflyMotif({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 140 110" fill="none" className={className} aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1.1" strokeLinecap="round">
        <path d="M70 20v70" />
        <path d="M70 30C55 5 25 5 15 20c-8 12 0 30 20 32 15 1.5 28-8 35-22Z" />
        <path d="M70 30c15-25 45-25 55-10 8 12 0 30-20 32-15 1.5-28-8-35-22Z" />
        <path d="M70 55C58 42 32 42 24 54c-6 9 1 22 17 22 11 0 21-7 29-21Z" opacity="0.75" />
        <path d="M70 55c12-13 38-13 46-1 6 9-1 22-17 22-11 0-21-7-29-21Z" opacity="0.75" />
      </g>
    </svg>
  );
}

function LittleFlowerMotif({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 60" fill="none" className={className} aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1.1">
        {[0, 60, 120, 180, 240, 300].map((deg) => (
          <ellipse key={deg} cx="30" cy="18" rx="6" ry="9" transform={`rotate(${deg} 30 30)`} />
        ))}
        <circle cx="30" cy="30" r="4" fill="currentColor" stroke="none" opacity="0.8" />
      </g>
    </svg>
  );
}

/** Moldura fina de canto, usada pelo estilo Classic. */
function CornerFrame({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 80" fill="none" className={className} aria-hidden="true">
      <path
        d="M4 40V12a8 8 0 0 1 8-8h28"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Camada decorativa aplicada sobre o banner (hero) do site, conforme o estilo visual
 * escolhido. Puramente ornamental — não interfere no conteúdo nem na estrutura das seções.
 * Alguns elementos somem em telas pequenas para não sobrecarregar o layout no celular.
 */
export function HeroDecoration({
  style,
  primaryColor,
}: {
  style: VisualStyle;
  primaryColor: string;
}) {
  if (style.motifs.length === 0 && style.slug !== "classic") return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ color: primaryColor }}
    >
      {style.motifs.includes("folha") ? (
        <LeafMotif className="absolute -left-4 bottom-0 hidden h-64 w-auto opacity-70 sm:block" />
      ) : null}
      {style.motifs.includes("flor") ? (
        <FlowerMotif className="absolute -left-2 bottom-8 hidden h-32 w-auto opacity-60 sm:block" />
      ) : null}
      {style.motifs.includes("borboleta") ? (
        <ButterflyMotif className="motion-safe:animate-float absolute right-6 top-16 hidden h-20 w-auto opacity-70 sm:block" />
      ) : null}
      {style.motifs.includes("florzinha") ? (
        <>
          <LittleFlowerMotif className="absolute left-8 top-10 h-9 w-auto opacity-50" />
          <LittleFlowerMotif className="absolute right-10 top-24 hidden h-7 w-auto opacity-40 sm:block" />
          <LittleFlowerMotif className="absolute bottom-10 left-1/4 hidden h-6 w-auto opacity-35 md:block" />
        </>
      ) : null}
      {style.slug === "classic" ? (
        <>
          <CornerFrame className="absolute left-4 top-4 h-14 w-14 opacity-50" />
          <CornerFrame className="absolute right-4 top-4 h-14 w-14 -scale-x-100 opacity-50" />
        </>
      ) : null}
    </div>
  );
}

/** Divisor decorativo entre seções, conforme o estilo escolhido. */
export function SectionDivider({
  style,
  primaryColor,
}: {
  style: VisualStyle;
  primaryColor: string;
}) {
  if (style.divider === "nenhum") return null;
  if (style.divider === "fino") {
    return (
      <div className="mx-auto h-px w-16 opacity-30" style={{ backgroundColor: primaryColor }} />
    );
  }
  return (
    <div
      className="mx-auto flex items-center justify-center gap-3 opacity-60"
      style={{ color: primaryColor }}
      aria-hidden="true"
    >
      <span className="h-px w-10" style={{ backgroundColor: "currentColor" }} />
      <svg
        viewBox="0 0 24 24"
        className="size-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      >
        <path d="M12 2c3 4 3 8 0 10-3-2-3-6 0-10Z" />
        <path d="M12 22c3-4 3-8 0-10-3 2-3 6 0 10Z" />
        <path d="M2 12c4-3 8-3 10 0-2 3-6 3-10 0Z" />
        <path d="M22 12c-4-3-8-3-10 0 2 3 6 3 10 0Z" />
      </svg>
      <span className="h-px w-10" style={{ backgroundColor: "currentColor" }} />
    </div>
  );
}

/** Textura de fundo sutil (papel ou aquarela), aplicada via CSS puro — sem imagens externas. */
export function textureStyle(style: VisualStyle, secondaryColor: string): React.CSSProperties {
  if (style.texture === "papel") {
    return {
      backgroundImage:
        "repeating-linear-gradient(0deg, rgba(0,0,0,0.015) 0px, rgba(0,0,0,0.015) 1px, transparent 1px, transparent 3px)," +
        "repeating-linear-gradient(90deg, rgba(0,0,0,0.012) 0px, rgba(0,0,0,0.012) 1px, transparent 1px, transparent 3px)",
    };
  }
  if (style.texture === "aquarela") {
    return {
      backgroundImage: `radial-gradient(ellipse 60% 40% at 15% 10%, ${secondaryColor}22, transparent 60%), radial-gradient(ellipse 50% 35% at 85% 90%, ${secondaryColor}22, transparent 60%)`,
    };
  }
  return {};
}
