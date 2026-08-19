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
import { ChevronDown, GripVertical } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { SectionFieldsForm } from "@/components/dashboard/SectionFieldsForm";
import { reorderSections, updateSection } from "@/services/couples";
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

  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(section.visible);

  useEffect(() => {
    setVisible(section.visible);
  }, [section]);

  async function toggleVisible(v: boolean) {
    setVisible(v);
    try {
      await updateSection(section.id, { visible: v });
      await queryClient.invalidateQueries({ queryKey: ["sections", coupleId] });
    } catch {
      toast.error("Não foi possível salvar a seção.");
      setVisible(!v);
    }
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
          onCheckedChange={(v) => void toggleVisible(v)}
          aria-label={`Mostrar seção ${SECTION_LABELS[type] ?? type}`}
        />
      </div>

      {open ? (
        <div className="mt-4 border-t border-border pt-4">
          <SectionFieldsForm section={section} coupleId={coupleId} />
        </div>
      ) : null}
    </div>
  );
}
