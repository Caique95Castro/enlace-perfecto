import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MailCheck } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useCouple } from "@/hooks/useWeddingData";
import { listRsvps } from "@/services/guests";
import { formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dashboard/rsvp")({
  head: () => ({
    meta: [
      { title: "RSVP | Meu Casamento" },
      { name: "description", content: "Veja todas as confirmações de presença recebidas." },
      { property: "og:title", content: "RSVP | Meu Casamento" },
      { property: "og:description", content: "Veja todas as confirmações de presença recebidas." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RsvpPage,
});

function RsvpPage() {
  const { data: couple } = useCouple();
  const { data: rsvps = [], isLoading } = useQuery({
    queryKey: ["rsvps", couple?.id],
    queryFn: () => listRsvps(couple!.id),
    enabled: Boolean(couple?.id),
  });

  return (
    <DashboardLayout title="RSVP" description="Respostas enviadas pelo site do casamento.">
      {isLoading ? (
        <Skeleton className="h-56 rounded-xl" />
      ) : rsvps.length === 0 ? (
        <EmptyState
          icon={MailCheck}
          title="Nenhuma confirmação ainda"
          description="Assim que seus convidados responderem pelo site, as respostas aparecem aqui."
        />
      ) : (
        <div className="space-y-3">
          {rsvps.map((rsvp) => (
            <div key={rsvp.id} className="surface-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{rsvp.guests?.name ?? "Convidado"}</p>
                  <p className="text-xs text-muted-foreground">
                    {rsvp.guests?.email ?? "—"} · {formatDateTime(rsvp.responded_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{rsvp.guests_count} pessoa(s)</Badge>
                  <Badge variant={rsvp.response === "attending" ? "default" : "outline"}>
                    {rsvp.response === "attending" ? "Vai comparecer" : "Não poderá ir"}
                  </Badge>
                </div>
              </div>
              {rsvp.dietary_restrictions ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  Restrições: {rsvp.dietary_restrictions}
                </p>
              ) : null}
              {rsvp.message ? (
                <p className="mt-2 border-l-2 border-border pl-3 text-sm italic text-muted-foreground">
                  “{rsvp.message}”
                </p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
