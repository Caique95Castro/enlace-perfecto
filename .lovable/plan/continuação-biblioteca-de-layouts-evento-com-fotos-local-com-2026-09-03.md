# Continuação: Biblioteca de Layouts + Evento com fotos + Local com mapa e clima

## Estado atual

A Biblioteca de Layouts (5 estilos: Botanical, Romantic, Minimal, Editorial, Classic) já tem definições, serviço de aplicar/restaurar, camada decorativa (skins) integrada ao site público e a tela `LayoutLibrary` pronta. Falta apenas expor a aba no painel do site. Os dois pedidos novos entram na sequência.

## 1. Finalizar a Biblioteca de Layouts

- Adicionar a aba "Layouts" em Dashboard > Site (ao lado de Editor visual, Aparência, Seções e Fotos), renderizando a `LayoutLibrary` com as seções e configurações do casal.
- Verificar visualmente no preview: aplicar um estilo, conferir cores/fontes/decorações no site e o botão "Restaurar visual original".

## 2. Seção "Cerimônia e recepção": fotos do local

- Novo grupo "Fotos do local" no editor da seção, com até 4 campos de imagem (`venue_photo_1..4`), enviados pelo mesmo upload já usado nas outras seções.
- Opções de exibição: "Disposição das fotos" (grade ou carrossel, reaproveitando o `GalleryCarousel`) e "Formato" (quadrado, paisagem, retrato).
- No site público, as fotos aparecem abaixo dos dados de data/horário/endereço, respeitando cores, moldura e espaçamento já configurados. Sem fotos, nada muda.

## 3. Seção "Local": mapa do Google Maps + previsão do tempo

Mapa
- Mapa incorporado do Google Maps (sem chave de API), centrado no endereço do local ou nas coordenadas do casamento quando existirem.
- Campos novos no editor: "Mostrar mapa" (ligado por padrão), "Altura do mapa" (baixo/médio/alto) e "Zoom". O link "Como chegar" continua abaixo do mapa.

Previsão do tempo
- Card "Como vai estar o tempo" com ícone, temperatura mínima/máxima, chance de chuva e uma frase (ex.: "Ensolarado, leve um óculos de sol").
- Fonte: serviço meteorológico gratuito (Open-Meteo), sem chave. Buscado por uma função de servidor a partir do endereço/coordenadas e da data do casamento, com cache curto.
- Regra de exibição: até 16 dias antes do casamento mostra a previsão real; antes disso mostra a média histórica daquela data no local, rotulada como "média histórica para esta data", para o card nunca ficar vazio.
- Campo "Mostrar previsão do tempo" no editor (ligado por padrão). Se não houver endereço/data, o card não aparece.

## Detalhes técnicos

- `src/routes/_authenticated/dashboard.site.tsx`: nova `TabsTrigger`/`TabsContent` "Layouts" com `<LayoutLibrary coupleId sections settings />`.
- `src/lib/sections.ts`: novos campos em `event` (imagens e opções de exibição) e `location` (mapa e clima).
- `src/components/site/WeddingSiteView.tsx`: renderização das fotos no bloco de evento; no bloco de local, `<iframe>` do Google Maps (`https://www.google.com/maps?q=<endereço|lat,lng>&z=<zoom>&output=embed`, com `loading="lazy"`) e o componente de clima.
- `src/components/site/WeatherCard.tsx` (novo): componente do site público que chama a função de servidor via `useQuery` e trata carregando/erro sem quebrar a página.
- `src/lib/weather.functions.ts` (novo): `createServerFn` pública que geocodifica o endereço (Open-Meteo Geocoding) quando não há latitude/longitude e consulta a previsão ou a climatologia (Open-Meteo Forecast/Archive). Validação de entrada com zod; nenhuma chave necessária.
- Nenhuma mudança de banco: tudo é salvo no `settings` (jsonb) das seções já existentes; latitude/longitude já existem em `weddings`.
- Dados do site continuam vindo do banco; nada fixo no código.
