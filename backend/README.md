# Dravennx — API

Backend do sistema de vendas online, em Node.js/Express + Sequelize (PostgreSQL).
Pagamentos exclusivamente via Mercado Pago (cartão de crédito e Pix).

Este projeto implementa o que está descrito na suíte de documentação técnica
(SRS, Arquitetura, Modelo de Dados, API, Plano de Testes, Manual, Implantação,
Segurança/LGPD) entregue anteriormente.

## Requisitos

- Node.js 20 LTS ou superior
- PostgreSQL 16 (local ou gerenciado)
- Uma conta de desenvolvedor no Mercado Pago (credenciais de sandbox)

## Setup local

```bash
npm install
cp .env.example .env   # preencha as variáveis, especialmente DATABASE_URL e as do Mercado Pago
npm run migrate         # cria as tabelas
npm run seed             # popula uma categoria, produto e cupom de exemplo
npm run dev               # inicia com reload automático (nodemon)
```

A API sobe em `http://localhost:3000`, com todas as rotas sob o prefixo `/v1`
(ex.: `http://localhost:3000/v1/products`). `GET /v1/health` confirma que o
serviço está no ar.

## Testes

```bash
npm test
```

A suíte tem duas camadas:

- **Testes unitários** (`coupon.service.test.js`, `order.transitions.test.js`,
  `mercadopago.webhook.test.js`): lógica pura, sem banco de dados.
- **Testes de integração** (`payment.integration.test.js`): sobem a aplicação
  Express de verdade contra um banco PostgreSQL real (`NODE_ENV=test`, banco
  `..._test`, ver `src/config/config.js`), com a integração do Mercado Pago
  mockada via `jest.mock`. Cobrem o fluxo completo — cadastro, carrinho,
  checkout, reserva/liberação de estoque, pagamento por cartão e Pix, e o
  webhook (incluindo idempotência e assinatura inválida).

Para rodar os testes de integração é necessário ter um banco
`<DB_NAME>_test` criado e migrado:

```bash
createdb blusa_oversized_store_test
NODE_ENV=test npx sequelize-cli db:migrate
npm test
```

Esses testes já pegaram e corrigiram bugs reais durante o desenvolvimento:
um middleware de autenticação que interceptava rotas públicas por engano, o
envio de e-mail bloqueando (e podendo derrubar) requisições HTTP quando o SMTP
está fora do ar, uma falha do `crypto.timingSafeEqual` que derrubava a
aplicação com 500 em vez de rejeitar educadamente uma assinatura de webhook
malformada, e uma falha de comunicação com o Mercado Pago (rede indisponível,
resposta fora do formato esperado) que vazava como erro 500 genérico em vez
de um 502 tratado e sem criar registros de pagamento órfãos.

## Estrutura de pastas

```
src/
  config/        Configuração do Sequelize (CLI e app)
  models/        Models Sequelize (14 entidades, ver Modelo de Dados)
  migrations/    Migrations versionadas (schema completo + sequence de pedidos)
  seeders/       Dados de exemplo
  middlewares/   Autenticação JWT, RBAC, rate limiting, tratamento de erros
  routes/        Definição dos endpoints REST (espelha o documento de API)
  controllers/   Tradução HTTP <-> serviços
  services/      Regras de negócio (pedidos, pagamentos, estoque, cupons...)
  integrations/  Clientes externos: Mercado Pago, e-mail (SMTP), frete
  jobs/          Job agendado de expiração de reservas de estoque (RF-19)
  utils/         Helpers (ApiError, asyncHandler, geração de nº de pedido)
  __tests__/     Testes unitários (Jest)
```

## Fluxo de pagamento — pontos de atenção

- **Cartão de crédito**: o token é gerado no navegador do cliente pelo SDK JS
  do Mercado Pago — o backend nunca recebe número de cartão, validade ou CVV.
- **Pix**: o backend solicita a cobrança ao Mercado Pago e repassa o QR Code
  (base64) e o código copia-e-cola prontos; nenhuma geração de QR Code é feita
  localmente. O frontend faz **polling do status a cada 4s** (não depende do
  webhook), então funciona mesmo em ambiente local.
- **Webhook** (`POST /v1/webhooks/mercadopago`): toda notificação tem a
  assinatura HMAC validada antes de qualquer processamento, e o status oficial
  é sempre reconfirmado via API do Mercado Pago. Só funciona com uma
  `API_PUBLIC_URL` pública de verdade (não localhost) — em dev local, o campo
  `notification_url` é omitido automaticamente e o polling cobre o cenário.
- **Estoque**: reservado atomicamente na criação do pedido (antes do
  pagamento) via UPDATE condicional no banco; liberado automaticamente pelo
  job `src/jobs/expireReservations.js`, no cancelamento (`POST
  /orders/:id/cancel`) ou na exclusão de pedidos não pagos (`DELETE
  /orders/:id`).

