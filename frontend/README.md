# Dravennx — Loja Virtual

Frontend da loja (cliente final), em React 19 + Vite + Tailwind CSS v4,
consumindo a API REST do backend.

## Setup local

```bash
npm install
cp .env.example .env   # ajuste VITE_API_BASE_URL se o backend não estiver em localhost:3000
npm run dev
```

Abre em `http://localhost:5173`. É necessário o backend rodando (ver README
do backend) com as migrations e o seed aplicados.

## Botão "Painel" para admin/operador

Quando um usuário com perfil admin ou operador está logado na loja, um
botão "Painel" aparece no cabeçalho (desktop) e no menu (mobile), abrindo o
painel administrativo em uma nova aba. A URL vem de `VITE_ADMIN_PANEL_URL`
no `.env` — ajuste para a URL real do painel em produção.

## WhatsApp flutuante

Um ícone flutuante de WhatsApp (`src/components/FloatingWhatsApp.jsx`) fica
fixo no canto inferior direito em qualquer página da loja, com mensagem de
contato genérica. Some automaticamente se a loja nunca configurou
`STORE_WHATSAPP_NUMBER` no backend. É diferente do botão contextual que
aparece no detalhe de um pedido específico com frete "a combinar" (esse
usa `ShippingArrangementNotice.jsx` e já vem com os dados do pedido
pré-preenchidos na mensagem) — os dois convivem sem conflito.

## Se o Pix/cartão der "não foi possível processar o pagamento"

Esse erro quase sempre significa que `MERCADOPAGO_ACCESS_TOKEN` no `.env`
do backend ainda está vazio ou é o valor de exemplo — não é um bug. O
próprio servidor já avisa isso no log ao iniciar, e agora falha
imediatamente (sem esperar timeout) com uma dica clara em ambiente que não
é produção. Gere uma credencial de sandbox real em
https://www.mercadopago.com.br/developers/panel e reinicie o backend.

## Pagamento por cartão

O checkout usa o SDK oficial do Mercado Pago no navegador para tokenizar os
dados do cartão — nenhum número, validade ou CVV é enviado à nossa API (só o
token). Para habilitar cartão de crédito, defina no `.env`:

```
VITE_MERCADOPAGO_PUBLIC_KEY=TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

Sem essa chave, o botão de pagamento por cartão fica desabilitado e a UI
explica o motivo — o fluxo por **Pix funciona normalmente sem essa chave**,
pois não depende de tokenização no cliente.

## Identidade visual — integrada com o mockup `Frontend.git`

A interface foi redesenhada para seguir fielmente o mockup estático
desenvolvido pelo cliente em `github.com/JolivanAbreu/Frontend.git`
(pasta `DRAVENNX/Claude/`), mantendo 100% da lógica, rotas, APIs e regras de
negócio deste projeto (`Oversized.git`). Nada foi removido — cada página do
mockup foi mapeada para sua página funcional real e reconstruída no mesmo
padrão visual.

- Paleta: cinza claro de fundo (`--color-canvas: #F4F4F6`), tinta quase-preta
  (`--color-ink: #1A1A1A`), verde neon de ação (`--color-tag: #00FD77`) —
  tokens em `src/index.css` via `@theme` do Tailwind v4. Idêntica à do mockup.
- Tipografia: fonte do sistema (`-apple-system, Segoe UI, Roboto...`), peso
  900 nos títulos — igual ao mockup, sem fonte display própria.
- Componentes reconstruídos no padrão do mockup: `ProductCard` (cartão
  branco, indicadores de foto, badge do admin, botão "Adicionar" sempre
  visível), `PromoBanner` ("compre 3 e ganhe"), navbar com sidebar de
  atalhos sob o ícone da sacola, timeline de rastreio de pedido com ícones,
  cartões de pedido/favorito/carrinho com sombra suave em vez de borda
  grossa.
- Diferenças conscientes em relação ao mockup (documentadas, não por
  limitação): o sistema de categorias é dinâmico (vem do banco via
  `/categories`) em vez de fixar "Vestuário"/"Acessórios" como páginas
  hardcoded; não existem preços "de/por" riscados nem contagem de curtidas
  do Instagram porque esses dados não existem no modelo real — nenhum dado
  falso foi inventado para preencher esses espaços do mockup.

## Estrutura

```
src/
  api/client.js       Wrapper de fetch com token JWT e refresh automático
  context/             AuthContext, CartContext, WishlistContext, AuthModalContext
  lib/
    format.js          Formatação de preço/data/status
    mercadopago.js      Tokenização de cartão via SDK do Mercado Pago
    whatsapp.js         Link do WhatsApp pro frete "combinar com o vendedor"
  components/          Header, Footer, ProductCard, ProductGallery,
                       PromoBanner, InstagramSection, FeaturedBanner,
                       LoginModal, ReviewsSection, StarRating...
  pages/               Home, Catalog, ProductDetail, Cart, Checkout,
                       Login, Register, Orders, OrderDetail, Addresses,
                       Favorites, Account
```

## Validação já feita

Como não há navegador disponível neste ambiente para captura visual direta,
a validação foi feita via:
1. `npm run build` — build de produção sem erros.
2. `npx oxlint` — 0 erros.
3. Smoke test com hidratação real (`react-dom/client` + `act`), mockando
   `fetch` com payloads no formato exato da API — 19 verificações cobrindo
   Home, Catalog, ProductDetail, Cart, Favorites, Orders, OrderDetail e
   Account, todas passando.
4. `node --loader vite-node smoke.test.mjs` (script próprio do projeto) —
   fluxo completo contra o **backend real**: registro, login, adicionar ao
   carrinho, criar endereço, criar pedido, gerar Pix, ver detalhe do pedido.
   Zero erros de console capturados em nenhuma página.

Ainda falta a validação visual final num navegador de verdade — recomendo
rodar `npm run dev` localmente (com o backend rodando) e conferir o
resultado antes de publicar.

## Próximos passos sugeridos

1. Validação visual num navegador real (cores, espaçamento, responsividade).
2. Página de avaliações de produto e lista de favoritos (RF-37/RF-38) — o
   backend já suporta, falta a tela.
3. Configurar a chave pública de sandbox do Mercado Pago para testar o
   pagamento por cartão de ponta a ponta.
4. Painel administrativo (React separado ou rota protegida por perfil).
