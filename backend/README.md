# Blusã Oversized Store — API

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
  localmente.
- **Webhook** (`POST /v1/webhooks/mercadopago`): toda notificação tem a
  assinatura HMAC validada antes de qualquer processamento, e o status oficial
  é sempre reconfirmado via API do Mercado Pago (nunca se confia apenas no
  payload recebido). O processamento é idempotente.
- **Estoque**: reservado atomicamente na criação do pedido (antes do
  pagamento) via UPDATE condicional no banco; liberado automaticamente pelo
  job `src/jobs/expireReservations.js` quando o pedido não é pago em 30
  minutos, ou imediatamente em caso de cancelamento/recusa.

## Próximos passos sugeridos

1. Testes ponta a ponta contra o sandbox real do Mercado Pago (esta suíte usa
   mocks; falta validar com credenciais de sandbox verdadeiras — cartões de
   teste oficiais e o webhook de fato batendo na aplicação).
2. Upload de imagens de produto (hoje o payload de criação de produto espera
   URLs já hospedadas — falta o endpoint de upload para Cloudinary/S3).
3. Job de e-mail assíncrono (fila) para desacoplar completamente o envio de
   e-mail do ciclo de vida da requisição HTTP (hoje já é fire-and-forget, mas
   uma fila com retry seria mais robusta que best-effort simples).
4. Frontend: loja virtual (React/Vite) e painel administrativo.
