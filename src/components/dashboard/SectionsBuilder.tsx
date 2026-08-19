import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, GripVertical, ImagePlus, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { SECTION_FIELDS, sectionSettings, type FieldDef } from "@/lib/sections";
import { reorderSections, updateSectionSettings } from "@/services/couples";
import { uploadPhoto } from "@/services/storage";
import { SECTION_LABELS, type SectionType, type WebsiteSection } from "@/types";
import { cn } from "@/lib/utils";

export function SectionsBuilder({
  coupleId,
  sections,
}: {
  coupleId: string;
  sections: WebsiteSection[];
}) {
  const queryClient = useQueryClient();
  const [items, setItems] = useState(sections);

  useEffect(() => setItems(sections), [sections]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((s) => s.id === active.id);
    const newIndex = items.findIndex((s) => s.id === over.id);
    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);
    try {
      await reorderSections(next.map((s, i) => ({ id: s.id, position: i })));
      await queryClient.invalidateQueries({ queryKey: ["sections", coupleId] });
      toast.success("Ordem das seções atualizada.");
    } catch {
      toast.error("Não foi possível reordenar as seções.");
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={items.map((s) => s.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {items.map((section) => (
            <SortableSection key={section.id} section={section} coupleId={coupleId} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableSection({ section, coupleId }: { section: WebsiteSection; coupleId: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("surface-card", isDragging && "opacity-70 ring-2 ring-primary/30")}
    >
      <SectionCard
        section={section}
        coupleId={coupleId}
        handle={
          <button
            type="button"
            className="cursor-grab touch-none rounded p-1 text-muted-foreground hover:text-foreground"
            aria-label="Arrastar para reordenar"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-4" />
          </button>
        }
      />
    </div>
  );
}

function SectionCard({
  section,
  coupleId,
  handle,
}: {
  section: WebsiteSection;
  coupleId: string;
  handle: React.ReactNode;
}) {
  const queryClient = useQueryClient();
  const type = section.section_type as SectionType;
  const fields = SECTION_FIELDS[type] ?? [];

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(section.title ?? "");
  const [visible, setVisible] = useState(section.visible);
  const [values, setValues] = useState<Record<string, unknown>>(() => sectionSettings(section));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTitle(section.title ?? "");
    setVisible(section.visible);
    setValues(sectionSettings(section));
  }, [section]);

  async function save(next?: { visible?: boolean }) {
    setSaving(true);
    try {
      await updateSectionSettings(section.id, values, {
        title: title || null,
        visible: next?.visible ?? visible,
      });
      await queryClient.invalidateQueries({ queryKey: ["sections", coupleId] });
      toast.success("Seção salva.");
    } catch {
      toast.error("Não foi possível salvar a seção.");
    } finally {
      setSaving(false);
    }
  }

  function setField(key: string, value: unknown) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  return (
    <div className="p-4 sm:p-5">
      <div className="flex items-center gap-3">
        {handle}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
          aria-expanded={open}
        >
          <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
          <span className="truncate font-medium">{SECTION_LABELS[type] ?? type}</span>
          {!visible ? (
            <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              oculta
            </span>
          ) : null}
        </button>
        <Switch
          checked={visible}
          onCheckedChange={(v) => {
            setVisible(v);
            void save({ visible: v });
          }}
          aria-label={`Mostrar seção ${SECTION_LABELS[type] ?? type}`}
        />
      </div>

      {open ? (
        <div className="mt-4 space-y-4 border-t border-border pt-4">
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
            <Button size="sm" onClick={() => save()} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Salvar seção
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FieldInput({
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
