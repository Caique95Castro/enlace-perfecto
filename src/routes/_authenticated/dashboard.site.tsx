import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, EyeOff, ImagePlus, Loader2, Save, Trash2 } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCouple, usePhotos, useSections, useSettings } from "@/hooks/useWeddingData";
import { updateSection, upsertSettings } from "@/services/couples";
import { deletePhoto, uploadPhoto } from "@/services/storage";
import { SECTION_LABELS, TEMPLATES, type SectionType } from "@/types";
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
  const { data: settings } = useSettings(couple?.id);
  const { data: sections = [] } = useSections(couple?.id);
  const { data: photos = [] } = usePhotos(couple?.id);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [style, setStyle] = useState({
    template_slug: "elegante",
    primary_color: "#8a6f52",
    secondary_color: "#c9b8a3",
    background_color: "#fbf8f4",
  });

  useEffect(() => {
    if (!settings) return;
    setStyle({
      template_slug: settings.template_slug ?? "elegante",
      primary_color: settings.primary_color ?? "#8a6f52",
      secondary_color: settings.secondary_color ?? "#c9b8a3",
      background_color: settings.background_color ?? "#fbf8f4",
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

  return (
    <DashboardLayout
      title="Meu site"
      description="Personalize o visual, o conteúdo das seções e as fotos."
      actions={
        <Button onClick={saveStyle} disabled={saving || !couple}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Salvar aparência
        </Button>
      }
    >
      {isLoading ? (
        <Skeleton className="h-96 rounded-xl" />
      ) : (
        <Tabs defaultValue="aparencia">
          <TabsList>
            <TabsTrigger value="aparencia">Aparência</TabsTrigger>
            <TabsTrigger value="secoes">Seções</TabsTrigger>
            <TabsTrigger value="fotos">Fotos</TabsTrigger>
          </TabsList>

          <TabsContent value="aparencia" className="mt-5">
            <div className="surface-card space-y-6 p-6">
              <div>
                <h2 className="font-display text-xl font-semibold">Template</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {TEMPLATES.map((t) => (
                    <button
                      key={t.slug}
                      type="button"
                      onClick={() =>
                        setStyle((s) => ({
                          ...s,
                          template_slug: t.slug,
                          primary_color: t.primary,
                          secondary_color: t.secondary,
                          background_color: t.background,
                        }))
                      }
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
                      <p className="font-display text-lg font-semibold">{t.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{t.description}</p>
                    </button>
                  ))}
                </div>
              </div>

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
            <div className="space-y-3">
              {sections.map((section) => (
                <SectionEditor key={section.id} section={section} />
              ))}
            </div>
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

function SectionEditor({
  section,
}: {
  section: { id: string; section_type: string; title: string | null; content: string | null; visible: boolean };
}) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(section.title ?? "");
  const [content, setContent] = useState(section.content ?? "");
  const [visible, setVisible] = useState(section.visible);
  const [saving, setSaving] = useState(false);

  async function save(next?: { visible?: boolean }) {
    setSaving(true);
    try {
      await updateSection(section.id, {
        title,
        content: content || null,
        visible: next?.visible ?? visible,
      });
      await queryClient.invalidateQueries({ queryKey: ["sections"] });
    } catch {
      toast.error("Não foi possível salvar a seção.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="surface-card p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {visible ? (
            <Eye className="size-4 text-primary" />
          ) : (
            <EyeOff className="size-4 text-muted-foreground" />
          )}
          <p className="font-medium">
            {SECTION_LABELS[section.section_type as SectionType] ?? section.section_type}
          </p>
        </div>
        <Switch
          checked={visible}
          onCheckedChange={(v) => {
            setVisible(v);
            void save({ visible: v });
          }}
          aria-label="Mostrar seção"
        />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título" />
        <Textarea
          className="lg:col-span-2"
          rows={2}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Texto da seção"
        />
      </div>
      <div className="mt-3 flex justify-end">
        <Button size="sm" variant="outline" onClick={() => save()} disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : null}
          Salvar seção
        </Button>
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
