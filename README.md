# Meu Canto de Amor

Crie uma aplicação SaaS completa chamada Meu Casamento, uma plataforma para criação e gerenciamento de sites de casamento.

IMPORTANTE: este projeto deve ser construído como uma aplicação REAL e FUNCIONAL, conectada ao Supabase. Não quero apenas um protótipo visual ou dados mockados.

O sistema deve ser preparado desde o início para funcionar como um SaaS multi-tenant, onde vários casais podem criar seus próprios casamentos, cada um com seus convidados, site, fotos, RSVP e lista de presentes isolados.

Toda a interface deve estar em português do Brasil (pt-BR).

==================================================

TECNOLOGIA
==================================================

Utilize:

React

TypeScript

Tailwind CSS

shadcn/ui

Lucide React

Supabase

PostgreSQL

Supabase Auth

Supabase Storage

Supabase Row Level Security (RLS)

Utilize uma arquitetura organizada e escalável.

Não utilize dados fictícios como fonte principal da aplicação.

Todos os dados importantes devem ser persistidos no Supabase.

==================================================
2. OBJETIVO DO PRODUTO

O Meu Casamento será uma plataforma onde o casal poderá:

Criar uma conta

Criar seu casamento

Informar os dados do evento

Escolher um template

Personalizar o site

Adicionar fotos

Criar sua história

Cadastrar local e horário

Criar lista de presentes

Criar cotas para lua de mel

Cadastrar convidados

Receber confirmações de presença

Acompanhar RSVP

Acompanhar presentes

Visualizar pagamentos

Publicar seu site

Compartilhar um link público do casamento

Exemplo de URL:

/joao-e-maria

==================================================
3. AUTENTICAÇÃO

Utilize Supabase Auth.

Criar:

Cadastro

Login

Logout

Recuperação de senha

Alteração de senha

Proteção das rotas privadas

Após o cadastro, criar automaticamente um registro em profiles.

O usuário autenticado deverá poder criar e administrar somente os próprios casamentos.

==================================================
4. BANCO DE DADOS SUPABASE

Criar as seguintes tabelas:

profiles
couples
weddings
website_settings
website_sections
photos
guests
rsvps
gift_items
gift_orders
payments
subscriptions

Criar os relacionamentos corretamente usando UUIDs e foreign keys.

==================================================
5. TABELA PROFILES

Campos:

id UUID PRIMARY KEY REFERENCES auth.users(id)
full_name TEXT
phone TEXT
avatar_url TEXT
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ

Criar trigger para criar automaticamente o profile quando um usuário se cadastrar.

==================================================
6. TABELA COUPLES

Campos:

id UUID PRIMARY KEY
owner_id UUID REFERENCES profiles(id)
partner_1_name TEXT
partner_2_name TEXT
display_name TEXT
slug TEXT UNIQUE
status TEXT
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ

Status:

draft
active
archived

O slug deve ser utilizado para criar a URL pública.

Exemplo:

joao-e-maria

==================================================
7. TABELA WEDDINGS

Campos:

id UUID PRIMARY KEY
couple_id UUID UNIQUE REFERENCES couples(id)
title TEXT
description TEXT
wedding_date DATE
ceremony_time TIME
venue_name TEXT
venue_address TEXT
city TEXT
state TEXT
latitude DOUBLE PRECISION
longitude DOUBLE PRECISION
dress_code TEXT
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ

==================================================
8. WEBSITE_SETTINGS

Campos:

id UUID PRIMARY KEY
couple_id UUID UNIQUE REFERENCES couples(id)
template_slug TEXT
primary_color TEXT
secondary_color TEXT
background_color TEXT
heading_font TEXT
body_font TEXT
hero_image_url TEXT
music_url TEXT
custom_domain TEXT
published BOOLEAN
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ

==================================================
9. WEBSITE_SECTIONS

Campos:

id UUID PRIMARY KEY
couple_id UUID REFERENCES couples(id)
section_type TEXT
title TEXT
content TEXT
position INTEGER
visible BOOLEAN
settings JSONB
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ

Tipos de seção:

hero
story
countdown
gallery
event
location
dress_code
rsvp
gifts
message
footer

Permitir alterar a ordem das seções.

Permitir ativar/desativar seções.

==================================================
10. PHOTOS

Campos:

