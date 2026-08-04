const couponService = require('../services/coupon.service');

describe('couponService.calculateDiscount', () => {
  it('calcula desconto percentual corretamente', () => {
    const coupon = { discountType: 'percentage', discountValue: 10 };
    expect(couponService.calculateDiscount(coupon, 200)).toBe(20);
  });

  it('calcula desconto fixo corretamente', () => {
    const coupon = { discountType: 'fixed', discountValue: 15 };
    expect(couponService.calculateDiscount(coupon, 200)).toBe(15);
  });

  it('não permite desconto fixo maior que o subtotal (CT-12 correlato)', () => {
    const coupon = { discountType: 'fixed', discountValue: 500 };
    expect(couponService.calculateDiscount(coupon, 200)).toBe(200);
  });
});
