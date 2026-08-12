import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, Loader2, Plus, Trash2, Users } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { EmptyState } from "@/components/EmptyState";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCouple, useGuests } from "@/hooks/useWeddingData";
import { createGuest, deleteGuest, guestStats, updateGuest } from "@/services/guests";
import type { Guest } from "@/types";

export const Route = createFileRoute("/_authenticated/dashboard/convidados")({
  head: () => ({
    meta: [
      { title: "Convidados | Meu Casamento" },
      { name: "description", content: "Gerencie a lista de convidados do seu casamento." },
      { property: "og:title", content: "Convidados | Meu Casamento" },
      { property: "og:description", content: "Gerencie a lista de convidados do seu casamento." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: GuestsPage,
});

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  declined: "Não vai",
};

function GuestsPage() {
  const queryClient = useQueryClient();
  const { data: couple } = useCouple();
  const { data: guests = [], isLoading } = useGuests(couple?.id);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", group_name: "" });

  const stats = guestStats(guests);

  const filtered = useMemo(
    () =>
      guests.filter((g) => {
        const matchesSearch = g.name.toLowerCase().includes(search.toLowerCase());
        const matchesFilter = filter === "all" || g.status === filter;
        return matchesSearch && matchesFilter;
      }),
    [guests, search, filter],
  );

  async function addGuest() {
    if (!couple || !form.name.trim()) {
      toast.error("Informe o nome do convidado.");
      return;
    }
    setSaving(true);
    try {
      await createGuest(couple.id, {
        name: form.name.trim(),
        email: form.email || null,
        phone: form.phone || null,
        group_name: form.group_name || null,
      });
      await queryClient.invalidateQueries({ queryKey: ["guests", couple.id] });
      setForm({ name: "", email: "", phone: "", group_name: "" });
      setOpen(false);
      toast.success("Convidado adicionado.");
    } catch {
      toast.error("Não foi possível adicionar o convidado.");
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(guest: Guest, status: string) {
    await updateGuest(guest.id, { status: status as Guest["status"] });
    await queryClient.invalidateQueries({ queryKey: ["guests", couple?.id] });
  }

  function exportCsv() {
    const rows = [
      ["Nome", "E-mail", "Telefone", "Grupo", "Status"],
      ...guests.map((g) => [g.name, g.email ?? "", g.phone ?? "", g.group_name ?? "", STATUS_LABEL[g.status] ?? g.status]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "convidados.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <DashboardLayout
      title="Convidados"
      description="Cadastre, acompanhe confirmações e exporte a lista."
      actions={
        <>
          <Button variant="outline" onClick={exportCsv} disabled={guests.length === 0}>
            <Download className="size-4" /> Exportar CSV
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button disabled={!couple}>
                <Plus className="size-4" /> Novo convidado
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo convidado</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {(
                  [
                    ["name", "Nome"],
                    ["email", "E-mail"],
                    ["phone", "Telefone"],
                    ["group_name", "Grupo (ex.: família da noiva)"],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={key}>{label}</Label>
                    <Input
                      id={key}
                      value={form[key]}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
              <DialogFooter>
                <Button onClick={addGuest} disabled={saving}>
                  {saving ? <Loader2 className="size-4 animate-spin" /> : null}
                  Adicionar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Total" value={stats.total} />
        <StatCard icon={Users} label="Confirmados" value={stats.confirmed} tone="success" />
        <StatCard icon={Users} label="Pendentes" value={stats.pending} tone="warning" />
        <StatCard icon={Users} label="Não vão" value={stats.declined} tone="destructive" />
      </div>

      <div className="surface-card mt-6 p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <Input
            placeholder="Buscar convidado..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:max-w-xs"
          />
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="confirmed">Confirmados</SelectItem>
              <SelectItem value="declined">Não vão</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <Skeleton className="h-56 rounded-xl" />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Nenhum convidado ainda"
            description="Adicione seus convidados para acompanhar as confirmações de presença."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden sm:table-cell">Contato</TableHead>
                  <TableHead className="hidden md:table-cell">Grupo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((guest) => (
                  <TableRow key={guest.id}>
                    <TableCell className="font-medium">{guest.name}</TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      {guest.email ?? guest.phone ?? "—"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {guest.group_name ? <Badge variant="secondary">{guest.group_name}</Badge> : "—"}
                    </TableCell>
                    <TableCell>
                      <Select value={guest.status} onValueChange={(v) => changeStatus(guest, v)}>
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pendente</SelectItem>
                          <SelectItem value="confirmed">Confirmado</SelectItem>
                          <SelectItem value="declined">Não vai</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Remover ${guest.name}`}
                        onClick={async () => {
                          await deleteGuest(guest.id);
                          await queryClient.invalidateQueries({ queryKey: ["guests", couple?.id] });
                        }}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
