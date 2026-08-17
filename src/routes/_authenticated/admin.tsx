import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { StatCard } from "@/components/StatCard";
import { supabase } from "@/integrations/supabase/client";
import { setFeatureFlag } from "@/services/flags";
import { useFeatureFlags, useRoles } from "@/hooks/usePlatform";
import { formatCurrency } from "@/lib/format";
import { Users, CalendarHeart, Globe, Wallet } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Administração | Meu Casamento" },
      { name: "description", content: "Painel administrativo da plataforma." },
      { property: "og:title", content: "Administração | Meu Casamento" },
      { property: "og:description", content: "Painel administrativo da plataforma." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

/**
 * A autorização real é do banco: as policies só devolvem estes dados
 * para quem tem papel admin/root (função is_staff). A checagem abaixo
 * é apenas de interface.
 */
function useAdminOverview(enabled: boolean) {
  return useQuery({
    queryKey: ["admin-overview"],
    enabled,
    queryFn: async () => {
      const [couples, settings, orders] = await Promise.all([
        supabase.from("couples").select("id, owner_id, display_name, slug, status, created_at").order("created_at", { ascending: false }),
        supabase.from("website_settings").select("couple_id, published, template_slug"),
        supabase.from("gift_orders").select("amount, status"),
      ]);
      if (couples.error) throw couples.error;
      const published = (settings.data ?? []).filter((s) => s.published);
      const paid = (orders.data ?? []).filter((o) => o.status === "paid");
      return {
        couples: couples.data ?? [],
        publishedIds: new Set(published.map((s) => s.couple_id)),
        publishedCount: published.length,
        revenue: paid.reduce((sum, o) => sum + Number(o.amount ?? 0), 0),
        userCount: new Set((couples.data ?? []).map((c) => c.owner_id)).size,
      };

    },
  });
}

function AdminPage() {
  const { isAdmin, isRoot, isLoading: rolesLoading } = useRoles();
  const { data, isLoading } = useAdminOverview(isAdmin);
  const { data: flags = [] } = useFeatureFlags();
  const qc = useQueryClient();

  if (rolesLoading) {
    return (
      <DashboardLayout title="Administração">
        <Skeleton className="h-40 rounded-xl" />
      </DashboardLayout>
    );
  }

  if (!isAdmin) {
    return (
      <DashboardLayout title="Administração">
        <EmptyState
          icon={ShieldCheck}
          title="Acesso restrito"
          description="Esta área é exclusiva para administradores da plataforma."
          action={
            <Button asChild>
              <Link to="/dashboard">Voltar ao painel</Link>
            </Button>
          }
        />
      </DashboardLayout>
    );
  }

  async function toggle(key: string, enabled: boolean) {
    try {
      await setFeatureFlag(key, enabled);
      await qc.invalidateQueries({ queryKey: ["feature-flags"] });
    } catch {
      toast.error("Não foi possível alterar a funcionalidade.");
    }
  }

  return (
    <DashboardLayout
      title="Administração"
      description={isRoot ? "Acesso root: todos os recursos liberados." : "Acesso administrativo."}
      actions={<Badge>{isRoot ? "root" : "admin"}</Badge>}
    >
      {isLoading || !data ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={Users} label="Usuários" value={data.userCount} />
            <StatCard icon={CalendarHeart} label="Casamentos" value={data.couples.length} />
            <StatCard icon={Globe} label="Sites publicados" value={data.publishedCount} />
            <StatCard icon={Wallet} label="Presentes pagos" value={formatCurrency(data.revenue)} tone="success" />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="surface-card p-6">
              <h2 className="font-display text-xl font-semibold">Casamentos</h2>
              {data.couples.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">Nenhum casamento criado ainda.</p>
              ) : (
                <ul className="mt-4 space-y-3 text-sm">
                  {data.couples.map((c) => (
                    <li key={c.id} className="flex items-center justify-between gap-3">
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{c.display_name}</span>
                        <span className="block truncate text-xs text-muted-foreground">/{c.slug}</span>
                      </span>
                      <Badge variant={data.publishedIds.has(c.id) ? "default" : "secondary"}>
                        {data.publishedIds.has(c.id) ? "publicado" : "rascunho"}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="surface-card p-6">
              <h2 className="font-display text-xl font-semibold">Funcionalidades</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Controle global. O plano mínimo já fica registrado para a monetização futura.
              </p>
              <ul className="mt-4 space-y-4">
                {flags.map((flag) => (
                  <li key={flag.key} className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium">{flag.label}</p>
                      <p className="text-xs text-muted-foreground">{flag.description}</p>
                      <Badge variant="secondary" className="mt-1">{flag.min_plan}</Badge>
                    </div>
                    <Switch
                      checked={flag.enabled}
                      onCheckedChange={(v) => toggle(flag.key, v)}
                      aria-label={`Ativar ${flag.label}`}
                    />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
