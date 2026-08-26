-- Biblioteca de Layouts (estilos visuais decorativos): adiciona uma única coluna nova,
-- compatível com tudo que já existe. Sites sem essa configuração continuam exatamente
-- como estão hoje (default 'nenhum' = nenhum elemento decorativo, visual atual preservado).
alter table public.website_settings
  add column if not exists visual_style text not null default 'nenhum';
