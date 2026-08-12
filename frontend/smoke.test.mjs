import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost:5173/',
  pretendToBeVisual: true,
});

global.window = dom.window;
global.document = dom.window.document;
Object.defineProperty(global, 'navigator', { value: dom.window.navigator, configurable: true });
global.localStorage = dom.window.localStorage;
global.HTMLElement = dom.window.HTMLElement;
global.customElements = dom.window.customElements;
global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
global.cancelAnimationFrame = (id) => clearTimeout(id);

// import.meta.env não existe fora do Vite: injeta manualmente
import.meta.env = { VITE_API_BASE_URL: 'http://localhost:3000/v1', VITE_MERCADOPAGO_PUBLIC_KEY: '', VITE_ADMIN_PANEL_URL: 'http://localhost:5174' };

const React = await import('react');
const { createRoot } = await import('react-dom/client');
const { MemoryRouter } = await import('react-router-dom');
const { AuthProvider } = await import('./src/context/AuthContext.jsx');
const { CartProvider } = await import('./src/context/CartContext.jsx');
const { WishlistProvider } = await import('./src/context/WishlistContext.jsx');
const { AuthModalProvider } = await import('./src/context/AuthModalContext.jsx');
const { default: App } = await import('./src/App.jsx');

const errors = [];
const originalConsoleError = console.error;
console.error = (...args) => {
  errors.push(args.map(String).join(' '));
  originalConsoleError(...args);
};

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function renderRoute(path, label) {
  const container = document.getElementById('root');
  container.innerHTML = '';
  const root = createRoot(container);

  root.render(
    React.createElement(
      MemoryRouter,
      { initialEntries: [path] },
      React.createElement(AuthProvider, null, React.createElement(CartProvider, null, React.createElement(WishlistProvider, null, React.createElement(AuthModalProvider, null, React.createElement(App)))))
    )
  );

  await wait(2000); // dá tempo pros fetch() reais completarem

  const text = container.textContent.trim();
  console.log(`\n=== ${label} (${path}) ===`);
  console.log(text.includes('Blusa Oversized') ? '✓ produto encontrado no DOM' : '✗ produto NÃO encontrado no DOM');
  console.log(text.slice(0, 600));

  root.unmount();
}

await renderRoute('/', 'Home');
await renderRoute('/produtos', 'Catálogo');
await renderRoute('/produtos/blusa-oversized-basica', 'Detalhe do produto');
await renderRoute('/entrar', 'Login');
await renderRoute('/carrinho', 'Carrinho (vazio, sem login)');
await renderRoute('/rota-que-nao-existe', '404');

// --- Fluxo autenticado: registra um cliente novo direto pela API (como o
// formulário de cadastro faria), guarda o token como o AuthContext guardaria,
// adiciona um item ao carrinho e verifica se as páginas autenticadas refletem
// isso corretamente. ---
console.log('\n\n########## FLUXO AUTENTICADO ##########');

const email = `smoke-${Date.now()}@teste.com`;
const registerRes = await fetch('http://localhost:3000/v1/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Smoke Test', email, password: 'senha1234', cpf: String(Date.now()).slice(0, 11), phone: '85999999999' }),
});
console.log('registro:', registerRes.status);

const loginRes = await fetch('http://localhost:3000/v1/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password: 'senha1234' }),
});
const loginData = await loginRes.json();
console.log('login:', loginRes.status);

localStorage.setItem('bos_access_token', loginData.access_token);
localStorage.setItem('bos_refresh_token', loginData.refresh_token);
localStorage.setItem('bos_user', JSON.stringify(loginData.user));

// Busca a variante real do produto seedado para adicionar ao carrinho
const productRes = await fetch('http://localhost:3000/v1/products/blusa-oversized-basica');
const product = await productRes.json();
const variant = product.variants.find((v) => v.stockQuantity > 0);

const addItemRes = await fetch('http://localhost:3000/v1/cart/items', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${loginData.access_token}` },
  body: JSON.stringify({ variant_id: variant.id, quantity: 1 }),
});
console.log('adicionar ao carrinho:', addItemRes.status);

await renderRoute('/carrinho', 'Carrinho (autenticado, com item)');
await renderRoute('/minha-conta/enderecos', 'Endereços (autenticado)');
await renderRoute('/minha-conta/pedidos', 'Meus pedidos (autenticado)');
await renderRoute('/checkout', 'Checkout (autenticado)');

// Completa o restante do fluxo via API direta (equivalente ao que os
// formulários das etapas 1/2/3 do checkout fariam) para chegar num pedido
// pago e validar a tela de detalhe do pedido.
const addressRes = await fetch('http://localhost:3000/v1/addresses', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${loginData.access_token}` },
  body: JSON.stringify({ street: 'Rua Smoke Test', number: '42', neighborhood: 'Centro', city: 'Fortaleza', state: 'CE', zip: '60000-000', isDefault: true }),
});
const address = await addressRes.json();
console.log('\nendereço criado:', addressRes.status);

const orderRes = await fetch('http://localhost:3000/v1/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${loginData.access_token}` },
  body: JSON.stringify({ address_id: address.id, shipping_option_id: 'combinar' }),
});
const order = await orderRes.json();
console.log('pedido criado:', orderRes.status, order.orderNumber);

const pixRes = await fetch('http://localhost:3000/v1/payments/pix', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${loginData.access_token}` },
  body: JSON.stringify({ order_id: order.id }),
});
console.log('pix gerado:', pixRes.status);

await renderRoute(`/minha-conta/pedidos/${order.id}`, 'Detalhe do pedido (aguardando pagamento)');
await renderRoute('/minha-conta/pedidos', 'Meus pedidos (com 1 pedido)');

console.log('\n=== ERROS DE CONSOLE CAPTURADOS ===');
console.log(errors.length ? errors.join('\n---\n') : '(nenhum)');

process.exit(0);
