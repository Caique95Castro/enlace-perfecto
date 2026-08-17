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
import { createGiftOrder } from "@/services/gifts";
import { createPayment } from "@/lib/payments.functions";
import { countdownTo, formatCurrency, formatDateLong, formatTime } from "@/lib/format";
import type { SectionType } from "@/types";

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
      meta.push({ property: "og:image", content: image }, { name: "twitter:image", content: image });
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
  const visible = new Set(sections.filter((s) => s.visible).map((s) => s.section_type as SectionType));
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


  return (
    <div style={style} className="min-h-screen text-neutral-800">
      <header className="relative flex min-h-[70vh] items-center justify-center overflow-hidden px-4 text-center">
        {settings.hero_image_url ? (
          <>
            <img
              src={settings.hero_image_url}
              alt={`Foto de ${couple.display_name}`}
              className="absolute inset-0 size-full object-cover"
            />
            <div className="absolute inset-0 bg-black/35" />
          </>
        ) : null}
        <div className={settings.hero_image_url ? "relative text-white" : "relative"}>
          <p className="text-xs uppercase tracking-[0.35em]">Vamos nos casar</p>
          <h1 className="mt-4 font-display text-5xl font-semibold sm:text-6xl">
            {couple.partner_1_name} &amp; {couple.partner_2_name}
          </h1>
          <p className="mt-4 text-lg">{formatDateLong(wedding?.wedding_date)}</p>
        </div>
      </header>

      {visible.has("countdown") && wedding?.wedding_date ? (
        <Countdown date={wedding.wedding_date} time={wedding.ceremony_time} />
      ) : null}

      {visible.has("story") && (wedding?.description || sectionOf("story")?.content) ? (
        <Section title={sectionOf("story")?.title ?? "Nossa história"}>
          <p className="mx-auto max-w-2xl whitespace-pre-line text-center leading-relaxed">
            {sectionOf("story")?.content || wedding?.description}
          </p>
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
        <Section title={sectionOf("rsvp")?.title ?? "Confirme sua presença"} tinted primary={settings.secondary_color}>
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

      <footer className="px-4 py-12 text-center text-sm">
        <p className="font-display text-2xl">{couple.display_name}</p>
        <p className="mt-2 opacity-70">{sectionOf("footer")?.content ?? "Esperamos você!"}</p>
      </footer>
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
        <h2 className="mb-8 text-center font-display text-3xl font-semibold sm:text-4xl">{title}</h2>
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
    return (
      <p className="text-center text-lg">Recebemos sua resposta. Obrigado por avisar! 💌</p>
    );
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
  gift: { id: string; name: string; description: string | null; price: number; image_url: string | null };
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
        <img src={gift.image_url} alt={gift.name} loading="lazy" className="aspect-[4/3] w-full object-cover" />
      ) : (
        <div className="flex aspect-[4/3] items-center justify-center" style={{ backgroundColor: `${primary}22` }}>
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
