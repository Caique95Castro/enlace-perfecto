import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Gem,
  Heart,
  Info,
  Shirt,
  Sparkles,
  Star,
  Watch,
  type LucideIcon,
} from "lucide-react";
import { fieldBool, fieldChoice, fieldText } from "@/lib/sections";
import { cn } from "@/lib/utils";
import type { WebsiteSection } from "@/types";

const ICONS: Record<string, LucideIcon> = {
  Shirt,
  Gem,
  Sparkles,
  Watch,
  Star,
  AlertTriangle,
  Info,
  Heart,
};

function resolveIcon(name: string, fallback: LucideIcon): LucideIcon {
  return ICONS[name] ?? fallback;
}

const DRESS_TYPE_LABELS: Record<string, string> = {
  social: "Traje Social",
  esporte_fino: "Esporte Fino",
  formal: "Traje Formal",
  black_tie: "Black Tie",
  casual: "Casual",
  casual_chic: "Casual Chic",
  personalizado: "",
};

const TITLE_SIZE_CLASS: Record<string, string> = {
  medio: "text-2xl sm:text-3xl",
  grande: "text-3xl sm:text-4xl",
  extra_grande: "text-4xl sm:text-5xl",
};

const SPACING_CLASS: Record<string, string> = {
  compacto: "py-8 sm:py-10",
  padrao: "py-16 sm:py-20",
  espacoso: "py-24 sm:py-32",
};

const IMAGE_FIT_CLASS: Record<string, string> = {
  cover: "object-cover",
  contain: "object-contain",
};

const IMAGE_POSITION_CLASS: Record<string, string> = {
  centro: "object-center",
  centro_superior: "object-top",
  centro_inferior: "object-bottom",
  esquerda: "object-left",
  direita: "object-right",
};

const IMAGE_RADIUS_CLASS: Record<string, string> = {
  nenhum: "rounded-none",
  pequeno: "rounded-lg",
  grande: "rounded-2xl",
  circular: "rounded-full",
};

const ALIGN_CLASS: Record<string, string> = {
  esquerda: "items-start text-left",
  centro: "items-center text-center",
  direita: "items-end text-right",
};

/**
 * Seção de Dress Code do site do casamento — mesmo componente usado no editor (dentro do
 * preview do painel) e no site público, para que o que os noivos veem ao editar seja
 * exatamente o que os convidados verão. Os dados vêm de `website_sections.settings`
 * (arquitetura já existente); nenhum HTML é salvo no banco. Para compatibilidade com a
 * versão anterior da seção, `legacyGuidelines` (o antigo campo "Orientações") é usado como
 * conteúdo da observação quando o novo campo ainda não foi preenchido — nenhum dado antigo
 * é perdido.
 */
