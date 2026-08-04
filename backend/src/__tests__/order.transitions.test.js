const { assertValidTransition } = require('../services/order.service');

// CT-31 (correlato): transições de status do pedido devem seguir a máquina de
// estados definida no documento de Arquitetura (seção 5).
describe('assertValidTransition', () => {
  it('permite aguardando_pagamento -> pago', () => {
    expect(() => assertValidTransition('aguardando_pagamento', 'pago')).not.toThrow();
  });

  it('permite aguardando_pagamento -> cancelado', () => {
    expect(() => assertValidTransition('aguardando_pagamento', 'cancelado')).not.toThrow();
  });

  it('permite pago -> em_separacao -> enviado -> entregue', () => {
    expect(() => assertValidTransition('pago', 'em_separacao')).not.toThrow();
    expect(() => assertValidTransition('em_separacao', 'enviado')).not.toThrow();
    expect(() => assertValidTransition('enviado', 'entregue')).not.toThrow();
  });

  it('rejeita pular etapas: aguardando_pagamento -> enviado', () => {
    expect(() => assertValidTransition('aguardando_pagamento', 'enviado')).toThrow(/Transição de status inválida/);
  });

  it('rejeita transição a partir de estado final: entregue -> cancelado', () => {
    expect(() => assertValidTransition('entregue', 'cancelado')).toThrow();
  });

  it('permite cancelado -> reembolsado', () => {
    expect(() => assertValidTransition('cancelado', 'reembolsado')).not.toThrow();
  });
});
