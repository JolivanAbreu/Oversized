# Blusã Oversized Store — Loja Virtual

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

## Identidade visual

- Paleta: papel/bone frio (`--color-canvas`), tinta quase-preta (`--color-ink`),
  laranja de etiqueta (`--color-tag`) e lima de adesivo (`--color-lime`) —
  tokens definidos em `src/index.css` via `@theme` do Tailwind v4.
- Tipografia: Anton (display, escala grande e "estourando" a moldura — ecoa o
  conceito de "oversized"), Space Mono (preços, tamanhos, labels — estilo
  etiqueta impressa), Inter (corpo de texto).
- Elemento de assinatura: componente `Tag` (`src/components/Tag.jsx`) — imita
  uma etiqueta física de roupa, usado para preço, tamanho e status em toda a
  loja.
- Sem fotografia: os produtos usam uma ilustração SVG simples
  (`src/components/GarmentArt.jsx`) que varia de cor conforme a variação
  selecionada, evitando depender de imagens de terceiros.

## Estrutura

```
src/
  api/client.js       Wrapper de fetch com token JWT e refresh automático
  context/            AuthContext (sessão) e CartContext (carrinho)
  lib/
    format.js          Formatação de preço/data/status
    mercadopago.js      Tokenização de cartão via SDK do Mercado Pago
  components/          Header, Footer, ProductCard, Tag, Button, Field...
  pages/               Home, Catalog, ProductDetail, Cart, Checkout,
                       Login, Register, Orders, OrderDetail, Addresses
```

## Validação já feita

Como não há navegador disponível neste ambiente para captura visual direta,
a validação foi feita via:
1. `npm run build` — build de produção sem erros.
2. Smoke test renderizando cada página isoladamente (`react-dom/server`).
3. Smoke test com hidratação real (`react-dom/client` + `act`), mockando
   `fetch` com payloads no formato exato da API, confirmando que os dados
   aparecem corretamente na tela (preços, status de pedido, variação
   esgotada desabilitada, endereço de entrega etc.).

Ainda falta a validação visual final num navegador de verdade — recomendo
rodar `npm run dev` localmente e conferir o resultado antes de publicar.

## Próximos passos sugeridos

1. Validação visual num navegador real (cores, espaçamento, responsividade).
2. Página de avaliações de produto e lista de favoritos (RF-37/RF-38) — o
   backend já suporta, falta a tela.
3. Configurar a chave pública de sandbox do Mercado Pago para testar o
   pagamento por cartão de ponta a ponta.
4. Painel administrativo (React separado ou rota protegida por perfil).
