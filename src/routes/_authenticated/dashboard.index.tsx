import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CalendarHeart,
  ExternalLink,
  Gift,
  MailCheck,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { EmptyState } from "@/components/EmptyState";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useCouple, useGuests, useOrders, useSettings, useWedding } from "@/hooks/useWeddingData";
import { guestStats } from "@/services/guests";
import { orderStats } from "@/services/gifts";
import { countdownTo, formatCurrency, formatDateLong } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  head: () => ({
    meta: [
      { title: "Painel | Meu Casamento" },
      { name: "description", content: "Acompanhe convidados, presentes e pagamentos." },
      { property: "og:title", content: "Painel | Meu Casamento" },
      { property: "og:description", content: "Acompanhe convidados, presentes e pagamentos." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardHome,
});

function DashboardHome() {
  const { data: couple, isLoading } = useCouple();
  const { data: wedding } = useWedding(couple?.id);
  const { data: settings } = useSettings(couple?.id);
  const { data: guests = [] } = useGuests(couple?.id);
  const { data: orders = [] } = useOrders(couple?.id);

  if (isLoading) {
    return (
      <DashboardLayout title="Painel">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  if (!couple) {
    return (
      <DashboardLayout title="Painel">
        <EmptyState
          icon={Sparkles}
          title="Vamos criar seu casamento"
          description="Você ainda não configurou seu casamento. Leva menos de 3 minutos."
          action={
            <Button asChild>
              <Link to="/onboarding">Começar agora</Link>
            </Button>
          }
        />
      </DashboardLayout>
    );
  }

  const gs = guestStats(guests);
  const os = orderStats(orders);
  const cd = countdownTo(wedding?.wedding_date, wedding?.ceremony_time);

  return (
    <DashboardLayout
      title={couple.display_name}
      description={formatDateLong(wedding?.wedding_date)}
      actions={
        <>
          <Button variant="outline" asChild>
            <Link to="/dashboard/site">Editar site</Link>
          </Button>
          <Button asChild>
            <a href={`/${couple.slug}`} target="_blank" rel="noreferrer">
              Ver site <ExternalLink className="size-4" />
            </a>
          </Button>
        </>
      }
    >
      <div className="surface-card fade-up mb-6 flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Contagem regressiva
          </p>
          <p className="mt-2 font-display text-4xl font-semibold">
            {cd.past ? "Já aconteceu " : `${cd.days} dias`}
            <span className="ml-2 text-base font-normal text-muted-foreground">
              {cd.past ? "" : `${cd.hours}h ${cd.minutes}min`}
            </span>
          </p>
        </div>
        <Badge variant={settings?.published ? "default" : "secondary"}>
          {settings?.published ? "Site publicado" : "Rascunho"}
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Convidados" value={gs.total} hint={`${gs.pending} pendentes`} />
        <StatCard icon={MailCheck} label="Confirmados" value={gs.confirmed} tone="success" />
        <StatCard icon={Gift} label="Presentes recebidos" value={os.paid} />
        <StatCard
          icon={Wallet}
          label="Valor recebido"
          value={formatCurrency(os.amountReceived)}
          tone="success"
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="surface-card p-6">
          <h2 className="font-display text-xl font-semibold">Próximos passos</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <ChecklistItem done={Boolean(wedding?.wedding_date)} label="Definir data e horário" to="/dashboard/casamento" />
            <ChecklistItem done={Boolean(settings?.hero_image_url)} label="Adicionar foto de capa" to="/dashboard/site" />
            <ChecklistItem done={guests.length > 0} label="Cadastrar convidados" to="/dashboard/convidados" />
            <ChecklistItem done={os.total > 0} label="Criar lista de presentes" to="/dashboard/presentes" />
            <ChecklistItem done={Boolean(settings?.published)} label="Publicar o site" to="/dashboard/configuracoes" />
          </ul>
        </div>

        <div className="surface-card p-6">
          <h2 className="font-display text-xl font-semibold">Últimos presentes</h2>
          {orders.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Nenhum presente recebido ainda. Compartilhe o link do seu site com os convidados.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {orders.slice(0, 5).map((order) => (
                <li key={order.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{order.guest_name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {order.gift_items?.name ?? "Presente"}
                    </span>
                  </span>
                  <span className="shrink-0 font-medium">{formatCurrency(order.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-6 surface-card flex flex-col items-start gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <CalendarHeart className="size-5 text-primary" />
          <p className="text-sm text-muted-foreground">
            Link do seu site: <span className="font-medium text-foreground">/{couple.slug}</span>
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigator.clipboard.writeText(`${window.location.origin}/${couple.slug}`)}
        >
          Copiar link
        </Button>
      </div>
    </DashboardLayout>
  );
}

function ChecklistItem({ done, label, to }: { done: boolean; label: string; to: string }) {
  return (
    <li className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2">
        <span
          className={
            done
              ? "flex size-5 items-center justify-center rounded-full bg-success/20 text-[10px] font-bold text-success"
              : "flex size-5 items-center justify-center rounded-full border border-border text-[10px] text-muted-foreground"
          }
        >
          {done ? "✓" : ""}
        </span>
        <span className={done ? "text-muted-foreground line-through" : ""}>{label}</span>
      </span>
      {!done ? (
        <Link to={to} className="text-xs font-medium text-primary underline-offset-4 hover:underline">
          Fazer
        </Link>
      ) : null}
    </li>
  );
}
