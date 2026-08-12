import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ExternalLink, Loader2, Save } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useCouple, useSettings } from "@/hooks/useWeddingData";
import { isSlugAvailable, updateCouple, upsertSettings } from "@/services/couples";
import { slugify } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dashboard/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações | Meu Casamento" },
      { name: "description", content: "Endereço do site, publicação e conta." },
      { property: "og:title", content: "Configurações | Meu Casamento" },
      { property: "og:description", content: "Endereço do site, publicação e conta." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: couple, isLoading } = useCouple();
  const { data: settings } = useSettings(couple?.id);
  const [slug, setSlug] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (couple) setSlug(couple.slug);
  }, [couple]);

  async function saveSlug() {
    if (!couple) return;
    const next = slugify(slug);
    if (!next) {
      toast.error("Informe um endereço válido.");
      return;
    }
    setSaving(true);
    try {
      if (next !== couple.slug && !(await isSlugAvailable(next, couple.id))) {
        toast.error("Esse endereço já está em uso.");
        return;
      }
      await updateCouple(couple.id, { slug: next });
      await queryClient.invalidateQueries({ queryKey: ["couple"] });
      toast.success("Endereço atualizado.");
    } catch {
      toast.error("Não foi possível atualizar o endereço.");
    } finally {
      setSaving(false);
    }
  }

  async function togglePublish(value: boolean) {
    if (!couple) return;
    try {
      await upsertSettings(couple.id, { published: value });
      await updateCouple(couple.id, { status: value ? "active" : "draft" });
      await queryClient.invalidateQueries();
      toast.success(value ? "Site publicado!" : "Site despublicado.");
    } catch {
      toast.error("Não foi possível alterar a publicação.");
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout title="Configurações">
        <Skeleton className="h-72 rounded-xl" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Configurações" description="Endereço, publicação e dados da conta.">
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="surface-card space-y-4 p-6">
          <h2 className="font-display text-xl font-semibold">Endereço do site</h2>
          <div className="space-y-2">
            <Label htmlFor="slug">Link público</Label>
            <div className="flex gap-2">
              <Input id="slug" value={slug} onChange={(e) => setSlug(slugify(e.target.value))} />
              <Button onClick={saveSlug} disabled={saving}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              </Button>
            </div>
            {couple ? (
              <a
                href={`/${couple.slug}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline"
              >
                Abrir site <ExternalLink className="size-3.5" />
              </a>
            ) : null}
          </div>
        </section>

        <section className="surface-card space-y-4 p-6">
          <h2 className="font-display text-xl font-semibold">Publicação</h2>
          <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-4">
            <div>
              <p className="font-medium">Site publicado</p>
              <p className="text-sm text-muted-foreground">
                Quando desligado, o site fica invisível para os convidados.
              </p>
            </div>
            <Switch
              checked={Boolean(settings?.published)}
              onCheckedChange={togglePublish}
              aria-label="Publicar site"
              disabled={!couple}
            />
          </div>
        </section>

        <section className="surface-card space-y-3 p-6 lg:col-span-2">
          <h2 className="font-display text-xl font-semibold">Conta</h2>
          <p className="text-sm text-muted-foreground">
            E-mail de acesso: <span className="font-medium text-foreground">{user?.email}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Plano atual: <span className="font-medium text-foreground">Gratuito</span>
          </p>
        </section>
      </div>
    </DashboardLayout>
  );
}
