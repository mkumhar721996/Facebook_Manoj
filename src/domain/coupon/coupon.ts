export type CouponStatus = 'active' | 'expired' | 'exhausted' | 'inactive';

export type DiscountType = 'percentage' | 'fixed';

export interface Coupon {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  status: CouponStatus;
  expiresAt?: Date;
  maxUses?: number;
  usesCount?: number;
}
