import { useEffect, useState } from "react";
import { createFileRoute, notFound } from "@tanstack/react-router";
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
import { getPublicWedding } from "@/lib/public-site.functions";
import { submitRsvp } from "@/services/guests";
import { submitGuestMessage, trackSiteEvent } from "@/services/messages";
import { createGiftOrder } from "@/services/gifts";
import { createPayment } from "@/lib/payments.functions";
import { countdownTo, formatCurrency, formatDateLong, formatTime } from "@/lib/format";
import { fieldBool, fieldText, paragraphsOf } from "@/lib/sections";
import { cn } from "@/lib/utils";
import type { SectionType, WebsiteSection } from "@/types";

export const Route = createFileRoute("/$slug")({
  loader: async ({ params }) => {
    const data = await getPublicWedding({ data: { slug: params.slug } });
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Site não encontrado" }, { name: "robots", content: "noindex" }] };
    }
    const title = `${loaderData.couple.display_name} | Nosso casamento`;
    const description = `Confirme sua presença no casamento de ${loaderData.couple.display_name} — ${formatDateLong(loaderData.wedding?.wedding_date)}.`;
    const meta = [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ];
    const image = loaderData.settings.hero_image_url;
    if (image?.startsWith("https://")) {
      meta.push(
        { property: "og:image", content: image },
        { name: "twitter:image", content: image },
      );
    }
    return { meta };
  },
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center px-4 text-center">
      <div>
        <h1 className="font-display text-3xl font-semibold">Site não encontrado</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Confira o endereço com os noivos — este site pode não estar publicado.
        </p>
      </div>
    </div>
  ),
  component: PublicSite,
});