## Conta do usuário e ciclo de vida do pedido

- `GET/PUT /account`, `PUT /account/email` (exige senha atual) e
  `PUT /account/password` — perfil, troca de e-mail e troca de senha.
- `POST /orders/:id/cancel` — cliente cancela o próprio pedido enquanto ainda
  não foi enviado; se já estava pago, aciona estorno automático.
- `DELETE /orders/:id` — remove definitivamente um pedido, mas só quando ele
  nunca chegou a ser pago (ou já está cancelado) — preserva o histórico
  fiscal de qualquer pedido pago.

## Envio de e-mail (confirmação de cadastro, redefinição de senha)

O envio usa SMTP genérico via Nodemailer (`src/integrations/mailer.js`).
Sem SMTP configurado, o app **não quebra** — o e-mail falha silenciosamente
em segundo plano (fire-and-forget) e o fluxo continua normalmente.

Opção gratuita recomendada para colocar no ar rapidamente: **Gmail com senha
de app** (grátis, ~500 e-mails/dia, suficiente para uma loja pequena):

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=sualoja@gmail.com
SMTP_PASS=<senha de app gerada em myaccount.google.com/apppasswords>
```

Se o e-mail não for confiável no seu caso, o cliente ainda tem uma saída:
qualquer pessoa da equipe pode redefinir a senha de um cliente diretamente
pelo banco (ou, futuramente, por uma tela de gestão de usuários no painel —
ver "Próximos passos").

## Upload de imagens de produto

`POST /admin/uploads` (admin) aceita um arquivo (`multipart/form-data`,
campo `image`, até 5MB, JPG/PNG/WEBP/GIF) e salva em `backend/uploads/`,
servido estaticamente em `/uploads/<arquivo>`. A URL retornada é montada a
partir da própria requisição (`req.protocol` + `req.get('host')`), então
funciona tanto em `localhost` quanto em produção sem configuração extra.
Colar uma URL já hospedada continua funcionando normalmente — upload e URL
convivem no mesmo campo `images` do produto.

## Opções de entrega

Substituídas por **Uberflex**, **99Flex** (motoboy sob demanda, preços fixos
configuráveis via `SHIPPING_UBERFLEX_PRICE`/`SHIPPING_99FLEX_PRICE` no
`.env`) e **"Combinar com o vendedor"** (frete zero no checkout, pedido fica
marcado para contato manual da equipe).

## Avaliações, favoritos e gestão de usuários

- `GET/POST /products/:id/reviews` — avaliação exige pedido **entregue** com
  o produto (RF-37). A listagem e o detalhe de produto já retornam
  `avgRating`/`reviewCount` agregados, sem chamada extra.
- `GET/POST/DELETE /wishlist` — lista de favoritos do cliente.
- `GET /admin/users`, `PUT /admin/users/:id/role`,
  `POST /admin/users/:id/reset-password` — gestão de usuários pelo painel
  (promover/rebaixar perfil, gerar senha temporária para quem não recebe
  e-mail). Um admin não pode alterar o próprio perfil por essa rota.

## WhatsApp para frete "combinar com o vendedor"

Configure `STORE_WHATSAPP_NUMBER` no `.env` (só dígitos, com código do país
— ex.: `5585999998888`). O número é servido publicamente em `GET
/store-info` e consumido pela loja para montar o botão "Falar no WhatsApp".

Existem dois tipos de frete sem preço fixo, diferenciados pelo campo
`shippingContactMethod` do pedido:
- **`store`** ("Combinar com o vendedor") — a loja entra em contato; a loja
  mostra o botão de WhatsApp da loja e o painel mostra o botão de WhatsApp
  do cliente.
- **`customer_app`** (Uber Flash, 99) — apps externos de corrida; o próprio
  cliente pede e paga a corrida no app, a loja não participa nem sabe o
  valor. Nenhum dos dois lados mostra botão de contato — só uma instrução.

## Próximos passos sugeridos

1. Testes ponta a ponta contra o sandbox real do Mercado Pago (esta suíte usa
   mocks; falta validar com credenciais de sandbox verdadeiras — cartões de
   teste oficiais e o webhook de fato batendo na aplicação, o que exige uma
   URL pública, ex.: via ngrok, ou o deploy em produção).
2. Tela de gestão de usuários no painel (promover cliente a operador/admin,
   redefinir senha de cliente sem depender de e-mail).
3. Job de e-mail assíncrono (fila) para desacoplar completamente o envio de
   e-mail do ciclo de vida da requisição HTTP (hoje já é fire-and-forget, mas
   uma fila com retry seria mais robusta que best-effort simples).
4. Frontend: loja virtual (React/Vite) e painel administrativo.
