import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ImagePlus, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SECTION_FIELDS, sectionSettings, type FieldDef } from "@/lib/sections";
import { updateSectionSettings } from "@/services/couples";
import { uploadPhoto } from "@/services/storage";
import { SECTION_LABELS, type SectionType, type WebsiteSection } from "@/types";

/**
 * Formulário com todos os campos editáveis de uma seção (título + campos específicos do tipo).
 * Usado tanto no painel "Seções" (dentro de um card recolhível) quanto no editor visual
 * (dentro de um painel lateral), então mantém apenas a lógica de edição — sem cabeçalho
 * próprio, arrastar/soltar ou recolher, que ficam por conta de quem o usa.
 */
export function SectionFieldsForm({
  section,
  coupleId,
  onSaved,
}: {
  section: WebsiteSection;
  coupleId: string;
  onSaved?: () => void;
}) {
  const queryClient = useQueryClient();
  const type = section.section_type as SectionType;
  const fields = SECTION_FIELDS[type] ?? [];

  const [title, setTitle] = useState(section.title ?? "");
  const [values, setValues] = useState<Record<string, unknown>>(() => sectionSettings(section));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTitle(section.title ?? "");
    setValues(sectionSettings(section));
  }, [section]);

  function setField(key: string, value: unknown) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function save() {
    setSaving(true);
    try {
      await updateSectionSettings(section.id, values, {
        title: title || null,
        visible: section.visible,
      });
      await queryClient.invalidateQueries({ queryKey: ["sections", coupleId] });
      toast.success("Seção salva.");
      onSaved?.();
    } catch {
      toast.error("Não foi possível salvar a seção.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`title-${section.id}`}>Título da seção</Label>
        <Input
          id={`title-${section.id}`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={SECTION_LABELS[type]}
        />
      </div>

      {fields.map((field) => (
        <FieldInput
          key={field.key}
          field={field}
          id={`${section.id}-${field.key}`}
          value={values[field.key]}
          coupleId={coupleId}
          onChange={(v) => setField(field.key, v)}
        />
      ))}

      <div className="flex justify-end">
        <Button size="sm" onClick={() => void save()} disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Salvar seção
        </Button>
      </div>
    </div>
  );
}

export function FieldInput({
  field,
  id,
  value,
  coupleId,
  onChange,
}: {
  field: FieldDef;
  id: string;
  value: unknown;
  coupleId: string;
  onChange: (value: unknown) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const text = typeof value === "string" ? value : "";

  if (field.type === "switch") {
    const checked = typeof value === "boolean" ? value : Boolean(field.fallback);
    return (
      <div className="flex items-center justify-between gap-4">
        <Label htmlFor={id}>{field.label}</Label>
        <Switch id={id} checked={checked} onCheckedChange={onChange} />
      </div>
    );
  }

  if (field.type === "select") {
    const current = text || (typeof field.fallback === "string" ? field.fallback : "");
    return (
      <div className="space-y-2">
        <Label htmlFor={id}>{field.label}</Label>
        <Select value={current} onValueChange={onChange}>
          <SelectTrigger id={id}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(field.options ?? []).map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (field.type === "textarea") {
    return (
      <div className="space-y-2">
        <Label htmlFor={id}>{field.label}</Label>
        <Textarea
          id={id}
          rows={5}
          value={text}
          placeholder={field.placeholder ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    );
  }

  if (field.type === "image") {
    async function handleFile(file: File) {
      setUploading(true);
      try {
        const photo = await uploadPhoto(coupleId, file, "gallery");
        onChange(photo.public_url);
        toast.success("Imagem enviada.");
      } catch {
        toast.error("Não foi possível enviar a imagem.");
      } finally {
        setUploading(false);
      }
    }

    return (
      <div className="space-y-2">
        <Label htmlFor={id}>{field.label}</Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id={id}
            value={text}
            placeholder="https://..."
            onChange={(e) => onChange(e.target.value)}
          />
          <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-accent">
            {uploading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ImagePlus className="size-4" />
            )}
            Enviar
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleFile(f);
                e.target.value = "";
              }}
            />
          </label>
        </div>
        {text ? (
          <img
            src={text}
            alt=""
            className="h-28 w-full rounded-md object-cover sm:w-56"
            loading="lazy"
          />
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{field.label}</Label>
      <Input
        id={id}
        value={text}
        placeholder={field.placeholder ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
