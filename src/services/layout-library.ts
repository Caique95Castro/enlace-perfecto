import { updateSectionSettings, upsertSettings } from "@/services/couples";
import { sectionSettings } from "@/lib/sections";
import {
  mergePreset,
  presetPatchFor,
  restoredSettings,
  type LayoutPreset,
  type SectionPreset,
} from "@/lib/layout-presets";
import type { SectionType, WebsiteSection, WebsiteSettings } from "@/types";

/**
 * Camada de serviço da Biblioteca de Layouts. Escreve apenas chaves visuais no
 * `settings` (jsonb) das seções já existentes e nas cores/fontes de website_settings —
 * nunca cria, remove ou reordena seções, e nunca toca em textos, fotos ou dados do casamento.
 */

type StyleFields = Pick<
  WebsiteSettings,
  | "primary_color"
  | "secondary_color"
  | "background_color"
  | "heading_font"
  | "body_font"
  | "template_slug"
>;

/** Aplica um modelo global a todas as seções do casal + cores/fontes do site. */
export async function applyGlobalPreset(
  coupleId: string,
  sections: WebsiteSection[],
  preset: LayoutPreset,
  currentSettings: Partial<StyleFields> | null | undefined,
): Promise<void> {
  const header = sections.find((s) => s.section_type === "header");

  await Promise.all(
    sections.map((section) => {
      const patch = presetPatchFor(preset, section.section_type as SectionType);
      const next = mergePreset(section, patch);
      // O backup do estilo global (cores/fontes) fica junto do cabeçalho, uma única vez.
      if (header && section.id === header.id) {
        const current = sectionSettings(section);
        if (!current["_style_backup"] && currentSettings) {
          next["_style_backup"] = {
            primary_color: currentSettings.primary_color,
            secondary_color: currentSettings.secondary_color,
            background_color: currentSettings.background_color,
            heading_font: currentSettings.heading_font,
            body_font: currentSettings.body_font,
          };
        }
      }
      return updateSectionSettings(section.id, next);
    }),
  );

  await upsertSettings(coupleId, { ...preset.style });
}

/** Aplica um modelo a uma única seção, sem afetar as demais. */
export async function applySectionPreset(
  section: WebsiteSection,
  preset: SectionPreset,
): Promise<void> {
  await updateSectionSettings(
    section.id,
    mergePreset(section, { ...preset.patch, _skin: preset.skin, _preset: preset.id }),
  );
}

/**
 * Remove somente o visual adicionado pelos modelos, devolvendo cada seção ao estado
 * anterior à primeira aplicação. Conteúdo, fotos e configurações do casamento ficam intactos.
 */
export async function restoreOriginalLayout(
  coupleId: string,
  sections: WebsiteSection[],
): Promise<void> {
  const header = sections.find((s) => s.section_type === "header");
  const backup = header ? sectionSettings(header)["_style_backup"] : null;

  await Promise.all(
    sections.map((section) => {
      const next = restoredSettings(section);
      delete next["_style_backup"];
      return updateSectionSettings(section.id, next);
    }),
  );

  if (backup && typeof backup === "object" && !Array.isArray(backup)) {
    const style = backup as Record<string, unknown>;
    const values: Record<string, unknown> = {};
    for (const key of [
      "primary_color",
      "secondary_color",
      "background_color",
      "heading_font",
      "body_font",
    ]) {
      if (typeof style[key] === "string" && style[key]) values[key] = style[key];
    }
    if (Object.keys(values).length > 0) await upsertSettings(coupleId, values as never);
  }
}
