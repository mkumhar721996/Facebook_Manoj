import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CouponRepository } from './couponRepository.ts';
import { CouponService } from './couponService.ts';

function buildService(): CouponService {
  return new CouponService(new CouponRepository());
}

test('validates a valid coupon and returns its discount', () => {
  const service = buildService();
  const result = service.validate('SAVE10', 200);
  assert.equal(result.valid, true);
  if (result.valid) {
    assert.equal(result.coupon.code, 'SAVE10');
    assert.equal(result.discountAmount, 20);
  }
});

test('accepts a valid coupon code regardless of input case (AC10)', () => {
  const service = buildService();
  const upper = service.validate('SAVE10', 200);
  const lower = service.validate('save10', 200);
  assert.equal(lower.valid, true);
  assert.equal(upper.valid, true);
  if (upper.valid && lower.valid) {
    assert.equal(lower.discountAmount, upper.discountAmount);
  }
});

test('rejects an expired coupon with a specific reason (AC3)', () => {
  const service = buildService();
  const result = service.validate('EXPIRED10', 200);
  assert.equal(result.valid, false);
  if (!result.valid) {
    assert.equal(result.reason, 'This coupon has expired');
  }
});

test('rejects a usage-exhausted coupon with a distinct reason (AC3)', () => {
  const service = buildService();
  const result = service.validate('USEDUP10', 200);
  assert.equal(result.valid, false);
  if (!result.valid) {
    assert.equal(result.reason, 'This coupon is no longer available');
  }
});

test('rejects an inactive/ineligible coupon with a distinct reason (AC3)', () => {
  const service = buildService();
  const result = service.validate('INACTIVE10', 200);
  assert.equal(result.valid, false);
  if (!result.valid) {
    assert.equal(result.reason, 'This coupon is not eligible for this order');
  }
});

test('rejects a non-existent coupon code (AC8)', () => {
  const service = buildService();
  const result = service.validate('NOTREAL', 200);
  assert.equal(result.valid, false);
  if (!result.valid) {
    assert.equal(result.reason, 'Coupon code not recognized');
  }
});

test('rejects an empty coupon code (AC9)', () => {
  const service = buildService();
  const result = service.validate('', 200);
  assert.equal(result.valid, false);
  if (!result.valid) {
    assert.equal(result.reason, 'Please enter a coupon code');
  }
});

test('rejects a whitespace-only coupon code (AC9)', () => {
  const service = buildService();
  const result = service.validate('   ', 200);
  assert.equal(result.valid, false);
  if (!result.valid) {
    assert.equal(result.reason, 'Please enter a coupon code');
  }
});