export function DressCodeSection({
  section,
  legacyDescription,
  legacyGuidelines,
}: {
  section: WebsiteSection | null | undefined;
  /** Texto do antigo campo livre `weddings.dress_code`, usado como fallback da descrição. */
  legacyDescription?: string | null | undefined;
  legacyGuidelines?: string | null | undefined;
}) {
  const title = section?.title || "Como se vestir";
  const description =
    fieldText(section, "description") ||
    legacyDescription?.trim() ||
    "Queremos que você se sinta confortável e elegante para celebrar conosco.";

  const dressType = fieldChoice(section, "dress_type", "social");
  const dressTypeCustom = fieldText(section, "dress_type_custom");
  const dressTypeLabel =
    dressType === "personalizado" ? dressTypeCustom : DRESS_TYPE_LABELS[dressType];

  const showMen = fieldBool(section, "show_men", true);
  const menTitle = fieldText(section, "men_title") || "Homens";
  const menDescription = fieldText(section, "men_description") || "Terno, costume ou traje social.";
  const MenIcon = resolveIcon(fieldChoice(section, "men_icon", "Shirt"), Shirt);

  const showWomen = fieldBool(section, "show_women", true);
  const womenTitle = fieldText(section, "women_title") || "Mulheres";
  const womenDescription =
    fieldText(section, "women_description") || "Vestido, conjunto ou traje social.";
  const WomenIcon = resolveIcon(fieldChoice(section, "women_icon", "Gem"), Gem);

  const showImportant = fieldBool(section, "show_important", true);
  const importantTitle = fieldText(section, "important_title") || "Importante";
  const importantDescription =
    fieldText(section, "important_description") ||
    legacyGuidelines?.trim() ||
    "Evite branco e tons muito próximos ao branco.";
  const ImportantIcon = resolveIcon(
    fieldChoice(section, "important_icon", "AlertTriangle"),
    AlertTriangle,
  );

  const showImage = fieldBool(section, "show_image", false);
  const imageUrl = fieldText(section, "image_url");
  const hasImage = showImage && Boolean(imageUrl);
  const imageFit = fieldChoice(section, "image_fit", "cover");
  const imagePosition = fieldChoice(section, "image_position", "centro");
  const imageRadius = fieldChoice(section, "image_radius", "grande");

  const layout = hasImage ? fieldChoice(section, "layout", "centralizado") : "centralizado";
  const align = fieldChoice(section, "align", "centro");
  const titleSize = fieldChoice(section, "title_size", "grande");
  const spacing = fieldChoice(section, "spacing", "padrao");

  const bgColor = fieldText(section, "bg_color");
  const titleColor = fieldText(section, "title_color");
  const textColor = fieldText(section, "text_color");
  const accentColor = fieldText(section, "accent_color");
  const iconColor = fieldText(section, "icon_color");

  const content = (
    <div className={cn("flex flex-col", ALIGN_CLASS[align] ?? ALIGN_CLASS["centro"])}>
      <p
        className="text-xs font-semibold uppercase tracking-[0.3em] opacity-70"
        style={accentColor ? { color: accentColor } : undefined}
      >
        Dress code
      </p>
      <h2
        className={cn(
          "mt-3 font-display font-semibold",
          TITLE_SIZE_CLASS[titleSize] ?? TITLE_SIZE_CLASS["grande"],
        )}
        style={titleColor ? { color: titleColor } : undefined}
      >
        {title}
      </h2>
      {description ? (
        <p
          className="mt-4 max-w-xl leading-relaxed opacity-80"
          style={textColor ? { color: textColor } : undefined}
        >
          {description}
        </p>
      ) : null}

      {dressTypeLabel ? (
        <span
          className="mt-6 inline-flex w-fit items-center rounded-full border px-4 py-1.5 text-sm font-medium uppercase tracking-wide"
          style={
            accentColor
              ? { borderColor: accentColor, color: accentColor }
              : { borderColor: "currentColor" }
          }
        >
          {dressTypeLabel}
        </span>
      ) : null}

      {showMen || showWomen ? (
        <div
          className={cn(
            "mt-8 grid w-full gap-4",
            showMen && showWomen ? "sm:grid-cols-2" : "sm:max-w-sm",
          )}
        >
          {showMen ? (
            <GuidanceCard
              icon={MenIcon}
              title={menTitle}
              description={menDescription}
              iconColor={iconColor}
              align={align}
            />
          ) : null}
          {showWomen ? (
            <GuidanceCard
              icon={WomenIcon}
              title={womenTitle}
              description={womenDescription}
              iconColor={iconColor}
              align={align}
            />
          ) : null}
        </div>
      ) : null}

      {showImportant && importantDescription ? (
        <div
          className={cn(
            "mt-8 flex w-full max-w-xl gap-3 rounded-xl border border-dashed p-4",
            align === "centro" ? "sm:mx-0" : "",
          )}
        >
          <ImportantIcon
            className="mt-0.5 size-5 shrink-0"
            style={iconColor ? { color: iconColor } : undefined}
          />
          <div className={align === "centro" ? "text-left" : undefined}>
            <p className="text-sm font-semibold">{importantTitle}</p>
            <p className="mt-1 text-sm opacity-80">{importantDescription}</p>
          </div>
        </div>
      ) : null}
    </div>
  );

  const image = hasImage ? (
    <img
      src={imageUrl}
      alt={title}
      loading="lazy"
      className={cn(
        "aspect-[4/5] w-full",
        IMAGE_FIT_CLASS[imageFit] ?? IMAGE_FIT_CLASS["cover"],
        IMAGE_POSITION_CLASS[imagePosition] ?? IMAGE_POSITION_CLASS["centro"],
        IMAGE_RADIUS_CLASS[imageRadius] ?? IMAGE_RADIUS_CLASS["grande"],
      )}
    />
  ) : null;

  return (
    <Reveal>
      <section
        id="dresscode"
        className={cn("px-4", SPACING_CLASS[spacing] ?? SPACING_CLASS["padrao"])}
        style={bgColor ? { backgroundColor: bgColor } : undefined}
      >
        {layout === "centralizado" || !image ? (
          <div className="mx-auto max-w-2xl">{content}</div>
        ) : (
          <div
            className={cn(
              "mx-auto grid max-w-5xl items-center gap-10 sm:grid-cols-2",
              layout === "imagem_direita" ? "sm:[&>*:first-child]:order-2" : "",
            )}
          >
            {image}
            {content}
          </div>
        )}
      </section>
    </Reveal>
  );
}

function GuidanceCard({
  icon: Icon,
  title,
  description,
  iconColor,
  align,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  iconColor?: string;
  align: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-xl border border-border/60 bg-background/40 p-5",
        align === "centro" ? "items-center text-center" : "items-start text-left",
      )}
    >
      <Icon className="size-6" style={iconColor ? { color: iconColor } : undefined} />
      <p className="font-medium">{title}</p>
      <p className="text-sm opacity-80">{description}</p>
    </div>
  );
}

/** Revela o conteúdo com um fade + leve deslocamento vertical quando entra na tela. */
function Reveal({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-out motion-reduce:transition-none",
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 motion-reduce:opacity-100",
      )}
    >
      {children}
    </div>
  );
}
