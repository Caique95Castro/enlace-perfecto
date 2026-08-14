import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, EyeOff, MessageSquareHeart, Trash2 } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCouple } from "@/hooks/useWeddingData";
import { useMessages } from "@/hooks/usePlatform";
import { deleteMessage, setMessageStatus } from "@/services/messages";
import type { MessageStatus } from "@/types";

export const Route = createFileRoute("/_authenticated/dashboard/mensagens")({
  head: () => ({
    meta: [
      { title: "Mural de mensagens | Meu Casamento" },
      { name: "description", content: "Aprove, oculte ou exclua os recados dos convidados." },
      { property: "og:title", content: "Mural de mensagens | Meu Casamento" },
      { property: "og:description", content: "Modere os recados deixados pelos convidados." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MessagesPage,
});

const STATUS_LABEL: Record<MessageStatus, string> = {
  pending: "Aguardando",
  approved: "Publicada",
  hidden: "Oculta",
};

function MessagesPage() {
  const { data: couple } = useCouple();
  const { data: messages = [], isLoading } = useMessages(couple?.id);
  const qc = useQueryClient();

  async function update(id: string, status: MessageStatus) {
    try {
      await setMessageStatus(id, status);
      await qc.invalidateQueries({ queryKey: ["messages", couple?.id] });
      toast.success("Mensagem atualizada.");
    } catch {
      toast.error("Não foi possível atualizar a mensagem.");
    }
  }

  async function remove(id: string) {
    try {
      await deleteMessage(id);
      await qc.invalidateQueries({ queryKey: ["messages", couple?.id] });
      toast.success("Mensagem excluída.");
    } catch {
      toast.error("Não foi possível excluir a mensagem.");
    }
  }

  return (
    <DashboardLayout
      title="Mural de mensagens"
      description="Nada é publicado sem sua aprovação."
    >
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : messages.length === 0 ? (
        <EmptyState
          icon={MessageSquareHeart}
          title="Nenhuma mensagem ainda"
          description="Quando os convidados deixarem recados no seu site, eles aparecem aqui para aprovação."
        />
      ) : (
        <ul className="space-y-3">
          {messages.map((m) => (
            <li key={m.id} className="surface-card flex flex-col gap-4 p-5 sm:flex-row sm:items-start">
              {m.photo_url ? (
                <img
                  src={m.photo_url}
                  alt={`Foto enviada por ${m.author_name}`}
                  loading="lazy"
                  className="size-16 shrink-0 rounded-lg object-cover"
                />
              ) : null}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{m.author_name}</p>
                  <Badge variant={m.status === "approved" ? "default" : "secondary"}>
                    {STATUS_LABEL[m.status as MessageStatus] ?? m.status}
                  </Badge>
                </div>
                <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{m.message}</p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                {m.status !== "approved" ? (
                  <Button size="sm" onClick={() => update(m.id, "approved")}>
                    <Check className="size-4" /> Aprovar
                  </Button>
                ) : null}
                {m.status !== "hidden" ? (
                  <Button size="sm" variant="outline" onClick={() => update(m.id, "hidden")}>
                    <EyeOff className="size-4" /> Ocultar
                  </Button>
                ) : null}
                <Button size="sm" variant="ghost" onClick={() => remove(m.id)} aria-label="Excluir">
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </DashboardLayout>
  );
}
