import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Gift, LibraryBig, Loader2, Plus, Trash2 } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { useCouple, useGifts } from "@/hooks/useWeddingData";
import { createGift, deleteGift, updateGift } from "@/services/gifts";
import { formatCurrency } from "@/lib/format";
import { CATALOG_CATEGORIES, GIFT_CATALOG, type CatalogGift } from "@/lib/gift-catalog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard/presentes")({
  head: () => ({
    meta: [
      { title: "Lista de presentes | Meu Casamento" },
      { name: "description", content: "Monte sua lista de presentes e cotas de lua de mel." },
      { property: "og:title", content: "Lista de presentes | Meu Casamento" },
      { property: "og:description", content: "Monte sua lista de presentes e cotas de lua de mel." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: GiftsPage,
});

function GiftsPage() {
  const queryClient = useQueryClient();
  const { data: couple } = useCouple();
  const { data: gifts = [], isLoading } = useGifts(couple?.id);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    type: "physical" as "physical" | "quota",
    quantity: "1",
    image_url: "",
  });

  async function addGift() {
    if (!couple || !form.name.trim() || !Number(form.price)) {
      toast.error("Informe nome e valor do presente.");
      return;
    }
    setSaving(true);
    try {
      await createGift(couple.id, {
        name: form.name.trim(),
        description: form.description || null,
        image_url: form.image_url || null,
        price: Number(form.price),
        type: form.type,
        quantity: Math.max(1, Number(form.quantity) || 1),
      });
      await queryClient.invalidateQueries({ queryKey: ["gifts", couple.id] });
      setForm({ name: "", description: "", price: "", type: "physical", quantity: "1", image_url: "" });
      setOpen(false);
      toast.success("Presente adicionado.");
    } catch {
      toast.error("Não foi possível adicionar o presente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardLayout
      title="Lista de presentes"
      description="Produtos e cotas que seus convidados podem presentear."
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button disabled={!couple}>
              <Plus className="size-4" /> Novo presente
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo presente</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gift-name">Nome</Label>
                <Input
                  id="gift-name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gift-desc">Descrição</Label>
                <Textarea
                  id="gift-desc"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="gift-price">Valor (R$)</Label>
                  <Input
                    id="gift-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gift-qty">Quantidade</Label>
                  <Input
                    id="gift-qty"
                    type="number"
                    min="1"
                    value={form.quantity}
                    onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={form.type}
                    onValueChange={(v) => setForm((f) => ({ ...f, type: v as "physical" | "quota" }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="physical">Produto</SelectItem>
                      <SelectItem value="quota">Cota</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="gift-img">URL da imagem (opcional)</Label>
                <Input
                  id="gift-img"
                  value={form.image_url}
                  onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={addGift} disabled={saving}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : null}
                Adicionar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      {isLoading ? (
        <Skeleton className="h-56 rounded-xl" />
      ) : gifts.length === 0 ? (
        <EmptyState
          icon={Gift}
          title="Sua lista está vazia"
          description="Adicione produtos ou cotas de lua de mel para seus convidados presentearem."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {gifts.map((gift) => (
            <article key={gift.id} className="surface-card overflow-hidden">
              {gift.image_url ? (
                <img
                  src={gift.image_url}
                  alt={gift.name}
                  loading="lazy"
                  className="aspect-[4/3] w-full object-cover"
                />
              ) : (
                <div className="flex aspect-[4/3] items-center justify-center bg-secondary">
                  <Gift className="size-8 text-primary" />
                </div>
              )}
              <div className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display text-lg font-semibold">{gift.name}</h3>
                  <Badge variant="secondary">{gift.type === "quota" ? "Cota" : "Produto"}</Badge>
                </div>
                {gift.description ? (
                  <p className="line-clamp-2 text-sm text-muted-foreground">{gift.description}</p>
                ) : null}
                <p className="font-display text-xl font-semibold">{formatCurrency(gift.price)}</p>
                <p className="text-xs text-muted-foreground">
                  {gift.available_quantity} de {gift.quantity} disponíveis
                </p>
                <div className="flex items-center justify-between border-t border-border pt-3">
                  <label className="flex items-center gap-2 text-sm">
                    <Switch
                      checked={gift.active}
                      onCheckedChange={async (v) => {
                        await updateGift(gift.id, { active: v });
                        await queryClient.invalidateQueries({ queryKey: ["gifts", couple?.id] });
                      }}
                      aria-label="Ativo no site"
                    />
                    Ativo
                  </label>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Remover ${gift.name}`}
                    onClick={async () => {
                      await deleteGift(gift.id);
                      await queryClient.invalidateQueries({ queryKey: ["gifts", couple?.id] });
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
