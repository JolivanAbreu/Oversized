# Dravennx — Painel Administrativo

Frontend interno (React 19 + Vite + Tailwind CSS v4) para a equipe da loja
gerenciar produtos, estoque, pedidos e cupons. Projeto separado da loja
virtual, consumindo a mesma API REST do backend.

## Setup local

```bash
npm install
cp .env.example .env   # ajuste VITE_API_BASE_URL se o backend não estiver em localhost:3000
npm run dev
```

Abre em `http://localhost:5174` (porta diferente da loja, que usa 5173).

## Acesso

Só usuários com perfil `admin` ou `operator` conseguem entrar — um cliente
comum recebe "Esta conta não tem acesso ao painel administrativo" no login.
Para promover um usuário existente a admin (não há tela para isso ainda,
é feito diretamente no banco):

```sql
UPDATE users SET role = 'admin' WHERE email = 'seuemail@exemplo.com';
```

Depois disso, é só fazer login normalmente — o token é reemitido com o novo
perfil no próximo login.

## Perfis e permissões

| Área | Operador | Administrador |
|---|---|---|
| Ver produtos e ajustar estoque | Sim | Sim |
| Criar/editar/desativar produto | Não | Sim |
| Ver e atualizar status de pedidos | Sim | Sim |
| Cupons | Não | Sim |
| Dashboard | Não | Sim |

As mesmas regras são aplicadas no backend (RBAC) — a interface apenas
esconde o que o perfil não pode fazer, a autorização de verdade está na API.

## Identidade visual

Reaproveita a paleta da loja (ink/laranja/lima) mas numa expressão
operacional: densidade de informação em vez da tipografia gigante da
vitrine. O elemento de assinatura da loja (a etiqueta de roupa) aparece aqui
como `StatusPill` — um selo compacto para status de pedido e estoque,
incluindo um tom âmbar ("warn") que a loja não precisa mas o painel sim
("aguardando ação").

## Estrutura

```
src/
  api/client.js       Wrapper de fetch com token JWT e refresh automático
  context/AuthContext.jsx   Sessão + checagem de perfil (admin/operator)
  components/          Layout (sidebar), StatusPill, Button, Field...
  pages/
    Login.jsx
    Products.jsx / ProductForm.jsx   Lista + criar/editar produto e variações
    Orders.jsx / OrderDetail.jsx     Lista + atualização de status
    Coupons.jsx                     Lista + criação + ativar/desativar
    Dashboard.jsx                   KPIs, vendas por dia, mais vendidos
```

## Funcionalidades por tela

**Produtos**: lista com busca (inclui inativos, ao contrário da loja
pública), formulário com variações dinâmicas (tamanho/cor/SKU/estoque/preço
específico) e imagens por URL. Ajuste de estoque pontual (com motivo,
auditado) direto na tela de edição, sem precisar salvar o formulário inteiro.

**Pedidos**: lista com filtro por status, detalhe com itens/endereço/
pagamentos, e atualização de status restrita às transições válidas da
máquina de estados do backend (não é possível, por exemplo, pular de
"aguardando pagamento" direto para "enviado").

**Cupons**: criação com percentual ou valor fixo, valor mínimo, vigência e
limite de usos opcional; ativar/desativar sem apagar o histórico de uso.

**Dashboard**: ticket médio, pedidos pagos aguardando separação, gráfico de
vendas dos últimos 30 dias e produtos mais vendidos.

## Validação já feita

Sem navegador disponível neste ambiente de desenvolvimento, a validação foi
feita em camadas:
1. `npm run build` — build de produção sem erros.
2. Smoke test estático (`react-dom/server`) de todas as páginas.
3. Smoke test com hidratação real (`react-dom/client` + `act`), mockando
   `fetch` com payloads no formato exato da API.
4. Testes de ponta a ponta via curl contra o backend real: criação de
   produto, atualização de status de pedido (incluindo a exigência de
   código de rastreio), criação de cupom e leitura do dashboard — todos
   com dados reais aparecendo corretamente.

## Próximos passos sugeridos

1. Tela de gestão de usuários (promover cliente a operador/admin pela
   própria interface, em vez de direto no banco).
2. Upload de imagem (hoje só aceita URL já hospedada, igual à loja).
3. Paginação visível na lista de produtos e pedidos quando passar de uma
   página (o backend já pagina, falta o controle de navegação na tela).
