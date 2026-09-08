import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CouponRepository } from './couponRepository.ts';

test('finds the seeded active SAVE10 coupon by exact code', () => {
  const repo = new CouponRepository();
  const coupon = repo.findByCode('SAVE10');
  assert.ok(coupon);
  assert.equal(coupon?.status, 'active');
});

test('finds a coupon case-insensitively', () => {
  const repo = new CouponRepository();
  const coupon = repo.findByCode('save10');
  assert.ok(coupon);
  assert.equal(coupon?.code, 'SAVE10');
});

test('returns undefined for a code that does not exist', () => {
  const repo = new CouponRepository();
  assert.equal(repo.findByCode('NOTREAL'), undefined);
});

test('seeds an expired coupon fixture', () => {
  const repo = new CouponRepository();
  const coupon = repo.findByCode('EXPIRED10');
  assert.ok(coupon);
  assert.equal(coupon?.status, 'expired');
});

test('seeds a usage-exhausted coupon fixture', () => {
  const repo = new CouponRepository();
  const coupon = repo.findByCode('USEDUP10');
  assert.ok(coupon);
  assert.equal(coupon?.status, 'exhausted');
});

test('seeds an inactive/ineligible coupon fixture', () => {
  const repo = new CouponRepository();
  const coupon = repo.findByCode('INACTIVE10');
  assert.ok(coupon);
  assert.equal(coupon?.status, 'inactive');
});
