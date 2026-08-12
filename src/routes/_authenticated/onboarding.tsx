import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, Loader2, PartyPopper, Upload } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { createCouple, upsertSettings, upsertWedding, updateCouple } from "@/services/couples";
import { uploadPhoto } from "@/services/storage";
import { useCouple } from "@/hooks/useWeddingData";
import { TEMPLATES, type TemplateSlug } from "@/types";
import { slugify } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Criar meu casamento | Meu Casamento" },
      { name: "description", content: "Configure seu casamento em poucos passos." },
      { property: "og:title", content: "Criar meu casamento | Meu Casamento" },
      { property: "og:description", content: "Configure seu casamento em poucos passos." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OnboardingPage,
});

const STEPS = [
  "Vamos criar seu casamento",
  "Conte-nos sobre vocês",
  "Quando será o casamento?",
  "Onde será?",
  "Escolha seu template",
  "Adicione sua foto",
  "Seu site está pronto!",
];

function OnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: existingCouple, isLoading } = useCouple();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);

  const [partner1, setPartner1] = useState("");
  const [partner2, setPartner2] = useState("");
  const [slug, setSlug] = useState("");
  const [story, setStory] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [venue, setVenue] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [template, setTemplate] = useState<TemplateSlug>("elegante");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [coupleId, setCoupleId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && existingCouple && !coupleId) {
      navigate({ to: "/dashboard" });
    }
  }, [existingCouple, isLoading, coupleId, navigate]);

  const suggestedSlug = slugify(`${partner1} e ${partner2}`);

  async function handleFinishBasics() {
    if (!partner1.trim() || !partner2.trim()) {
      toast.error("Informe o nome dos dois noivos.");
      return;
    }
    setBusy(true);
    try {
      const couple = await createCouple({
        partner1,
        partner2,
        slug: slug.trim() || suggestedSlug,
      });
      setCoupleId(couple.id);
      setSlug(couple.slug);
      setStep(2);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível criar o casamento.");
    } finally {
      setBusy(false);
    }
  }

  async function saveWedding() {
    if (!coupleId) return;
    setBusy(true);
    try {
      await upsertWedding(coupleId, {
        wedding_date: date || null,
        ceremony_time: time || null,
        venue_name: venue || null,
        venue_address: address || null,
        city: city || null,
        state: state || null,
        description: story || null,
      });
      setStep((s) => s + 1);
    } catch {
      toast.error("Não foi possível salvar os dados do evento.");
    } finally {
      setBusy(false);
    }
  }

  async function saveTemplate() {
    if (!coupleId) return;
    const preset = TEMPLATES.find((t) => t.slug === template)!;
    setBusy(true);
    try {
      await upsertSettings(coupleId, {
        template_slug: preset.slug,
        primary_color: preset.primary,
        secondary_color: preset.secondary,
        background_color: preset.background,
        heading_font: preset.heading,
        body_font: preset.body,
      });
      setStep(5);
    } catch {
      toast.error("Não foi possível salvar o template.");
    } finally {
      setBusy(false);
    }
  }

  async function savePhoto() {
    if (!coupleId) return;
    setBusy(true);
    try {
      if (file) {
        const photo = await uploadPhoto(coupleId, file, "hero");
        await upsertSettings(coupleId, { hero_image_url: photo.public_url });
      }
      setStep(6);
    } catch {
      toast.error("Não foi possível enviar a foto.");
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    if (!coupleId) return;
    setBusy(true);
    try {
      await upsertSettings(coupleId, { published: true });
      await updateCouple(coupleId, { status: "active" });
      await queryClient.invalidateQueries();
      toast.success("Seu site está no ar!");
      navigate({ to: "/dashboard" });
    } catch {
      toast.error("Não foi possível publicar o site.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex h-16 max-w-3xl items-center px-4 sm:px-6">
        <Logo />
      </header>
      <main className="mx-auto max-w-2xl px-4 pb-20 sm:px-6">
        <Progress value={((step + 1) / STEPS.length) * 100} className="h-1.5" />
        <p className="mt-3 text-xs uppercase tracking-wide text-muted-foreground">
          Passo {step + 1} de {STEPS.length}
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">{STEPS[step]}</h1>

        <div className="surface-card fade-up mt-7 p-6 sm:p-8">
          {step === 0 && (
            <div className="space-y-5">
              <p className="text-sm leading-relaxed text-muted-foreground">
                Em poucos minutos vocês terão um site completo com contagem regressiva, confirmação
                de presença e lista de presentes. Podem alterar tudo depois.
              </p>
              <Button onClick={() => setStep(1)} className="w-full">
                Vamos lá <ArrowRight className="size-4" />
              </Button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="p1">Nome do noivo(a)</Label>
                  <Input id="p1" value={partner1} onChange={(e) => setPartner1(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="p2">Nome do noivo(a)</Label>
                  <Input id="p2" value={partner2} onChange={(e) => setPartner2(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Endereço do site</Label>
                <div className="flex items-center gap-2 rounded-lg border border-input px-3">
                  <span className="text-sm text-muted-foreground">/</span>
                  <Input
                    id="slug"
                    value={slug}
                    placeholder={suggestedSlug || "joao-e-maria"}
                    onChange={(e) => setSlug(slugify(e.target.value))}
                    className="border-0 px-0 shadow-none focus-visible:ring-0"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="story">Nossa história (opcional)</Label>
                <Textarea
                  id="story"
                  rows={4}
                  value={story}
                  onChange={(e) => setStory(e.target.value)}
                  placeholder="Como vocês se conheceram?"
                />
              </div>
              <StepNav
                onBack={() => setStep(0)}
                onNext={handleFinishBasics}
                busy={busy}
                nextLabel="Continuar"
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="date">Data do casamento</Label>
                  <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Horário da cerimônia</Label>
                  <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                </div>
              </div>
              <StepNav onBack={() => setStep(1)} onNext={saveWedding} busy={busy} />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="venue">Nome do local</Label>
                <Input id="venue" value={venue} onChange={(e) => setVenue(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">UF</Label>
                  <Input
                    id="state"
                    maxLength={2}
                    value={state}
                    onChange={(e) => setState(e.target.value.toUpperCase())}
                  />
                </div>
              </div>
              <StepNav onBack={() => setStep(2)} onNext={saveWedding} busy={busy} />
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-3">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.slug}
                    type="button"
                    onClick={() => setTemplate(t.slug)}
                    className={cn(
                      "rounded-xl border p-4 text-left transition-all",
                      template === t.slug
                        ? "border-primary ring-2 ring-primary/25"
                        : "border-border hover:border-primary/40",
                    )}
                  >
                    <div className="mb-3 flex gap-1.5">
                      {[t.primary, t.secondary, t.background].map((c) => (
                        <span
                          key={c}
                          className="size-5 rounded-full border border-border"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                    <p className="font-display text-lg font-semibold">{t.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{t.description}</p>
                  </button>
                ))}
              </div>
              <StepNav onBack={() => setStep(3)} onNext={saveTemplate} busy={busy} />
            </div>
          )}

          {step === 5 && (
            <div className="space-y-5">
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/40 p-8 text-center">
                {preview ? (
                  <img
                    src={preview}
                    alt="Pré-visualização da foto principal"
                    className="max-h-56 rounded-lg object-cover"
                  />
                ) : (
                  <>
                    <Upload className="size-6 text-muted-foreground" />
                    <span className="mt-2 text-sm font-medium">Escolher foto principal</span>
                    <span className="text-xs text-muted-foreground">JPG ou PNG até 5 MB</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setFile(f);
                    setPreview(f ? URL.createObjectURL(f) : null);
                  }}
                />
              </label>
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                <Button variant="ghost" onClick={() => setStep(4)}>
                  <ArrowLeft className="size-4" /> Voltar
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(6)} disabled={busy}>
                    Pular
                  </Button>
                  <Button onClick={savePhoto} disabled={busy}>
                    {busy ? <Loader2 className="size-4 animate-spin" /> : "Continuar"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-5 text-center">
              <PartyPopper className="mx-auto size-10 text-primary" />
              <p className="text-sm leading-relaxed text-muted-foreground">
                Tudo pronto! Seu site ficará disponível em
                <span className="mx-1 font-medium text-foreground">/{slug}</span>
                assim que for publicado.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                <Button variant="outline" onClick={() => navigate({ to: "/dashboard" })}>
                  Ir para o painel
                </Button>
                <Button onClick={publish} disabled={busy}>
                  {busy ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                  Publicar meu site
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function StepNav({
  onBack,
  onNext,
  busy,
  nextLabel = "Continuar",
}: {
  onBack: () => void;
  onNext: () => void;
  busy: boolean;
  nextLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <Button variant="ghost" onClick={onBack} disabled={busy}>
        <ArrowLeft className="size-4" /> Voltar
      </Button>
      <Button onClick={onNext} disabled={busy}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : null}
        {nextLabel}
        <ArrowRight className="size-4" />
      </Button>
    </div>
  );
}
