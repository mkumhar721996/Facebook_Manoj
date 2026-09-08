import type { Coupon } from './coupon.ts';
import type { CouponRepository } from './couponRepository.ts';

export type CouponValidationResult =
  | { valid: true; coupon: Coupon; discountAmount: number }
  | { valid: false; reason: string };

function computeDiscountAmount(coupon: Coupon, subtotal: number): number {
  if (coupon.discountType === 'percentage') {
    return Math.round(((subtotal * coupon.discountValue) / 100) * 100) / 100;
  }
  return Math.min(coupon.discountValue, subtotal);
}

export class CouponService {
  private readonly repository: CouponRepository;

  constructor(repository: CouponRepository) {
    this.repository = repository;
  }

  validate(rawCode: string, subtotal: number): CouponValidationResult {
    const code = rawCode.trim();
    if (code.length === 0) {
      return { valid: false, reason: 'Please enter a coupon code' };
    }

    const coupon = this.repository.findByCode(code);
    if (!coupon) {
      return { valid: false, reason: 'Coupon code not recognized' };
    }

    switch (coupon.status) {
      case 'expired':
        return { valid: false, reason: 'This coupon has expired' };
      case 'exhausted':
        return { valid: false, reason: 'This coupon is no longer available' };
      case 'inactive':
        return { valid: false, reason: 'This coupon is not eligible for this order' };
      case 'active':
        return { valid: true, coupon, discountAmount: computeDiscountAmount(coupon, subtotal) };
    }
  }
}
