import type { OrderSummary } from '../../domain/order/orderSummary.ts';
import type { CouponService } from '../../domain/coupon/couponService.ts';
import { CouponFormController } from './couponFormController.ts';

export class CheckoutPageController {
  readonly summary: OrderSummary;
  readonly form: CouponFormController;
  private readonly couponService: CouponService;

  constructor(summary: OrderSummary, couponService: CouponService) {
    this.summary = summary;
    this.couponService = couponService;
    this.form = new CouponFormController();
  }

  applyCoupon(): void {
    const outcome = this.form.apply((code) => this.couponService.validate(code, this.summary.subtotal));
    if (outcome.outcome === 'valid') {
      this.summary.applyCoupon(outcome.coupon, outcome.discountAmount);
    }
  }

  removeCoupon(): void {
    this.summary.removeCoupon();
    this.form.clear();
  }

  get canPlaceOrder(): boolean {
    return this.form.errorMessage === null;
  }
}
