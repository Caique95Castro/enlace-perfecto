import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { CalendarHeart, Gift, Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { submitRsvp } from "@/services/guests";
import { submitGuestMessage } from "@/services/messages";
import { createGiftOrder } from "@/services/gifts";
import { createPayment } from "@/lib/payments.functions";
import { countdownTo, formatCurrency, formatDateLong, formatTime } from "@/lib/format";
import {
  fieldBool,
  fieldChoice,
  fieldOrder,
  fieldText,
  linesOf,
  paragraphsOf,
} from "@/lib/sections";
import { cn } from "@/lib/utils";
import { DressCodeSection } from "@/components/site/DressCodeSection";
import type { SectionType, WebsiteSection } from "@/types";

/** Tipos de seção que aparecem como blocos independentes e reordenáveis no site. */
export type SiteBlockType =
  | "hero"
  | "countdown"
  | "story"
  | "gallery"
  | "event"
  | "wedding_party"
  | "location"
  | "dress_code"
  | "info"
  | "rsvp"
  | "gifts"
  | "message";

export type WeddingSiteData = {
  couple: {
    id?: string;
    slug: string;
    display_name: string;
    partner_1_name: string;
    partner_2_name: string;
  };
  wedding: {
    wedding_date: string | null;
    ceremony_time: string | null;
    venue_name: string | null;
    venue_address: string | null;
    city: string | null;
    state: string | null;
    dress_code: string | null;
    description: string | null;
  } | null;
  settings: {
    primary_color: string;
    secondary_color: string;
    background_color: string;
    hero_image_url: string | null;
  };
  sections: WebsiteSection[];
  photos: { id: string; public_url: string; caption: string | null; category: string }[];
  gifts: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    image_url: string | null;
  }[];
  messages: {
    id: string;
    author_name: string;
    message: string;
    photo_url: string | null;
  }[];
};

/**
 * Renderiza o site do casamento a partir dos dados dinâmicos (settings + website_sections).
 * `interactive=false` desativa envio real de RSVP/presentes/recados — usado no editor visual,
 * onde o noivo está apenas ajustando o layout e não deve disparar ações reais de convidado.
 * `renderBlock` permite que o editor visual envolva cada bloco com controles de arrastar/editar,
 * sem duplicar toda a lógica de renderização do site.
 */