function PublicSite() {
  const data = Route.useLoaderData();
  const { couple, wedding, settings, sections, photos, gifts, messages } = data;
  const visible = new Set(
    sections.filter((s) => s.visible).map((s) => s.section_type as SectionType),
  );
  const sectionOf = (type: SectionType) => sections.find((s) => s.section_type === type);

  useEffect(() => {
    void trackSiteEvent(couple.slug, "page_view");
  }, [couple.slug]);

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

  const storyParagraphs = paragraphsOf(
    fieldText(storySection, "text") || storySection?.content || wedding?.description || "",
  );
  const storyImage = fieldText(storySection, "image_url");

  return (
    <div style={style} className="min-h-screen text-neutral-800">
      {visible.has("header") ? <SiteHeader section={headerSection} couple={couple} /> : null}

      <header className="relative flex min-h-[70vh] items-center justify-center overflow-hidden px-4 text-center">
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
        <div className={heroImage ? "relative text-white" : "relative"}>
          <p className="text-xs uppercase tracking-[0.35em]">{heroEyebrow}</p>
          <h1 className="mt-4 font-display text-5xl font-semibold sm:text-6xl">
            {heroHeadline || `${couple.partner_1_name} & ${couple.partner_2_name}`}
          </h1>
          {heroSubheadline ? <p className="mt-3 text-base opacity-90">{heroSubheadline}</p> : null}
          <p className="mt-4 text-lg">{heroDateText}</p>
          {heroCtaEnabled ? (
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
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

      {visible.has("countdown") && wedding?.wedding_date ? (
        <Countdown date={wedding.wedding_date} time={wedding.ceremony_time} />
      ) : null}

      {visible.has("story") && (storyParagraphs.length > 0 || storyImage) ? (
        <Section title={storySection?.title ?? "Nossa história"}>
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-6">
            {storyImage ? (
              <img
                src={storyImage}
                alt={`Foto de ${couple.display_name}`}
                loading="lazy"
                className="aspect-[4/3] w-full max-w-md rounded-xl object-cover"
              />
            ) : null}
            <div className="space-y-4 text-center leading-relaxed">
              {storyParagraphs.length > 0
                ? storyParagraphs.map((p, i) => <p key={i}>{p}</p>)
                : null}
            </div>
          </div>
        </Section>
      ) : null}

      {visible.has("gallery") && gallery.length > 0 ? (
        <Section title={sectionOf("gallery")?.title ?? "Galeria"}>
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
      ) : null}

      {visible.has("event") || visible.has("location") ? (
        <Section title={sectionOf("event")?.title ?? "Cerimônia"}>
          <div className="mx-auto grid max-w-2xl gap-6 text-center sm:grid-cols-2">
            <div>
              <CalendarHeart className="mx-auto size-6" style={{ color: settings.primary_color }} />
              <p className="mt-3 font-medium">{formatDateLong(wedding?.wedding_date)}</p>
              {wedding?.ceremony_time ? <p>{formatTime(wedding.ceremony_time)}</p> : null}
            </div>
            <div>
              <MapPin className="mx-auto size-6" style={{ color: settings.primary_color }} />
              <p className="mt-3 font-medium">{wedding?.venue_name ?? "Local a definir"}</p>
              <p className="text-sm">
                {[wedding?.venue_address, wedding?.city, wedding?.state].filter(Boolean).join(", ")}
              </p>
            </div>
          </div>
          {visible.has("dress_code") && wedding?.dress_code ? (
            <p className="mt-8 text-center text-sm uppercase tracking-widest">
              Dress code: {wedding.dress_code}
            </p>
          ) : null}
        </Section>
      ) : null}

      {visible.has("rsvp") ? (
        <Section
          title={sectionOf("rsvp")?.title ?? "Confirme sua presença"}
          tinted
          primary={settings.secondary_color}
        >
          <RsvpForm slug={couple.slug} />
        </Section>
      ) : null}

      {visible.has("gifts") && gifts.length > 0 ? (
        <Section title={sectionOf("gifts")?.title ?? "Lista de presentes"}>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {gifts.map((gift) => (
              <GiftCard key={gift.id} gift={gift} primary={settings.primary_color} />
            ))}
          </div>
        </Section>
      ) : null}

      {visible.has("message") ? (
        <Section
          title={sectionOf("message")?.title ?? "Mural de mensagens"}
          tinted
          primary={settings.secondary_color}
        >
          <MessageBoard slug={couple.slug} messages={messages} />
        </Section>
      ) : null}

      <footer className="px-4 py-12 text-center text-sm">
        <p className="font-display text-2xl">{couple.display_name}</p>
        <p className="mt-2 opacity-70">{sectionOf("footer")?.content ?? "Esperamos você!"}</p>
      </footer>
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
  title,
  children,
  tinted,
  primary,
}: {
  title: string;
  children: React.ReactNode;
  tinted?: boolean;
  primary?: string;
}) {
  return (
    <section
      className="px-4 py-16 sm:py-20"
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

function Countdown({ date, time }: { date: string; time: string | null }) {
  const [cd, setCd] = useState(() => countdownTo(date, time));
  useEffect(() => {
    const id = setInterval(() => setCd(countdownTo(date, time)), 1000);
    return () => clearInterval(id);
  }, [date, time]);

  const items = [
    ["Dias", cd.days],
    ["Horas", cd.hours],
    ["Min", cd.minutes],
    ["Seg", cd.seconds],
  ] as const;

  return (
    <section className="px-4 py-12">
      <div className="mx-auto flex max-w-2xl justify-center gap-6 sm:gap-12">
        {items.map(([label, value]) => (
          <div key={label} className="text-center">
            <p className="font-display text-4xl font-semibold sm:text-5xl">{value}</p>
            <p className="text-xs uppercase tracking-widest opacity-70">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function RsvpForm({ slug }: { slug: string }) {
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
}: {
  gift: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    image_url: string | null;
  };
  primary: string;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [busy, setBusy] = useState(false);

  async function order() {
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
}: {
  slug: string;
  messages: { id: string; author_name: string; message: string; photo_url: string | null }[];
}) {
  const [form, setForm] = useState({ name: "", message: "" });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function send() {
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
