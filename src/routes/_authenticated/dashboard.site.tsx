import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Check,
  ExternalLink,
  ImagePlus,
  Loader2,
  Monitor,
  Save,
  Smartphone,
  Trash2,
  X,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SectionsBuilder } from "@/components/dashboard/SectionsBuilder";
import {
  VisualSiteEditor,
  VisualSiteEditorSkeleton,
} from "@/components/dashboard/VisualSiteEditor";
import {
  useCouple,
  useGifts,
  usePhotos,
  useSections,
  useSettings,
  useWedding,
} from "@/hooks/useWeddingData";
import { applyTemplateLayout, ensureSections, upsertSettings } from "@/services/couples";
import { deletePhoto, uploadPhoto } from "@/services/storage";
import { useGoogleFonts } from "@/hooks/useGoogleFonts";
import { VISUAL_STYLES } from "@/lib/visual-styles";
import { TEMPLATES } from "@/types";
import type { WeddingSiteData } from "@/components/site/WeddingSiteView";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard/site")({
  head: () => ({
    meta: [
      { title: "Meu site | Meu Casamento" },
      { name: "description", content: "Personalize as seções, cores e fotos do seu site." },
      { property: "og:title", content: "Meu site | Meu Casamento" },
      { property: "og:description", content: "Personalize as seções, cores e fotos do seu site." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SiteEditorPage,
});

function SiteEditorPage() {
  const queryClient = useQueryClient();
  const { data: couple, isLoading } = useCouple();
  const { data: wedding } = useWedding(couple?.id);
  const { data: settings } = useSettings(couple?.id);
  const { data: sections = [] } = useSections(couple?.id);
  const { data: photos = [] } = usePhotos(couple?.id);
  const { data: gifts = [] } = useGifts(couple?.id);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<"mobile" | "desktop">("mobile");

  // Garante que todas as seções previstas existam para este casal (inclui seções novas
  // criadas depois que a conta foi aberta), assim que soubermos o couple.id.
  useEffect(() => {
    if (!couple?.id) return;
    void ensureSections(couple.id).then(() => {
      void queryClient.invalidateQueries({ queryKey: ["sections", couple.id] });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [couple?.id]);

  const [style, setStyle] = useState({
    template_slug: "elegante",
    primary_color: "#8a6f52",
    secondary_color: "#c9b8a3",
    background_color: "#fbf8f4",
    heading_font: "Cormorant Garamond",
    body_font: "Karla",
  });

  useEffect(() => {
    if (!settings) return;
    setStyle({
      template_slug: settings.template_slug ?? "elegante",
      primary_color: settings.primary_color ?? "#8a6f52",
      secondary_color: settings.secondary_color ?? "#c9b8a3",
      background_color: settings.background_color ?? "#fbf8f4",
      heading_font: settings.heading_font ?? "Cormorant Garamond",
      body_font: settings.body_font ?? "Karla",
    });
  }, [settings]);

  async function saveStyle() {
    if (!couple) return;
    setSaving(true);
    try {
      await upsertSettings(couple.id, style);
      await queryClient.invalidateQueries({ queryKey: ["settings", couple.id] });
      toast.success("Aparência atualizada.");
    } catch {
      toast.error("Não foi possível salvar a aparência.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpload(file: File, category: "hero" | "gallery") {
    if (!couple) return;
    setUploading(true);
    try {
      const photo = await uploadPhoto(couple.id, file, category);
      if (category === "hero") {
        await upsertSettings(couple.id, { hero_image_url: photo.public_url });
      }
      await queryClient.invalidateQueries();
      toast.success("Foto enviada.");
    } catch {
      toast.error("Não foi possível enviar a foto.");
    } finally {
      setUploading(false);
    }
  }

  const siteData: WeddingSiteData | null =
    couple && settings
      ? {
          couple,
          wedding: wedding ?? null,
          settings,
          sections,
          photos,
          gifts,
          messages: [],
        }
      : null;

  return (
    <DashboardLayout
      title="Meu site"
      description="Personalize o visual, o conteúdo das seções e as fotos."
      actions={
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setPreviewOpen(true)} disabled={!couple?.slug}>
            <ExternalLink className="size-4" />
            Visualizar site
          </Button>
          <Button onClick={saveStyle} disabled={saving || !couple}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Salvar aparência
          </Button>
        </div>
      }
    >
      {couple?.slug && previewOpen ? (
        <SitePreviewModal
          slug={couple.slug}
          mode={previewMode}
          onModeChange={setPreviewMode}
          onClose={() => setPreviewOpen(false)}
        />
      ) : null}

      {isLoading ? (
        <Skeleton className="h-96 rounded-xl" />
      ) : (
        <Tabs defaultValue="visual">
          <TabsList>
            <TabsTrigger value="visual">Editor visual</TabsTrigger>
            <TabsTrigger value="aparencia">Aparência</TabsTrigger>
            <TabsTrigger value="secoes">Seções</TabsTrigger>
            <TabsTrigger value="layouts">✨ Layouts</TabsTrigger>
            <TabsTrigger value="fotos">Fotos</TabsTrigger>
          </TabsList>

          <TabsContent value="visual" className="mt-5">
            {couple && siteData ? (
              <VisualSiteEditor coupleId={couple.id} data={siteData} />
            ) : (
              <VisualSiteEditorSkeleton />
            )}
          </TabsContent>

          <TabsContent value="layouts" className="mt-5">
            {couple ? (
              <VisualStyleGallery
                coupleId={couple.id}
                current={settings?.visual_style ?? "nenhum"}
              />
            ) : null}
          </TabsContent>

          <TabsContent value="aparencia" className="mt-5">
            <div className="surface-card space-y-6 p-6">
              <div>
                <h2 className="font-display text-xl font-semibold">Layouts prontos</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Cada opção já define cores, fontes, altura/alinhamento do banner, disposição da
                  história e espaçamento das seções — tudo de uma vez.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {TEMPLATES.map((t) => (
                    <button
                      key={t.slug}
                      type="button"
                      onClick={() => {
                        setStyle((s) => ({
                          ...s,
                          template_slug: t.slug,
                          primary_color: t.primary,
                          secondary_color: t.secondary,
                          background_color: t.background,
                          heading_font: t.heading,
                          body_font: t.body,
                        }));
                        void applyTemplateLayout(sections, t)
                          .then(() =>
                            queryClient.invalidateQueries({ queryKey: ["sections", couple?.id] }),
                          )
                          .then(() => toast.success(`Layout "${t.name}" aplicado às seções.`))
                          .catch(() => toast.error("Não foi possível aplicar o layout às seções."));
                      }}
                      className={cn(
                        "rounded-xl border p-4 text-left transition-all",
                        style.template_slug === t.slug
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
                      <p
                        className="text-lg font-semibold"
                        style={{ fontFamily: `"${t.heading}", serif` }}
                      >
                        {t.name}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">{t.description}</p>
                      <p className="mt-2 text-[11px] uppercase tracking-wide text-muted-foreground/70">
                        {t.heading} + {t.body}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                As cores e fontes só valem depois de clicar em "Salvar aparência" — mas o layout do
                banner, da história e o espaçamento das seções já ficam salvos assim que você
                escolhe um layout pronto.
              </p>
              <TemplateFontLoader />

              <div className="grid gap-4 sm:grid-cols-3">
                <ColorField
                  label="Cor principal"
                  value={style.primary_color}
                  onChange={(v) => setStyle((s) => ({ ...s, primary_color: v }))}
                />
                <ColorField
                  label="Cor secundária"
                  value={style.secondary_color}
                  onChange={(v) => setStyle((s) => ({ ...s, secondary_color: v }))}
                />
                <ColorField
                  label="Fundo"
                  value={style.background_color}
                  onChange={(v) => setStyle((s) => ({ ...s, background_color: v }))}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="secoes" className="mt-5">
            {couple ? <SectionsBuilder coupleId={couple.id} sections={sections} /> : null}
          </TabsContent>

          <TabsContent value="fotos" className="mt-5">
            <div className="surface-card space-y-5 p-6">
              <div className="flex flex-wrap gap-3">
                <UploadButton
                  label="Enviar foto de capa"
                  busy={uploading}
                  onFile={(f) => handleUpload(f, "hero")}
                />
                <UploadButton
                  label="Adicionar à galeria"
                  busy={uploading}
                  onFile={(f) => handleUpload(f, "gallery")}
                />
              </div>

              {photos.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma foto enviada ainda.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {photos.map((photo) => (
                    <figure key={photo.id} className="group relative overflow-hidden rounded-lg">
                      <img
                        src={photo.public_url}
                        alt={photo.caption ?? "Foto do casal"}
                        loading="lazy"
                        className="aspect-square w-full object-cover"
                      />
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100"
                        aria-label="Remover foto"
                        onClick={async () => {
                          await deletePhoto(photo);
                          await queryClient.invalidateQueries();
                        }}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </figure>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </DashboardLayout>
  );
}

/** Pré-visualização do site publicado, em iframe, com alternância mobile/desktop. */
function SitePreviewModal({
  slug,
  mode,
  onModeChange,
  onClose,
}: {
  slug: string;
  mode: "mobile" | "desktop";
  onModeChange: (mode: "mobile" | "desktop") => void;
  onClose: () => void;
}) {
  const url = `/${slug}`;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/60 p-3 sm:p-6">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col overflow-hidden rounded-xl bg-background shadow-xl">
        <div className="flex items-center justify-between gap-3 border-b border-border p-3">
          <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
            <button
              type="button"
              onClick={() => onModeChange("mobile")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                mode === "mobile" ? "bg-background shadow-sm" : "text-muted-foreground",
              )}
            >
              <Smartphone className="size-4" />
              Celular
            </button>
            <button
              type="button"
              onClick={() => onModeChange("desktop")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                mode === "desktop" ? "bg-background shadow-sm" : "text-muted-foreground",
              )}
            >
              <Monitor className="size-4" />
              Desktop
            </button>
          </div>
          <div className="flex items-center gap-2">
            <a href={url} target="_blank" rel="noreferrer">
              <Button size="sm" variant="outline">
                <ExternalLink className="size-4" />
                Abrir em nova aba
              </Button>
            </a>
            <Button
              size="icon"
              variant="ghost"
              onClick={onClose}
              aria-label="Fechar pré-visualização"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center overflow-auto bg-muted/40 p-4">
          <iframe
            key={mode}
            src={url}
            title="Pré-visualização do site"
            className={cn(
              "h-full rounded-lg border border-border bg-white shadow-sm",
              mode === "mobile" ? "w-[390px]" : "w-full",
            )}
          />
        </div>
      </div>
    </div>
  );
}

function TemplateFontLoader() {
  useGoogleFonts(TEMPLATES.flatMap((t) => [t.heading, t.body]));
  return null;
}

/**
 * Biblioteca de layouts (estilos visuais decorativos). Fica isolada das seções e do
 * "Aparência" — aqui o casal escolhe um estilo puramente decorativo (motivos, texturas,
 * divisores, animações) que é aplicado sobre a estrutura de seções já existente, sem alterar
 * texto, fotos ou qualquer outra configuração.
 */
function VisualStyleGallery({ coupleId, current }: { coupleId: string; current: string }) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [applying, setApplying] = useState<string | null>(null);

  async function apply(slug: string) {
    setApplying(slug);
    try {
      await upsertSettings(coupleId, { visual_style: slug });
      await queryClient.invalidateQueries({ queryKey: ["settings", coupleId] });
      toast.success(slug === "nenhum" ? "Visual original restaurado." : "Estilo aplicado ao site.");
      setExpanded(null);
    } catch {
      toast.error("Não foi possível aplicar o estilo.");
    } finally {
      setApplying(null);
    }
  }

  return (
    <div className="surface-card space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold">Biblioteca de layouts</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Estilos decorativos prontos (motivos, texturas e animações) aplicados por cima do seu
            site — sem apagar textos, fotos ou qualquer configuração já feita.
          </p>
        </div>
        {current !== "nenhum" ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => void apply("nenhum")}
            disabled={!!applying}
          >
            {applying === "nenhum" ? <Loader2 className="size-4 animate-spin" /> : null}
            Restaurar visual original
          </Button>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {VISUAL_STYLES.filter((s) => s.slug !== "nenhum").map((s) => (
          <div
            key={s.slug}
            className={cn(
              "flex flex-col rounded-xl border p-4",
              current === s.slug ? "border-primary ring-2 ring-primary/25" : "border-border",
            )}
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">{s.emoji}</span>
              <p className="font-display text-lg font-semibold">{s.name}</p>
              {current === s.slug ? (
                <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                  Ativo
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{s.description}</p>

            {expanded === s.slug ? (
              <ul className="mt-3 space-y-1.5 text-sm">
                {s.includes.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-primary" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setExpanded((e) => (e === s.slug ? null : s.slug))}
              >
                {expanded === s.slug ? "Ver menos" : "Ver detalhes"}
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={() => void apply(s.slug)}
                disabled={!!applying || current === s.slug}
              >
                {applying === s.slug ? <Loader2 className="size-4 animate-spin" /> : null}
                {current === s.slug ? "Aplicado" : "Aplicar"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="size-10 cursor-pointer rounded-md border border-input bg-transparent"
          aria-label={label}
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    </div>
  );
}

function UploadButton({
  label,
  busy,
  onFile,
}: {
  label: string;
  busy: boolean;
  onFile: (file: File) => void;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input px-4 py-2 text-sm font-medium transition-colors hover:bg-accent">
      {busy ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
      {label}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
    </label>
  );
}
