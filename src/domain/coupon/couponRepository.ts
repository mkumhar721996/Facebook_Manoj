import type { Coupon } from './coupon.ts';

const SEED_COUPONS: Coupon[] = [
  {
    code: 'SAVE10',
    discountType: 'percentage',
    discountValue: 10,
    status: 'active',
    expiresAt: new Date('2099-01-01'),
    maxUses: 100,
    usesCount: 1,
  },
  {
    code: 'EXPIRED10',
    discountType: 'percentage',
    discountValue: 10,
    status: 'expired',
    expiresAt: new Date('2020-01-01'),
    maxUses: 100,
    usesCount: 1,
  },
  {
    code: 'USEDUP10',
    discountType: 'percentage',
    discountValue: 10,
    status: 'exhausted',
    expiresAt: new Date('2099-01-01'),
    maxUses: 5,
    usesCount: 5,
  },
  {
    code: 'WELCOME5',
    discountType: 'fixed',
    discountValue: 5,
    status: 'active',
    expiresAt: new Date('2099-01-01'),
    maxUses: 100,
    usesCount: 0,
  },
  {
    code: 'INACTIVE10',
    discountType: 'percentage',
    discountValue: 10,
    status: 'inactive',
    expiresAt: new Date('2099-01-01'),
    maxUses: 100,
    usesCount: 0,
  },
];

export class CouponRepository {
  private readonly coupons: Map<string, Coupon>;

  constructor(seed: Coupon[] = SEED_COUPONS) {
    this.coupons = new Map(seed.map((coupon) => [coupon.code.toUpperCase(), coupon]));
  }

  findByCode(code: string): Coupon | undefined {
    return this.coupons.get(code.trim().toUpperCase());
  }
}
