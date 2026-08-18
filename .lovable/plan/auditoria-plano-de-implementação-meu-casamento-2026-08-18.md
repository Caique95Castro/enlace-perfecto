# Auditoria + Plano de Implementação — Meu Casamento

## 1. O que já existe e funciona

**Backend (Lovable Cloud / Postgres)**
- 17 tabelas com RLS ativa em todas: `couples`, `weddings`, `website_settings`, `website_sections`, `photos`, `guests`, `rsvps`, `gift_items`, `gift_orders`, `payments`, `guest_messages`, `notifications`, `site_events`, `subscriptions`, `feature_flags`, `profiles`, `user_roles`.
- Isolamento multi-tenant por `owns_couple(couple_id)`; leitura pública apenas quando `couple_is_published()` é verdadeiro.
- Papéis em tabela separada (`user_roles` + enum `user/admin/root`), com `has_role()` e `is_staff()` security-definer. `caiqueocastro@gmail.com` vira root automaticamente no cadastro.
- Funções seguras para visitantes: `submit_rsvp`, `submit_guest_message`, `create_gift_order`, `track_site_event`.
- Triggers de notificação para RSVP, presente e mensagem; `updated_at` em todas as tabelas.

**Frontend**
- Landing, login/cadastro (e-mail + Google), recuperação de senha.
- Onboarding guiado, painel com visão geral, casamento, site (aparência/seções/fotos), convidados, RSVP, presentes, pagamentos, mensagens, configurações.
- Site público em `/{slug}` renderizado por SSR, com RSVP, lista de presentes, mural de recados e rastreio de visitas.
- Área `/admin` com métricas da plataforma e feature flags.

## 2. Problemas encontrados

**P0 — bloqueiam o casamento real**
1. **Mercado Pago não está integrado de fato.** `payments.functions.ts` retorna sempre `pending_integration`; `payments.server.ts` é um stub. O convidado escolhe presentear mas não paga.
2. **Webhook sem idempotência.** `mercadopago-webhook.ts` valida assinatura, mas um webhook repetido reprocessa o pedido e não há trava de concorrência nem baixa de estoque (`available_quantity` nunca é decrementado ao aprovar).
3. **Resend não existe no projeto.** Nenhum e-mail transacional é enviado (nem ao convidado, nem aos noivos).
4. **Estados de pagamento incompletos.** Só existem `pending`/`approved`/`paid`; faltam `rejected`, `cancelled`, `expired` e a máquina de transição.
5. **Sem auditoria** de ações críticas (pagamentos, alterações de convidados/presentes, ações administrativas).

**P1 — necessários para o MVP**
6. Faltam entidades do produto: **eventos múltiplos** (só há cerimônia/recepção em campos fixos), **padrinhos**, **informações importantes**, **timeline da história**.
7. **Acompanhantes**: existe `plus_one_allowed`/`plus_one_name`, mas o RSVP público não pergunta acompanhante de forma guiada nem respeita o limite definido pelo casal.
8. **Editor de seções sem reordenação** (o `@dnd-kit` foi instalado mas não usado) e sem campos próprios por seção — `src/lib/sections.ts` existe e não está ligado à interface.
9. **Sem pré-visualização** do site nem botão de compartilhar/QR Code.
10. **Sem página de estatísticas** (os dados de `site_events` são gravados mas nunca lidos) e **sem página de domínio**.
11. **Admin incompleto**: não lista pagamentos, assinaturas, presentes ou convidados; não bloqueia/desbloqueia usuário; contagem de usuários é estimada por donos de casais.
12. **Mapa/rota ausente** na seção de localização.
13. **Convidados sem grupos/famílias** na interface e sem importação/edição completa.

**P2 — melhorias**
14. Imagens sem otimização (upload direto, sem redimensionar; bucket privado com URLs assinadas).
15. Só 3 templates, com diferença visual pequena.
16. Erros técnicos ainda vazam em alguns `toast`.

## 3. Plano priorizado

### P0 — Confiabilidade de pagamento e comunicação
- Implementar de verdade a preferência de checkout do Mercado Pago (PIX + cartão), com credencial guardada apenas no backend.
- Tabela `payment_events` para idempotência do webhook (chave única por `gateway_payment_id` + evento) e processamento em transação, decrementando `available_quantity` só na aprovação.
- Padronizar status: `pending | approved | rejected | cancelled | expired`, com transições válidas e nunca aprovação pelo retorno do navegador.
- Integrar Resend: confirmação ao convidado, aviso aos noivos, confirmação de RSVP.
- Tabela `audit_logs` + registro das ações críticas.

### P1 — MVP completo
- Novas tabelas: `events` (múltiplos eventos), `wedding_party` (padrinhos), `info_items` (informações importantes), `story_moments` (timeline) — todas com GRANT + RLS por casal e leitura pública quando publicado.
- Editor de seções com arrastar-e-soltar, ativar/desativar e campos próprios por seção (usando `src/lib/sections.ts`).
- Pré-visualização celular/desktop, botão "Visualizar site", compartilhar + QR Code.
- RSVP guiado com acompanhantes respeitando o limite por convidado; grupos/famílias no painel.
- Páginas novas: Estatísticas (visitas, cliques, conversão), Domínio (endereço atual, domínio próprio, instruções).
- Admin: listas de usuários, casamentos, pagamentos, assinaturas, presentes; bloquear/desbloquear; métricas reais.
- Localização com mapa e botão "Como chegar".

### P2 — Polimento
- Otimização de imagens no upload, carregamento preguiçoso na galeria.
- Dois templates adicionais e diferenciação visual real entre eles.
- Revisão de mensagens de erro (nada técnico para o usuário) e revisão mobile completa.

## 4. Ordem de execução sugerida
1. Pagamentos reais + webhook idempotente + status padronizados.
2. E-mails (Resend) + auditoria.
3. Conteúdo do site (eventos, padrinhos, informações, história) + editor com reordenação.
4. RSVP com acompanhantes e grupos.
5. Estatísticas, domínio, compartilhamento/QR.
6. Admin completo.
7. Revisões: segurança, mobile, performance.

## 5. Credenciais necessárias
Para a etapa P0 preciso de: token de acesso do Mercado Pago, segredo do webhook e chave de API do Resend (com domínio verificado). Sem elas, o pagamento e os e-mails continuam desligados — nada será simulado.

## 6. Nada será destruído
Todas as tabelas, funções, políticas e telas existentes permanecem. As mudanças são aditivas (novas tabelas e colunas) ou substituem apenas os stubs de pagamento.