id UUID PRIMARY KEY
couple_id UUID REFERENCES couples(id)
section_id UUID REFERENCES website_sections(id)
storage_path TEXT
public_url TEXT
caption TEXT
position INTEGER
created_at TIMESTAMPTZ

Utilizar Supabase Storage.

Criar bucket:

wedding-images

Organizar os arquivos por couple_id.

Exemplo:

wedding-images/{couple_id}/hero/
wedding-images/{couple_id}/gallery/
wedding-images/{couple_id}/story/

==================================================
11. GUESTS

Campos:

id UUID PRIMARY KEY
couple_id UUID REFERENCES couples(id)
name TEXT
email TEXT
phone TEXT
group_name TEXT
plus_one_allowed BOOLEAN
plus_one_name TEXT
status TEXT
notes TEXT
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ

Status:

pending
confirmed
declined

Criar interface para:

Adicionar convidado

Editar

Excluir

Pesquisar

Filtrar

Importar convidados futuramente

==================================================
12. RSVPS

Campos:

id UUID PRIMARY KEY
couple_id UUID REFERENCES couples(id)
guest_id UUID UNIQUE REFERENCES guests(id)
response TEXT
guests_count INTEGER
dietary_restrictions TEXT
message TEXT
responded_at TIMESTAMPTZ
created_at TIMESTAMPTZ

Responses:

attending
not_attending

==================================================
13. GIFT_ITEMS

Criar sistema de lista de presentes.

Campos:

id UUID PRIMARY KEY
couple_id UUID REFERENCES couples(id)
name TEXT
description TEXT
image_url TEXT
price NUMERIC(12,2)
type TEXT
quantity INTEGER
available_quantity INTEGER
active BOOLEAN
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ

Tipos:

physical
quota

Exemplo de presente físico:

"Jogo de panelas"
R$ 500

Exemplo de cota:

"Lua de mel"
R$ 2.000

Permitir criar várias cotas para um mesmo objetivo.

==================================================
14. GIFT_ORDERS

Campos:

id UUID PRIMARY KEY
couple_id UUID REFERENCES couples(id)
gift_item_id UUID REFERENCES gift_items(id)
guest_name TEXT
guest_email TEXT
quantity INTEGER
amount NUMERIC(12,2)
status TEXT
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ

Status:

pending
paid
cancelled
refunded

==================================================
15. PAYMENTS

Campos:

id UUID PRIMARY KEY
couple_id UUID REFERENCES couples(id)
order_id UUID UNIQUE REFERENCES gift_orders(id)
gateway TEXT
gateway_payment_id TEXT
amount NUMERIC(12,2)
payment_method TEXT
status TEXT
paid_at TIMESTAMPTZ
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ

Payment methods:

pix
credit_card
debit_card

Payment status:

pending
approved
rejected
refunded

IMPORTANTE:

Não considerar um pedido como pago apenas porque o usuário retornou ao site.

A confirmação de pagamento deverá futuramente ser feita através de webhook do gateway.

Por enquanto, preparar a arquitetura para integração com Mercado Pago.

==================================================
16. SUBSCRIPTIONS

Criar tabela:

id UUID PRIMARY KEY
couple_id UUID REFERENCES couples(id)
plan TEXT
status TEXT
gateway TEXT
gateway_subscription_id TEXT
current_period_start TIMESTAMPTZ
current_period_end TIMESTAMPTZ
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ

Planos:

free
premium
premium_plus

Não implementar cobrança real da assinatura ainda, apenas preparar a estrutura.

==================================================
17. ROW LEVEL SECURITY

ATENÇÃO:

Implementar RLS corretamente.

Um usuário nunca poderá acessar dados de outro casal.

Criar políticas para garantir que:

Usuário só veja seu próprio profile

Usuário só veja seus próprios couples

Usuário só altere seus próprios weddings

Usuário só altere seus próprios website_settings

Usuário só altere suas próprias sections

Usuário só altere suas próprias fotos

Usuário só veja seus próprios convidados

Usuário só altere seus próprios convidados

Usuário só veja seus próprios RSVP

Usuário só altere seus próprios presentes

Usuário só veja seus próprios pedidos

Usuário só veja seus próprios pagamentos

Usuário só veja suas próprias subscriptions

Criar função auxiliar para verificar ownership do couple quando necessário.

NUNCA deixar tabelas privadas expostas sem RLS.

