import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Loader2, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LAYOUT_PRESETS,
  hasPresetApplied,
  presetOf,
  sectionPresetsFor,
  sitePreset,
  type LayoutPreset,
  type SectionPreset,
} from "@/lib/layout-presets";
import {
  applyGlobalPreset,
  applySectionPreset,
  restoreOriginalLayout,
} from "@/services/layout-library";
import { useGoogleFonts } from "@/hooks/useGoogleFonts";
import { SECTION_LABELS, type SectionType, type WebsiteSection, type WebsiteSettings } from "@/types";
import { cn } from "@/lib/utils";

/**
 * BIBLIOTECA DE LAYOUTS — camada adicional de personalização visual.
 * Não altera o editor existente: apenas grava configurações visuais nas seções que já existem.
 */
export function LayoutLibrary({
  coupleId,
  sections,
  settings,
}: {
  coupleId: string;
  sections: WebsiteSection[];
  settings: WebsiteSettings | null | undefined;
}) {
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState<LayoutPreset | null>(null);
  const [busy, setBusy] = useState(false);
  const applied = sitePreset(sections);

  useGoogleFonts(LAYOUT_PRESETS.flatMap((p) => [p.style.heading_font, p.style.body_font]));

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ["sections", coupleId] });
    await queryClient.invalidateQueries({ queryKey: ["settings", coupleId] });
  }

  async function apply(preset: LayoutPreset) {
    setBusy(true);
    try {
      await applyGlobalPreset(coupleId, sections, preset, settings);
      await refresh();
      toast.success(`Estilo "${preset.name}" aplicado ao site inteiro.`);
      setConfirming(null);
    } catch {
      toast.error("Não foi possível aplicar o estilo.");
    } finally {
      setBusy(false);
    }
  }

  async function restore() {
    setBusy(true);
    try {
      await restoreOriginalLayout(coupleId, sections);
      await refresh();
      toast.success("Visual original restaurado. Nenhum conteúdo foi alterado.");
    } catch {
      toast.error("Não foi possível restaurar o visual.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="surface-card p-6">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:justify-between">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
              <Sparkles className="size-5 shrink-0 text-primary" />
              Escolha um estilo
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Estilos prontos mudam apenas a aparência (cores, fontes, fundos, bordas, decorações e
              animações). Seus textos, fotos, datas, presentes e confirmações continuam intactos.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => void restore()}
            disabled={busy || !hasPresetApplied(sections)}
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}
            Restaurar visual original
          </Button>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LAYOUT_PRESETS.map((preset) => (
            <article
              key={preset.id}
              className={cn(
                "overflow-hidden rounded-xl border transition-all",
                applied === preset.id
                  ? "border-primary ring-2 ring-primary/25"
                  : "border-border hover:border-primary/40",
              )}
            >
              <PresetPreview preset={preset} />
              <div className="space-y-2 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate font-medium">
                    {preset.emoji} {preset.name}
                  </p>
                  {applied === preset.id ? (
                    <span className="flex shrink-0 items-center gap-1 text-xs text-primary">
                      <Check className="size-3.5" /> Aplicado
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground">{preset.description}</p>
                <Button
                  size="sm"
                  className="w-full"
                  variant={applied === preset.id ? "outline" : "default"}
                  onClick={() => setConfirming(preset)}
                >
                  Ver prévia e aplicar
                </Button>
              </div>
            </article>
          ))}
        </div>
      </div>

      <SectionPresetLibrary coupleId={coupleId} sections={sections} onApplied={refresh} />

      <Dialog open={!!confirming} onOpenChange={(open) => !open && setConfirming(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          {confirming ? (
            <>
              <DialogHeader>
                <DialogTitle>
                  {confirming.emoji} {confirming.name}
                </DialogTitle>
                <DialogDescription>{confirming.description}</DialogDescription>
              </DialogHeader>
              <PresetPreview preset={confirming} large />
              <ul className="space-y-1.5 text-sm">
                {confirming.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check className="size-4 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground">
                Nenhum texto, foto ou informação do casamento é apagada ao aplicar este estilo.
              </p>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setConfirming(null)} disabled={busy}>
                  Cancelar
                </Button>
                <Button onClick={() => void apply(confirming)} disabled={busy}>
                  {busy ? <Loader2 className="size-4 animate-spin" /> : null}
                  Aplicar ao site inteiro
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Miniatura do estilo, montada com as próprias cores/fontes do modelo. */
function PresetPreview({ preset, large }: { preset: LayoutPreset; large?: boolean }) {
  const { primary_color, secondary_color, background_color, heading_font, body_font } =
    preset.style;
  useGoogleFonts([heading_font, body_font]);

  return (
    <div
      className={cn("relative overflow-hidden", large ? "h-48 rounded-xl" : "h-32")}
      style={{ backgroundColor: background_color }}
    >
      <div
        className="absolute -left-8 -top-8 size-28 rounded-full blur-md"
        style={{ backgroundColor: `${secondary_color}66` }}
      />
      <div
        className="absolute -bottom-10 -right-6 size-24 rounded-full blur-md"
        style={{ backgroundColor: `${primary_color}33` }}
      />
      <div
        className={cn(
          "relative flex h-full flex-col justify-center gap-2 px-5",
          preset.perType.hero?.["content_align"] === "esquerda" ? "items-start" : "items-center",
        )}
      >
        <span
          className="text-[9px] uppercase tracking-[0.3em]"
          style={{ color: primary_color, fontFamily: `"${body_font}", sans-serif` }}
        >
          Vamos nos casar
        </span>
        <span
          className={cn("font-semibold leading-tight", large ? "text-3xl" : "text-xl")}
          style={{ color: primary_color, fontFamily: `"${heading_font}", serif` }}
        >
          Ana &amp; João
        </span>
        <span
          className="text-[10px] opacity-70"
          style={{ color: primary_color, fontFamily: `"${body_font}", sans-serif` }}
        >
          24 . 08 . 2027
        </span>
        <div className="mt-1 flex gap-1.5">
          {[primary_color, secondary_color, background_color].map((c) => (
            <span
              key={c}
              className="size-3 rounded-full border border-black/10"
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Modelos aplicáveis a uma seção específica (Hero, História, Dress Code, Galeria, Rodapé). */
function SectionPresetLibrary({
  coupleId,
  sections,
  onApplied,
}: {
  coupleId: string;
  sections: WebsiteSection[];
  onApplied: () => Promise<void>;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const types: SectionType[] = ["hero", "story", "dress_code", "gallery", "footer"];
  const available = types.filter(
    (t) => sectionPresetsFor(t).length > 0 && sections.some((s) => s.section_type === t),
  );
  if (available.length === 0) return null;

  async function apply(section: WebsiteSection, preset: SectionPreset) {
    setBusyId(preset.id);
    try {
      await applySectionPreset(section, preset);
      await onApplied();
      toast.success(`"${preset.name}" aplicado.`);
    } catch {
      toast.error("Não foi possível aplicar o modelo.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="surface-card p-6">
      <h2 className="font-display text-xl font-semibold">Modelos por seção</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Opcional: aplique um estilo diferente só numa seção, sem mexer no resto do site.
      </p>

      <Tabs defaultValue={available[0] as string} className="mt-4">
        <TabsList className="flex-wrap">
          {available.map((t) => (
            <TabsTrigger key={t} value={t}>
              {SECTION_LABELS[t]}
            </TabsTrigger>
          ))}
        </TabsList>

        {available.map((t) => {
          const section = sections.find((s) => s.section_type === t)!;
          const current = presetOf(section);
          return (
            <TabsContent key={t} value={t} className="mt-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {sectionPresetsFor(t).map((preset) => (
                  <div
                    key={preset.id}
                    className={cn(
                      "rounded-xl border p-4",
                      current === preset.id
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-border",
                    )}
                  >
                    <p className="font-medium">{preset.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{preset.description}</p>
                    <Button
                      size="sm"
                      variant={current === preset.id ? "outline" : "secondary"}
                      className="mt-3 w-full"
                      disabled={busyId !== null}
                      onClick={() => void apply(section, preset)}
                    >
                      {busyId === preset.id ? <Loader2 className="size-4 animate-spin" /> : null}
                      {current === preset.id ? "Aplicado" : "Aplicar nesta seção"}
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
      <p className="mt-4 text-xs text-muted-foreground">
        Depois de aplicar, continue editando normalmente na aba "Seções" — nada fica travado.
      </p>
      <input type="hidden" value={coupleId} readOnly />
    </div>
  );
}
