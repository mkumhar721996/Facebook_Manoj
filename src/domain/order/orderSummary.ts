import type { Coupon } from '../coupon/coupon.ts';

export class OrderSummary {
  readonly subtotal: number;
  appliedCoupon: Coupon | undefined;
  discountAmount: number;

  constructor(subtotal: number) {
    this.subtotal = subtotal;
    this.appliedCoupon = undefined;
    this.discountAmount = 0;
  }

  get total(): number {
    return this.subtotal - this.discountAmount;
  }

  applyCoupon(coupon: Coupon, discountAmount: number): void {
    this.appliedCoupon = coupon;
    this.discountAmount = discountAmount;
  }

  removeCoupon(): void {
    this.appliedCoupon = undefined;
    this.discountAmount = 0;
  }
}