==================================================
18. SITE PÚBLICO

Criar rota:

/:slug

Exemplo:

/joao-e-maria

O site público deve buscar os dados reais do Supabase.

Criar as seguintes seções:

Hero

Contagem regressiva

Nossa história

Galeria

Cerimônia

Local

Dress code

RSVP

Lista de presentes

Mensagem aos convidados

Footer

O site deve funcionar perfeitamente em:

Desktop

Tablet

Mobile

Prioridade máxima para experiência mobile.

==================================================
19. TEMPLATE VISUAL

Criar inicialmente 3 templates.

Template 1:
Elegante

Template 2:
Romântico

Template 3:
Minimalista

Os templates devem usar a mesma estrutura de dados.

Não duplicar a lógica do banco.

Apenas alterar apresentação visual.

==================================================
20. DASHBOARD DOS NOIVOS

Criar rota privada:

/dashboard

Dashboard principal:

Mostrar:

Nome do casal

Data do casamento

Contagem regressiva

Total de convidados

Confirmados

Pendentes

Recusados

Total recebido em presentes

Quantidade de presentes

Link público do casamento

Criar cards visualmente bonitos e responsivos.

==================================================
21. MENU DO DASHBOARD

Criar:

Dashboard

Meu casamento

Informações

Data e local

Nossa história

Meu site

Aparência

Seções

Fotos

Preview

Publicar

Convidados

Todos

Confirmados

Pendentes

Recusados

RSVP

Lista de presentes

Presentes

Cotas

Recebidos

Pagamentos

Configurações

==================================================
22. EDITOR DO SITE

Criar interface visual para personalização.

Permitir:

Escolher template

Alterar cores

Alterar fontes

Alterar foto principal

Alterar textos

Ativar/desativar seções

Reordenar seções

Adicionar fotos

Visualizar preview

Criar preview do site em tempo real sempre que possível.

==================================================
23. CONVIDADOS

Criar uma tabela administrativa com:

Nome
Email
Telefone
Grupo
Status
Acompanhante
Data da confirmação

Criar:

Busca

Filtro

Adicionar

Editar

Excluir

Mostrar estatísticas no topo:

Total
Confirmados
Pendentes
Recusados

==================================================
24. RSVP PÚBLICO

No site do casamento, criar formulário:

Nome
Email
Vai comparecer?
Quantidade de pessoas
Acompanhante
Restrições alimentares
Mensagem

Ao enviar:

Atualizar guest

Criar ou atualizar RSVP

Atualizar estatísticas do dashboard

Mostrar mensagem de sucesso.

==================================================
25. LISTA DE PRESENTES

Criar página pública:

/:slug/presentes

Mostrar cards dos presentes.

Cada card:

Imagem
Nome
Descrição
Valor
Disponibilidade
Botão:

"Presentear"

Para cotas:

Mostrar progresso.

Exemplo:

Lua de Mel

12 de 20 cotas

R$ 1.200 de R$ 2.000

████████████░░░░

==================================================
26. CHECKOUT

Criar fluxo:

Selecionar presente
↓
Informar nome
↓
Informar email
↓
Selecionar quantidade
↓
Confirmar
↓
Checkout

Preparar arquitetura para:

PIX
Cartão de crédito
Cartão de débito

Não implementar pagamento falso.

Se a integração real ainda não estiver disponível, criar uma camada de service preparada para Mercado Pago e deixar claramente separada da interface.

==================================================
27. DASHBOARD DE PRESENTES

Mostrar:

Total arrecadado
Total de pedidos
Pedidos pagos
Pedidos pendentes

Tabela:

Convidado
Presente
Valor
Forma de pagamento
Status
Data

==================================================
28. STORAGE

Configurar Supabase Storage.

Bucket:

wedding-images

Criar upload de:

Foto principal

Galeria

Fotos da história

Mostrar preview antes do upload.

Permitir excluir imagens.

==================================================
29. RESPONSIVIDADE

O projeto deve ser:

Mobile First.

Testar visualmente:

375px
390px
430px
768px
1024px
1440px

O dashboard também deve funcionar no celular.

==================================================
30. DESIGN

Criar uma identidade visual elegante, moderna e premium.

Não quero aparência de dashboard genérico.

Utilizar:

Cards modernos

Espaçamento generoso

Tipografia elegante

Bordas suaves

