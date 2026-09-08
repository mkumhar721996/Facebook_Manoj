import type { Coupon } from '../../domain/coupon/coupon.ts';
import type { CouponValidationResult } from '../../domain/coupon/couponService.ts';

export type ApplyOutcome =
  | { outcome: 'empty' }
  | { outcome: 'invalid'; reason: string }
  | { outcome: 'valid'; coupon: Coupon; discountAmount: number };

export class CouponFormController {
  inputValue: string;
  errorMessage: string | null;

  constructor() {
    this.inputValue = '';
    this.errorMessage = null;
  }

  setInputValue(value: string): void {
    this.inputValue = value;
    if (value.trim().length === 0) {
      this.errorMessage = null;
    }
  }

  apply(validate: (code: string) => CouponValidationResult): ApplyOutcome {
    const trimmed = this.inputValue.trim();
    if (trimmed.length === 0) {
      this.errorMessage = 'Please enter a coupon code';
      return { outcome: 'empty' };
    }

    const result = validate(this.inputValue);
    if (!result.valid) {
      this.errorMessage = result.reason;
      return { outcome: 'invalid', reason: result.reason };
    }

    this.errorMessage = null;
    return { outcome: 'valid', coupon: result.coupon, discountAmount: result.discountAmount };
  }

  clear(): void {
    this.inputValue = '';
    this.errorMessage = null;
  }
}
