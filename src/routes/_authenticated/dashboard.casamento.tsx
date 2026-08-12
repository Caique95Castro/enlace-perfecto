import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useCouple, useWedding } from "@/hooks/useWeddingData";
import { updateCouple, upsertWedding } from "@/services/couples";

export const Route = createFileRoute("/_authenticated/dashboard/casamento")({
  head: () => ({
    meta: [
      { title: "Meu casamento | Meu Casamento" },
      { name: "description", content: "Edite data, local e informações da cerimônia." },
      { property: "og:title", content: "Meu casamento | Meu Casamento" },
      { property: "og:description", content: "Edite data, local e informações da cerimônia." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WeddingPage,
});

function WeddingPage() {
  const queryClient = useQueryClient();
  const { data: couple, isLoading } = useCouple();
  const { data: wedding } = useWedding(couple?.id);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    partner_1_name: "",
    partner_2_name: "",
    wedding_date: "",
    ceremony_time: "",
    venue_name: "",
    venue_address: "",
    city: "",
    state: "",
    dress_code: "",
    description: "",
  });

  useEffect(() => {
    if (!couple) return;
    setForm({
      partner_1_name: couple.partner_1_name,
      partner_2_name: couple.partner_2_name,
      wedding_date: wedding?.wedding_date ?? "",
      ceremony_time: wedding?.ceremony_time?.slice(0, 5) ?? "",
      venue_name: wedding?.venue_name ?? "",
      venue_address: wedding?.venue_address ?? "",
      city: wedding?.city ?? "",
      state: wedding?.state ?? "",
      dress_code: wedding?.dress_code ?? "",
      description: wedding?.description ?? "",
    });
  }, [couple, wedding]);

  async function save() {
    if (!couple) return;
    setSaving(true);
    try {
      await Promise.all([
        updateCouple(couple.id, {
          partner_1_name: form.partner_1_name,
          partner_2_name: form.partner_2_name,
          display_name: `${form.partner_1_name} & ${form.partner_2_name}`,
        }),
        upsertWedding(couple.id, {
          wedding_date: form.wedding_date || null,
          ceremony_time: form.ceremony_time || null,
          venue_name: form.venue_name || null,
          venue_address: form.venue_address || null,
          city: form.city || null,
          state: form.state || null,
          dress_code: form.dress_code || null,
          description: form.description || null,
        }),
      ]);
      await queryClient.invalidateQueries();
      toast.success("Informações salvas.");
    } catch {
      toast.error("Não foi possível salvar as informações.");
    } finally {
      setSaving(false);
    }
  }

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <DashboardLayout
      title="Meu casamento"
      description="Informações que aparecem no site e nos convites."
      actions={
        <Button onClick={save} disabled={saving || !couple}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Salvar
        </Button>
      }
    >
      {isLoading ? (
        <Skeleton className="h-96 rounded-xl" />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          <section className="surface-card space-y-4 p-6">
            <h2 className="font-display text-xl font-semibold">Os noivos</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome 1" value={form.partner_1_name} onChange={set("partner_1_name")} />
              <Field label="Nome 2" value={form.partner_2_name} onChange={set("partner_2_name")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Nossa história</Label>
              <Textarea
                id="description"
                rows={6}
                value={form.description}
                onChange={(e) => set("description")(e.target.value)}
              />
            </div>
          </section>

          <section className="surface-card space-y-4 p-6">
            <h2 className="font-display text-xl font-semibold">Cerimônia</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Data" type="date" value={form.wedding_date} onChange={set("wedding_date")} />
              <Field label="Cerimônia" type="time" value={form.ceremony_time} onChange={set("ceremony_time")} />
            </div>
            <Field label="Local" value={form.venue_name} onChange={set("venue_name")} />
            <Field label="Endereço" value={form.venue_address} onChange={set("venue_address")} />
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <Field label="Cidade" value={form.city} onChange={set("city")} />
              </div>
              <Field label="UF" value={form.state} onChange={(v) => set("state")(v.toUpperCase())} />
            </div>
            <Field
              label="Dress code"
              value={form.dress_code}
              onChange={set("dress_code")}
              placeholder="Ex.: Traje social completo"
            />
          </section>
        </div>
      )}
    </DashboardLayout>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