Microinterações

Animações discretas

Estados de loading

Empty states

Toasts

Confirmações antes de exclusões

Evitar excesso de sombras, gradientes exagerados e elementos desnecessários.

==================================================
31. SEGURANÇA

Não colocar:

Service role key no frontend

Secrets no código

Credenciais do Mercado Pago no frontend

Utilizar variáveis de ambiente.

Toda operação privilegiada deverá ser feita no backend/Edge Functions quando necessário.

==================================================
32. EDGE FUNCTIONS

Preparar estrutura para:

create-payment
payment-webhook
send-email

Não colocar lógica sensível no frontend.

==================================================
33. EXPERIÊNCIA DO USUÁRIO

Após criar a conta:

Mostrar onboarding:

PASSO 1
"Vamos criar seu casamento"

PASSO 2
"Conte-nos sobre vocês"

PASSO 3
"Quando será o casamento?"

PASSO 4
"Onde será?"

PASSO 5
"Escolha seu template"

PASSO 6
"Adicione sua foto"

PASSO 7
"Seu site está pronto!"

Depois:

"Publicar meu site"

==================================================
34. PRIMEIRO CASAMENTO

Criar o sistema de forma que o primeiro usuário possa criar seu próprio casamento.

Não criar casamento fictício como dado principal.

Depois do cadastro, o usuário deverá conseguir criar:

João & Maria

com seus próprios dados.

==================================================
35. SEO

Cada site público deve possuir:

title dinâmico

meta description dinâmica

Open Graph

imagem de compartilhamento

URL amigável

Exemplo:

João & Maria | Nosso Casamento

==================================================
36. QR CODE

Preparar funcionalidade para gerar QR Code do site público.

O QR Code deve apontar para:

https://dominio/:slug

Permitir futuramente baixar o QR Code.

==================================================
37. CÓDIGO

Organizar o projeto em componentes reutilizáveis.

Não criar um único arquivo gigante.

Separar:

components
pages
hooks
services
lib
types
templates

Criar services para:

couples

weddings

guests

rsvps

gifts

orders

payments

==================================================
38. IMPORTANTE SOBRE MOCK DATA

Não utilizar mock data para substituir o Supabase.

Se precisar criar estados vazios, utilizar:

"Você ainda não cadastrou nenhum convidado."

"Você ainda não possui presentes."

"Seu site ainda não foi publicado."

Todos os dados reais deverão vir do Supabase.

==================================================
39. TRATAMENTO DE ERROS

Implementar:

Loading states

Error states

Empty states

Toast de sucesso

Toast de erro

Validação de formulários

Tratamento de erros do Supabase

Mensagens em português.

==================================================
40. ENTREGA

Antes de considerar o projeto concluído, verificar:

Supabase conectado

Todas as tabelas criadas

Foreign keys funcionando

RLS funcionando

Auth funcionando

Storage funcionando

CRUD de casamento funcionando

CRUD de convidados funcionando

RSVP funcionando

CRUD de presentes funcionando

Site público funcionando

Dashboard funcionando

Responsividade funcionando

Nenhum dado principal usando mock

Nenhuma chave secreta exposta no frontend

Se alguma funcionalidade depender de uma integração externa ainda não configurada, criar a estrutura de backend/service necessária e deixar a integração claramente identificada como pendente, sem simular um pagamento real.

==================================================
OBJETIVO FINAL

Quero terminar com uma primeira versão funcional de um SaaS real de casamento.

Fluxo principal:

CADASTRO
↓
CRIAR CASAMENTO
↓
ESCOLHER TEMPLATE
↓
PERSONALIZAR
↓
PUBLICAR SITE
↓
COMPARTILHAR
↓
CONVIDADOS ACESSAM
↓
CONFIRMAM PRESENÇA
↓
ESCOLHEM PRESENTES
↓
PAGAMENTO
↓
CASAL ACOMPANHA TUDO PELO DASHBOARD

Construa a aplicação pensando em escalabilidade, segurança, manutenção e futura transformação em um SaaS comercial.

Não simplifique a arquitetura criando apenas uma landing page ou protótipo.

Comece configurando o Supabase e a estrutura de dados, depois autenticação, depois dashboard, depois site público e finalmente lista de presentes e pagamentos.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/3edfc146-25d6-4527-96db-2fdee11042cc).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
