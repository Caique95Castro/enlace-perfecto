import { useState, type ReactNode } from "react";
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
import { Eye, EyeOff, GripVertical, Pencil, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  WeddingSiteView,
  type SiteBlockType,
  type WeddingSiteData,
} from "@/components/site/WeddingSiteView";
import { SectionFieldsForm } from "@/components/dashboard/SectionFieldsForm";
import { reorderSections, updateSection } from "@/services/couples";
import { SECTION_LABELS, SECTION_ORDER, type SectionType, type WebsiteSection } from "@/types";
import { cn } from "@/lib/utils";

/**
 * Editor visual estilo "o que você vê é o que você tem": mostra o site real (mesmo
 * componente do site público) e permite reordenar seções arrastando-as diretamente
 * no preview, além de editar/ocultar cada uma por um painel lateral, sem precisar
 * navegar por um formulário separado. `header` e `footer` ficam fixos (topo/rodapé,
 * como em qualquer site) e as demais seções visíveis podem ser arrastadas livremente.
 */
export function VisualSiteEditor({ coupleId, data }: { coupleId: string; data: WeddingSiteData }) {
  const queryClient = useQueryClient();
  const [order, setOrder] = useState(() => draggableSections(data.sections));
  const [editing, setEditing] = useState<WebsiteSection | null>(null);

  const currentOrder = draggableSections(data.sections);
  const orderKey = currentOrder.map((s) => s.id).join(",");
  const [lastKey, setLastKey] = useState(orderKey);
  if (orderKey !== lastKey) {
    setLastKey(orderKey);
    setOrder(currentOrder);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = order.findIndex((s) => s.id === active.id);
    const newIndex = order.findIndex((s) => s.id === over.id);
    const next = arrayMove(order, oldIndex, newIndex);
    setOrder(next);
    try {
      // Seções fixas (header/footer) não entram no array reordenável, então
      // recalculamos a posição de todas para manter a ordem consistente no banco.
      const fixed = data.sections.filter((s) => !isDraggableType(s.section_type as SectionType));
      const all = [...fixed, ...next];
      await reorderSections(all.map((s, i) => ({ id: s.id, position: i })));
      await queryClient.invalidateQueries({ queryKey: ["sections", coupleId] });
    } catch {
      toast.error("Não foi possível reordenar. Tente novamente.");
      setOrder(currentOrder);
    }
  }

  async function toggleVisible(section: WebsiteSection) {
    try {
      await updateSection(section.id, { visible: !section.visible });
      await queryClient.invalidateQueries({ queryKey: ["sections", coupleId] });
    } catch {
      toast.error("Não foi possível salvar.");
    }
  }

  const byId = new Map(order.map((s) => [s.id, s]));

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-muted/20">
      <div className="flex items-center gap-2 border-b border-border bg-background px-4 py-2.5 text-sm text-muted-foreground">
        <Settings2 className="size-4" />
        Passe o mouse sobre uma seção para editar, ocultar ou arrastar para reordenar.
      </div>

      <div className="max-h-[75vh] overflow-y-auto">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={order.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <WeddingSiteView
              data={data}
              interactive={false}
              renderBlock={(type, section, node) => {
                if (!section) return node;
                const current = byId.get(section.id) ?? section;
                return (
                  <SortableBlock
                    key={section.id}
                    section={current}
                    onEdit={() => setEditing(current)}
                    onToggleVisible={() => void toggleVisible(current)}
                  >
                    {node}
                  </SortableBlock>
                );
              }}
            />
          </SortableContext>
        </DndContext>
      </div>

      <Sheet open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          {editing ? (
            <>
              <SheetHeader>
                <SheetTitle>
                  Editar seção —{" "}
                  {SECTION_LABELS[editing.section_type as SectionType] ?? editing.section_type}
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <SectionFieldsForm
                  section={editing}
                  coupleId={coupleId}
                  onSaved={() => setEditing(null)}
                />
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}

/** Header e footer ficam fixos no layout — as demais seções visíveis podem ser arrastadas. */
function isDraggableType(type: SectionType): type is SiteBlockType {
  return (
    type !== "header" &&
    type !== "footer" &&
    type !== "wedding_party" &&
    type !== "dress_code" &&
    type !== "location" &&
    type !== "info"
  );
}

function draggableSections(sections: WebsiteSection[]): WebsiteSection[] {
  return SECTION_ORDER.filter(isDraggableType)
    .map((type) => sections.find((s) => s.section_type === type))
    .filter((s): s is WebsiteSection => Boolean(s));
}

function SortableBlock({
  section,
  onEdit,
  onToggleVisible,
  children,
}: {
  section: WebsiteSection;
  onEdit: () => void;
  onToggleVisible: () => void;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("group relative", isDragging && "z-10 opacity-80 ring-2 ring-primary/40")}
    >
      <BlockOverlay
        section={section}
        onEdit={onEdit}
        onToggleVisible={onToggleVisible}
        dragHandle={
          <button
            type="button"
            className="pointer-events-auto flex size-8 cursor-grab touch-none items-center justify-center rounded-md bg-background/95 text-foreground shadow-sm hover:bg-background"
            aria-label="Arrastar para reordenar"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-4" />
          </button>
        }
      />
      {children}
    </div>
  );
}

function BlockOverlay({
  section,
  onEdit,
  onToggleVisible,
  dragHandle,
}: {
  section: WebsiteSection;
  onEdit: () => void;
  onToggleVisible: () => void;
  dragHandle?: ReactNode;
}) {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 opacity-0 transition-opacity group-hover:opacity-100">
      <div className="absolute inset-0 rounded-md ring-2 ring-inset ring-primary/50" />
      <div className="pointer-events-auto absolute right-3 top-3 flex items-center gap-1.5">
        {dragHandle}
        <button
          type="button"
          onClick={onToggleVisible}
          className="flex size-8 items-center justify-center rounded-md bg-background/95 text-foreground shadow-sm hover:bg-background"
          aria-label={section.visible ? "Ocultar seção" : "Mostrar seção"}
        >
          {section.visible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
        </button>
        <Button size="sm" onClick={onEdit} className="shadow-sm">
          <Pencil className="size-3.5" />
          Editar
        </Button>
      </div>
      <div className="pointer-events-none absolute left-3 top-3 rounded-md bg-background/95 px-2 py-1 text-xs font-medium text-foreground shadow-sm">
        {SECTION_LABELS[section.section_type as SectionType] ?? section.section_type}
      </div>
    </div>
  );
}

export function VisualSiteEditorSkeleton() {
  return <Skeleton className="h-[75vh] rounded-xl" />;
}
