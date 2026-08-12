import { createFileRoute } from "@tanstack/react-router";
import { CreditCard, Wallet } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { EmptyState } from "@/components/EmptyState";
import { StatCard } from "@/components/StatCard";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCouple, useOrders } from "@/hooks/useWeddingData";
import { orderStats } from "@/services/gifts";
import { formatCurrency, formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dashboard/pagamentos")({
  head: () => ({
    meta: [
      { title: "Pagamentos | Meu Casamento" },
      { name: "description", content: "Acompanhe os presentes recebidos e os valores." },
      { property: "og:title", content: "Pagamentos | Meu Casamento" },
      { property: "og:description", content: "Acompanhe os presentes recebidos e os valores." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PaymentsPage,
});

const STATUS: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  paid: { label: "Pago", variant: "default" },
  pending: { label: "Pendente", variant: "secondary" },
  cancelled: { label: "Cancelado", variant: "outline" },
};

function PaymentsPage() {
  const { data: couple } = useCouple();
  const { data: orders = [], isLoading } = useOrders(couple?.id);
  const stats = orderStats(orders);

  return (
    <DashboardLayout title="Pagamentos" description="Pedidos de presentes e valores recebidos.">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={Wallet} label="Recebido" value={formatCurrency(stats.amountReceived)} tone="success" />
        <StatCard icon={CreditCard} label="Pedidos pagos" value={stats.paid} />
        <StatCard icon={CreditCard} label="Pendentes" value={stats.pending} tone="warning" />
      </div>

      <div className="surface-card mt-6 p-5">
        {isLoading ? (
          <Skeleton className="h-56 rounded-xl" />
        ) : orders.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title="Nenhum pedido ainda"
            description="Quando um convidado escolher um presente, o pedido aparece aqui."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Convidado</TableHead>
                  <TableHead className="hidden sm:table-cell">Presente</TableHead>
                  <TableHead className="hidden md:table-cell">Data</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => {
                  const status = STATUS[order.status] ?? { label: order.status, variant: "outline" as const };
                  return (
                    <TableRow key={order.id}>
                      <TableCell>
                        <span className="font-medium">{order.guest_name}</span>
                        <span className="block text-xs text-muted-foreground">{order.guest_email}</span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {order.gift_items?.name ?? "—"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {formatDateTime(order.created_at)}
                      </TableCell>
                      <TableCell className="font-medium">{formatCurrency(order.amount)}</TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
