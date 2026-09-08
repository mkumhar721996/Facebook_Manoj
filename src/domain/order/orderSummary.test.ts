import { test } from 'node:test';
import assert from 'node:assert/strict';
import { OrderSummary } from './orderSummary.ts';

function saveCoupon() {
  return {
    code: 'SAVE10',
    discountType: 'percentage' as const,
    discountValue: 10,
    status: 'active' as const,
  };
}

function otherCoupon() {
  return {
    code: 'FLAT5',
    discountType: 'fixed' as const,
    discountValue: 5,
    status: 'active' as const,
  };
}

test('applying a valid coupon adds a discount line with the correct amount (AC1)', () => {
  const summary = new OrderSummary(200);
  summary.applyCoupon(saveCoupon(), 20);
  assert.equal(summary.discountAmount, 20);
  assert.equal(summary.appliedCoupon?.code, 'SAVE10');
});

test('total reflects subtotal minus discount immediately after applying (AC2)', () => {
  const summary = new OrderSummary(200);
  summary.applyCoupon(saveCoupon(), 20);
  assert.equal(summary.total, 180);
});

test('removeCoupon clears the discount line (AC6)', () => {
  const summary = new OrderSummary(200);
  summary.applyCoupon(saveCoupon(), 20);
  summary.removeCoupon();
  assert.equal(summary.discountAmount, 0);
  assert.equal(summary.appliedCoupon, undefined);
});

test('removeCoupon restores the total to the pre-discount subtotal (AC7)', () => {
  const summary = new OrderSummary(200);
  summary.applyCoupon(saveCoupon(), 20);
  summary.removeCoupon();
  assert.equal(summary.total, 200);
});

test('applying a new valid coupon replaces the previously applied one (AC11)', () => {
  const summary = new OrderSummary(200);
  summary.applyCoupon(saveCoupon(), 20);
  summary.applyCoupon(otherCoupon(), 5);
  assert.equal(summary.appliedCoupon?.code, 'FLAT5');
  assert.equal(summary.discountAmount, 5);
  assert.equal(summary.total, 195);
});