export function WeddingSiteView({
  data,
  interactive = true,
  renderBlock,
}: {
  data: WeddingSiteData;
  interactive?: boolean;
  renderBlock?: (
    type: SiteBlockType,
    section: WebsiteSection | null | undefined,
    node: ReactNode,
  ) => ReactNode;
}) {
  const { couple, wedding, settings, sections, photos, gifts, messages } = data;
  const visible = new Set(
    sections.filter((s) => s.visible).map((s) => s.section_type as SectionType),
  );
  const sectionOf = (type: SectionType) => sections.find((s) => s.section_type === type);

  const style = {
    ["--site-primary" as string]: settings.primary_color,
    ["--site-secondary" as string]: settings.secondary_color,
    backgroundColor: settings.background_color,
  } as React.CSSProperties;

  const gallery = photos.filter((p) => p.category === "gallery");

  const headerSection = sectionOf("header");
  const heroSection = sectionOf("hero");
  const storySection = sectionOf("story");

  const heroImage = fieldText(heroSection, "image_url") || settings.hero_image_url;
  const heroEyebrow = fieldText(heroSection, "eyebrow") || "Vamos nos casar";
  const heroHeadline = fieldText(heroSection, "headline");
  const heroSubheadline = fieldText(heroSection, "subheadline");
  const heroDateText = fieldText(heroSection, "date_text") || formatDateLong(wedding?.wedding_date);
  const heroOverlay = fieldBool(heroSection, "overlay", true);
  const heroCtaEnabled = fieldBool(heroSection, "cta_enabled", true);
  const heroCtaLabel = fieldText(heroSection, "cta_label") || "Confirmar presença";
  const heroCtaLink = fieldText(heroSection, "cta_link") || "#rsvp";
  const heroCtaSecondaryLabel = fieldText(heroSection, "cta_secondary_label");
  const heroCtaSecondaryLink = fieldText(heroSection, "cta_secondary_link") || "#presentes";
  const heroHeight = fieldChoice(heroSection, "height", "padrao");
  const heroHeightClass =
    {
      compacto: "min-h-[42vh]",
      padrao: "min-h-[70vh]",
      grande: "min-h-[88vh]",
      tela_cheia: "min-h-screen",
    }[heroHeight] ?? "min-h-[70vh]";
  const heroAlign = fieldChoice(heroSection, "content_align", "centro");
  const heroAlignClass =
    {
      esquerda: "items-start text-left",
      centro: "items-center text-center",
      direita: "items-end text-right",
    }[heroAlign] ?? "items-center text-center";
  const heroTitleSize = fieldChoice(heroSection, "title_size", "grande");
  const heroTitleClass =
    {
      medio: "text-3xl sm:text-4xl",
      grande: "text-5xl sm:text-6xl",
      extra_grande: "text-6xl sm:text-7xl",
    }[heroTitleSize] ?? "text-5xl sm:text-6xl";

  const storyParagraphs = paragraphsOf(
    fieldText(storySection, "text") || storySection?.content || wedding?.description || "",
  );
  const storyImage = fieldText(storySection, "image_url");
  // Compatível com valores antigos digitados à mão ("lado" / "centro").
  const rawStoryLayout = fieldChoice(storySection, "layout", "stacked").toLowerCase();
  const storySide = rawStoryLayout === "side" || rawStoryLayout === "lado";
  const storyOrder = fieldOrder(storySection, "media_order", ["image", "text"]);
  const storyAlign = fieldChoice(storySection, "align", "center");
  const storyPhotos = fieldBool(storySection, "show_gallery", true)
    ? photos.filter((p) => p.category === "story")
    : [];

  const wrap = (
    type: SiteBlockType,
    section: WebsiteSection | null | undefined,
    node: ReactNode,
  ) => (renderBlock ? renderBlock(type, section, node) : node);

  const heroBlock = (
    <header
      className={cn(
        "relative flex flex-col justify-center overflow-hidden px-4",
        heroHeightClass,
        heroAlignClass,
      )}
    >
      {heroImage ? (
        <>
          <img
            src={heroImage}
            alt={`Foto de ${couple.display_name}`}
            className="absolute inset-0 size-full object-cover"
          />
          {heroOverlay ? <div className="absolute inset-0 bg-black/35" /> : null}
        </>
      ) : null}
      <div
        className={cn(
          "relative flex w-full flex-col",
          heroAlignClass,
          heroImage ? "text-white" : "",
        )}
      >
        <p className="text-xs uppercase tracking-[0.35em]">{heroEyebrow}</p>
        <h1 className={cn("mt-4 font-display font-semibold", heroTitleClass)}>
          {heroHeadline || `${couple.partner_1_name} & ${couple.partner_2_name}`}
        </h1>
        {heroSubheadline ? <p className="mt-3 text-base opacity-90">{heroSubheadline}</p> : null}
        <p className="mt-4 text-lg">{heroDateText}</p>
        {heroCtaEnabled ? (
          <div
            className={cn(
              "mt-7 flex flex-wrap items-center gap-3",
              heroAlign === "esquerda"
                ? "justify-start"
                : heroAlign === "direita"
                  ? "justify-end"
                  : "justify-center",
            )}
          >
            <a href={heroCtaLink}>
              <Button>{heroCtaLabel}</Button>
            </a>
            {heroCtaSecondaryLabel ? (
              <a href={heroCtaSecondaryLink}>
                <Button
                  variant="outline"
                  className={heroImage ? "bg-white/10 text-white" : undefined}
                >
                  {heroCtaSecondaryLabel}
                </Button>
              </a>
            ) : null}
          </div>
        ) : null}
      </div>
    </header>
  );

  const countdownSection = sectionOf("countdown");
  const countdownBlock = wedding?.wedding_date ? (
    <Countdown
      date={wedding.wedding_date}
      time={wedding.ceremony_time}
      subtitle={fieldText(countdownSection, "subtitle")}
      show={{
        days: fieldBool(countdownSection, "show_days", true),
        hours: fieldBool(countdownSection, "show_hours", true),
        minutes: fieldBool(countdownSection, "show_minutes", true),
        seconds: fieldBool(countdownSection, "show_seconds", true),
      }}
    />
  ) : null;

  const storyImageNode = storyImage ? (
    <img
      key="image"
      src={storyImage}
      alt={`Foto de ${couple.display_name}`}
      loading="lazy"
      className={cn(
        "w-full rounded-xl object-cover",
        storySide ? "aspect-[4/5]" : "mx-auto aspect-[4/3] max-w-md",
      )}
    />
  ) : null;

  const storyTextNode =
    storyParagraphs.length > 0 ? (
      <div
        key="text"
        className={cn(
          "space-y-4 leading-relaxed",
          storyAlign === "left" ? "text-left" : "text-center",
        )}
      >
        {storyParagraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    ) : null;

  const storyNodes = storyOrder
    .map((item) => (item === "image" ? storyImageNode : storyTextNode))
    .filter(Boolean);

  const storyBlock =
    storyParagraphs.length > 0 || storyImage ? (
      <Section
        title={storySection?.title ?? "Nossa história"}
        spacing={fieldChoice(storySection, "spacing", "padrao")}
      >
        <div
          className={cn(
            "mx-auto gap-8",
            storySide
              ? "grid max-w-4xl items-center sm:grid-cols-2"
              : "flex max-w-2xl flex-col items-center",
          )}
        >
          {storyNodes}
        </div>
        {storyPhotos.length > 0 ? (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {storyPhotos.map((photo) => (
              <img
                key={photo.id}
                src={photo.public_url}
                alt={photo.caption ?? `Foto de ${couple.display_name}`}
                loading="lazy"
                className="aspect-square w-full rounded-lg object-cover"
              />
            ))}
          </div>
        ) : null}
      </Section>
    ) : (
      <p className="px-4 py-8 text-center text-sm text-muted-foreground">
        Adicione um texto ou foto para a seção de história.
      </p>
    );

  const galleryBlock =
    gallery.length > 0 ? (
      <Section
        title={sectionOf("gallery")?.title ?? "Galeria"}
        spacing={fieldChoice(sectionOf("gallery"), "spacing", "padrao")}
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {gallery.map((photo) => (
            <img
              key={photo.id}
              src={photo.public_url}
              alt={photo.caption ?? `Foto de ${couple.display_name}`}
              loading="lazy"
              className="aspect-square w-full rounded-lg object-cover"
            />
          ))}
        </div>
      </Section>
    ) : (
      <p className="px-4 py-8 text-center text-sm text-muted-foreground">
        Envie fotos na aba "Fotos" para preencher a galeria.
      </p>
    );

  const eventSection = sectionOf("event");
  const eventVenue =
    fieldText(eventSection, "venue_name") || wedding?.venue_name || "Local a definir";
  const eventAddress =
    fieldText(eventSection, "address") ||
    [wedding?.venue_address, wedding?.city, wedding?.state].filter(Boolean).join(", ");
  const eventTime = fieldText(eventSection, "time") || formatTime(wedding?.ceremony_time ?? null);
  const eventMap = fieldText(eventSection, "map_url");

  const eventBlock = (
    <Section
      id="cerimonia"
      title={eventSection?.title ?? "Cerimônia"}
      spacing={fieldChoice(eventSection, "spacing", "padrao")}
    >
      <SectionText text={fieldText(eventSection, "description")} />
      <div className="mx-auto grid max-w-2xl gap-6 text-center sm:grid-cols-2">
        <div>
          <CalendarHeart className="mx-auto size-6" style={{ color: settings.primary_color }} />
          <p className="mt-3 font-medium">{formatDateLong(wedding?.wedding_date)}</p>
          {eventTime ? <p>{eventTime}</p> : null}
        </div>
        <div>
          <MapPin className="mx-auto size-6" style={{ color: settings.primary_color }} />
          <p className="mt-3 font-medium">{eventVenue}</p>
          {eventAddress ? <p className="text-sm">{eventAddress}</p> : null}
          {eventMap ? (
            <a
              href={eventMap}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-sm underline"
            >
              Ver no mapa
            </a>
          ) : null}
        </div>
      </div>
    </Section>
  );

  const partySection = sectionOf("wedding_party");
  const partyBlock = (
    <Section
      id="padrinhos"
      title={partySection?.title ?? "Padrinhos e madrinhas"}
      spacing={fieldChoice(partySection, "spacing", "padrao")}
    >
      <SectionText text={fieldText(partySection, "description")} />
      <div className="mx-auto grid max-w-2xl gap-6 text-center sm:grid-cols-2">
        <div>
          <p className="font-display text-xl">
            {fieldText(partySection, "groom_side_label") || "Padrinhos"}
          </p>
        </div>
        <div>
          <p className="font-display text-xl">
            {fieldText(partySection, "bride_side_label") || "Madrinhas"}
          </p>
        </div>
      </div>
    </Section>
  );

  const locationSection = sectionOf("location");
  const locationMap = fieldText(locationSection, "map_url");
  const locationBlock = (
    <Section
      id="local"
      title={locationSection?.title ?? "Local"}
      tinted
      primary={settings.secondary_color}
      spacing={fieldChoice(locationSection, "spacing", "padrao")}
    >
      <div className="text-center">
        <p className="font-medium">
          {fieldText(locationSection, "venue_name") || wedding?.venue_name || "Local a definir"}
        </p>
        <p className="mt-1 text-sm">
          {fieldText(locationSection, "address") ||
            [wedding?.venue_address, wedding?.city, wedding?.state].filter(Boolean).join(", ")}
        </p>
        {locationMap ? (
          <a
            href={locationMap}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-block text-sm underline"
          >
            Como chegar
          </a>
        ) : null}
      </div>
    </Section>
  );

  const dressSection = sectionOf("dress_code");
  const dressBlock = (
    <DressCodeSection
      section={dressSection}
      legacyDescription={wedding?.dress_code}
      legacyGuidelines={fieldText(dressSection, "guidelines")}
    />
  );

  const infoSection = sectionOf("info");
  const infoNotes = linesOf(fieldText(infoSection, "notes"));
  const infoBlock = (
    <Section
      id="informacoes"
      title={infoSection?.title ?? "Informações importantes"}
      spacing={fieldChoice(infoSection, "spacing", "padrao")}
    >
      <SectionText text={fieldText(infoSection, "description")} />
      {infoNotes.length > 0 ? (
        <ul className="mx-auto max-w-2xl list-disc space-y-2 pl-6 text-left">
          {infoNotes.map((note, i) => (
            <li key={i}>{note}</li>
          ))}
        </ul>
      ) : null}
    </Section>
  );

  const rsvpBlock = (
    <Section
      id="rsvp"
      title={sectionOf("rsvp")?.title ?? "Confirme sua presença"}
      tinted
      primary={settings.secondary_color}
      spacing={fieldChoice(sectionOf("rsvp"), "spacing", "padrao")}
    >
      <SectionText text={fieldText(sectionOf("rsvp"), "description")} />
      <RsvpForm slug={couple.slug} interactive={interactive} />
    </Section>
  );

  const giftsBlock =
    gifts.length > 0 ? (
      <Section
        id="presentes"
        title={sectionOf("gifts")?.title ?? "Lista de presentes"}
        spacing={fieldChoice(sectionOf("gifts"), "spacing", "padrao")}
      >
        <SectionText text={fieldText(sectionOf("gifts"), "description")} />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {gifts.map((gift) => (
            <GiftCard
              key={gift.id}
              gift={gift}
              primary={settings.primary_color}
              interactive={interactive}
            />
          ))}
        </div>
      </Section>
    ) : (
      <p className="px-4 py-8 text-center text-sm text-muted-foreground">
        Cadastre itens na aba "Presentes" para preencher a lista.
      </p>
    );

  const messageBlock = (
    <Section
      id="recados"
      title={sectionOf("message")?.title ?? "Mural de mensagens"}
      tinted
      primary={settings.secondary_color}
      spacing={fieldChoice(sectionOf("message"), "spacing", "padrao")}
    >
      <SectionText text={fieldText(sectionOf("message"), "description")} />
      <MessageBoard slug={couple.slug} messages={messages} interactive={interactive} />
    </Section>
  );

  const footerSection = sectionOf("footer");
  const footerText =
    fieldText(footerSection, "text") || footerSection?.content || "Esperamos você!";
  const instagram = fieldText(footerSection, "instagram");
  const whatsapp = fieldText(footerSection, "whatsapp");

  const blocks: { type: SiteBlockType; node: ReactNode }[] = [
    { type: "hero", node: heroBlock },
    { type: "countdown", node: countdownBlock },
    { type: "story", node: storyBlock },
    { type: "gallery", node: galleryBlock },
    { type: "event", node: eventBlock },
    { type: "wedding_party", node: partyBlock },
    { type: "location", node: locationBlock },
    { type: "dress_code", node: dressBlock },
    { type: "info", node: infoBlock },
    { type: "rsvp", node: rsvpBlock },
    { type: "gifts", node: giftsBlock },
    { type: "message", node: messageBlock },
  ];

  // A ordem dos blocos segue a posição salva em website_sections (arrastar no editor).
  const orderOf = (type: SiteBlockType) =>
    sections.find((s) => s.section_type === type)?.position ?? 999;
  const ordered = [...blocks].sort((a, b) => orderOf(a.type) - orderOf(b.type));

  return (
    <div style={style} className="min-h-screen text-neutral-800">
      {visible.has("header") ? <SiteHeader section={headerSection} couple={couple} /> : null}

      {ordered.map(({ type, node }) =>
        visible.has(type) && node ? (
          <div key={type}>{wrap(type, sectionOf(type), node)}</div>
        ) : null,
      )}

      {visible.has("footer") ? (
        <footer className="px-4 py-12 text-center text-sm">
          <p className="font-display text-2xl">{couple.display_name}</p>
          <p className="mt-2 opacity-70">{footerText}</p>
          {instagram || whatsapp ? (
            <div className="mt-3 flex justify-center gap-4">
              {instagram ? (
                <a href={instagram} target="_blank" rel="noreferrer" className="underline">
                  Instagram
                </a>
              ) : null}
              {whatsapp ? (
                <a href={whatsapp} target="_blank" rel="noreferrer" className="underline">
                  WhatsApp
                </a>
              ) : null}
            </div>
          ) : null}
        </footer>
      ) : null}
    </div>
  );
}

/** Texto descritivo opcional exibido no topo de uma seção. */
function SectionText({ text }: { text: string }) {
  const paragraphs = paragraphsOf(text);
  if (paragraphs.length === 0) return null;
  return (
    <div className="mx-auto mb-8 max-w-2xl space-y-3 text-center leading-relaxed">
      {paragraphs.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );
}

function SiteHeader({
  section,
  couple,
}: {
  section: WebsiteSection | null | undefined;
  couple: { partner_1_name: string; partner_2_name: string };
}) {
  const [scrolled, setScrolled] = useState(false);
  const brand =
    fieldText(section, "brand") || `${couple.partner_1_name} & ${couple.partner_2_name}`;
  const logoUrl = fieldText(section, "logo_url");
  const sticky = fieldBool(section, "sticky", true);
  const transparent = fieldBool(section, "transparent", true);
  const showNav = fieldBool(section, "show_nav", true);
  const textColor = fieldText(section, "text_color");
  const ctaLabel = fieldText(section, "cta_label") || "Confirmar presença";
  const ctaLink = fieldText(section, "cta_link") || "#rsvp";

  useEffect(() => {
    if (!transparent) return;
    function onScroll() {
      setScrolled(window.scrollY > 40);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [transparent]);

  const isDark = transparent && !scrolled;

  return (
    <div
      className={cn(
        "z-40 flex items-center justify-between px-4 py-4 sm:px-8",
        sticky ? "sticky top-0" : "relative",
        isDark ? "bg-transparent" : "bg-background/95 shadow-sm backdrop-blur",
      )}
      style={isDark && textColor ? { color: textColor } : undefined}
    >
      <div className="flex items-center gap-2">
        {logoUrl ? <img src={logoUrl} alt={brand} className="h-8 w-auto object-contain" /> : null}
        <span className="font-display text-lg font-semibold">{brand}</span>
      </div>
      {showNav ? (
        <a href={ctaLink}>
          <Button
            size="sm"
            variant={isDark ? "outline" : "default"}
            className={isDark ? "bg-white/10" : undefined}
          >
            {ctaLabel}
          </Button>
        </a>
      ) : null}
    </div>
  );
}

function Section({
  id,
  title,
  children,
  tinted,
  primary,
  spacing,
}: {
  id?: string;
  title: string;
  children: ReactNode;
  tinted?: boolean;
  primary?: string;
  spacing?: string;
}) {
  const spacingClass =
    { compacto: "py-8 sm:py-10", padrao: "py-16 sm:py-20", espacoso: "py-24 sm:py-32" }[
      spacing ?? "padrao"
    ] ?? "py-16 sm:py-20";
  return (
    <section
      id={id}
      className={cn("px-4", spacingClass)}
      style={tinted && primary ? { backgroundColor: `${primary}33` } : undefined}
    >
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-8 text-center font-display text-3xl font-semibold sm:text-4xl">
          {title}
        </h2>
        {children}
      </div>
    </section>
  );
}

function Countdown({
  date,
  time,
  subtitle,
  show,
}: {
  date: string;
  time: string | null;
  subtitle?: string;
  show?: { days: boolean; hours: boolean; minutes: boolean; seconds: boolean };
}) {
  const [cd, setCd] = useState(() => countdownTo(date, time));
  useEffect(() => {
    const id = setInterval(() => setCd(countdownTo(date, time)), 1000);
    return () => clearInterval(id);
  }, [date, time]);

  const visibility = {
    days: show?.days ?? true,
    hours: show?.hours ?? true,
    minutes: show?.minutes ?? true,
    seconds: show?.seconds ?? true,
  };

  const items = (
    [
      ["Dias", cd.days, visibility.days],
      ["Horas", cd.hours, visibility.hours],
      ["Min", cd.minutes, visibility.minutes],
      ["Seg", cd.seconds, visibility.seconds],
    ] as const
  ).filter(([, , visible]) => visible);

  return (
    <section className="px-4 py-12">
      <div className="mx-auto max-w-2xl text-center">
        {subtitle ? (
          <p className="mb-4 text-sm uppercase tracking-widest opacity-70">{subtitle}</p>
        ) : null}
        <div className="flex justify-center gap-6 sm:gap-12">
          {items.map(([label, value]) => (
            <div key={label} className="text-center">
              <p className="font-display text-4xl font-semibold sm:text-5xl">{value}</p>
              <p className="text-xs uppercase tracking-widest opacity-70">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function RsvpForm({ slug, interactive }: { slug: string; interactive: boolean }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    response: "attending" as "attending" | "not_attending",
    guestsCount: "1",
    dietary: "",
    message: "",
  });
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    if (!interactive) {
      toast.info("Modo de edição: envio de RSVP desativado na pré-visualização.");
      return;
    }
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Preencha nome e e-mail.");
      return;
    }
    setSending(true);
    try {
      await submitRsvp({
        slug,
        name: form.name.trim(),
        email: form.email.trim(),
        response: form.response,
        guestsCount: Math.max(1, Number(form.guestsCount) || 1),
        ...(form.dietary ? { dietary: form.dietary } : {}),
        ...(form.message ? { message: form.message } : {}),
      });
      setDone(true);
      toast.success("Presença registrada. Obrigado!");
    } catch {
      toast.error("Não foi possível registrar sua resposta.");
    } finally {
      setSending(false);
    }
  }

  if (done) {
    return <p className="text-center text-lg">Recebemos sua resposta. Obrigado por avisar! 💌</p>;
  }

  return (
    <div className="mx-auto max-w-xl space-y-4 rounded-xl bg-white/80 p-6 backdrop-blur">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="rsvp-name">Seu nome</Label>
          <Input
            id="rsvp-name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="rsvp-email">E-mail</Label>
          <Input
            id="rsvp-email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Você vai?</Label>
          <Select
            value={form.response}
            onValueChange={(v) =>
              setForm((f) => ({ ...f, response: v as "attending" | "not_attending" }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="attending">Sim, estarei lá</SelectItem>
              <SelectItem value="not_attending">Infelizmente não poderei</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="rsvp-count">Quantas pessoas</Label>
          <Input
            id="rsvp-count"
            type="number"
            min="1"
            value={form.guestsCount}
            onChange={(e) => setForm((f) => ({ ...f, guestsCount: e.target.value }))}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="rsvp-diet">Restrições alimentares</Label>
        <Input
          id="rsvp-diet"
          value={form.dietary}
          onChange={(e) => setForm((f) => ({ ...f, dietary: e.target.value }))}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="rsvp-msg">Mensagem aos noivos</Label>
        <Textarea
          id="rsvp-msg"
          rows={3}
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
        />
      </div>
      <Button className="w-full" onClick={submit} disabled={sending}>
        {sending ? <Loader2 className="size-4 animate-spin" /> : null}
        Confirmar presença
      </Button>
    </div>
  );
}

function GiftCard({
  gift,
  primary,
  interactive,
}: {
  gift: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    image_url: string | null;
  };
  primary: string;
  interactive: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [busy, setBusy] = useState(false);

  async function order() {
    if (!interactive) {
      toast.info("Modo de edição: pagamento desativado na pré-visualização.");
      return;
    }
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Preencha nome e e-mail.");
      return;
    }
    setBusy(true);
    try {
      const { orderId } = await createGiftOrder({
        giftItemId: gift.id,
        name: form.name.trim(),
        email: form.email.trim(),
        quantity: 1,
        ...(form.message ? { message: form.message } : {}),
      });
      const payment = await createPayment({ data: { orderId, method: "pix" } });
      if (payment.checkoutUrl) {
        window.location.href = payment.checkoutUrl;
        return;
      }
      toast.success(payment.message);
      setOpen(false);
    } catch {
      toast.error("Não foi possível registrar o presente.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="overflow-hidden rounded-xl bg-white/80 shadow-sm">
      {gift.image_url ? (
        <img
          src={gift.image_url}
          alt={gift.name}
          loading="lazy"
          className="aspect-[4/3] w-full object-cover"
        />
      ) : (
        <div
          className="flex aspect-[4/3] items-center justify-center"
          style={{ backgroundColor: `${primary}22` }}
        >
          <Gift className="size-8" style={{ color: primary }} />
        </div>
      )}
      <div className="space-y-3 p-5">
        <h3 className="font-display text-lg font-semibold">{gift.name}</h3>
        {gift.description ? <p className="text-sm opacity-70">{gift.description}</p> : null}
        <p className="font-display text-xl font-semibold">{formatCurrency(gift.price)}</p>
        {open ? (
          <div className="space-y-3">
            <Input
              placeholder="Seu nome"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <Input
              placeholder="Seu e-mail"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
            <Textarea
              rows={2}
              placeholder="Mensagem (opcional)"
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
            />
            <Button className="w-full" onClick={order} disabled={busy}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : null}
              Presentear
            </Button>
          </div>
        ) : (
          <Button variant="outline" className="w-full" onClick={() => setOpen(true)}>
            Quero presentear
          </Button>
        )}
      </div>
    </article>
  );
}

function MessageBoard({
  slug,
  messages,
  interactive,
}: {
  slug: string;
  messages: { id: string; author_name: string; message: string; photo_url: string | null }[];
  interactive: boolean;
}) {
  const [form, setForm] = useState({ name: "", message: "" });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function send() {
    if (!interactive) {
      toast.info("Modo de edição: envio de recados desativado na pré-visualização.");
      return;
    }
    if (!form.name.trim() || !form.message.trim()) {
      toast.error("Preencha seu nome e a mensagem.");
      return;
    }
    setBusy(true);
    try {
      await submitGuestMessage({
        slug,
        authorName: form.name.trim(),
        message: form.message.trim(),
      });
      setSent(true);
      setForm({ name: "", message: "" });
      toast.success("Mensagem enviada! Ela aparece após a aprovação dos noivos.");
    } catch {
      toast.error("Não foi possível enviar sua mensagem.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="mx-auto max-w-xl space-y-4 rounded-xl bg-white/80 p-6 backdrop-blur">
        {sent ? (
          <p className="text-center">
            Obrigado pelo carinho! Sua mensagem foi enviada aos noivos. 💌
          </p>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="msg-name">Seu nome</Label>
              <Input
                id="msg-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="msg-text">Deixe um recado</Label>
              <Textarea
                id="msg-text"
                rows={4}
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              />
            </div>
            <Button className="w-full" onClick={send} disabled={busy}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : null}
              Enviar mensagem
            </Button>
          </>
        )}
      </div>

      {messages.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2">
          {messages.map((m) => (
            <li key={m.id} className="rounded-xl bg-white/70 p-5">
              <div className="flex items-center gap-3">
                {m.photo_url ? (
                  <img
                    src={m.photo_url}
                    alt={`Foto enviada por ${m.author_name}`}
                    loading="lazy"
                    className="size-10 rounded-full object-cover"
                  />
                ) : null}
                <p className="font-medium">{m.author_name}</p>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm opacity-80">{m.message}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
