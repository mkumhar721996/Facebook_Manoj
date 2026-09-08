import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CouponFormController } from './couponFormController.ts';
import type { CouponValidationResult } from '../../domain/coupon/couponService.ts';

test('rejects an empty input without calling the validator (AC9)', () => {
  const form = new CouponFormController();
  let called = false;
  form.setInputValue('');
  const outcome = form.apply(() => {
    called = true;
    return { valid: true, coupon: { code: 'X', discountType: 'fixed', discountValue: 1, status: 'active' }, discountAmount: 1 };
  });
  assert.equal(outcome.outcome, 'empty');
  assert.equal(form.errorMessage, 'Please enter a coupon code');
  assert.equal(called, false);
});

test('rejects a whitespace-only input without calling the validator (AC9)', () => {
  const form = new CouponFormController();
  let called = false;
  form.setInputValue('   ');
  form.apply(() => {
    called = true;
    return { valid: false, reason: 'unused' };
  });
  assert.equal(form.errorMessage, 'Please enter a coupon code');
  assert.equal(called, false);
});

test('shows the exact reason and keeps the entered text when the coupon is invalid (AC4)', () => {
  const form = new CouponFormController();
  form.setInputValue('BADCODE');
  const validate = (): CouponValidationResult => ({ valid: false, reason: 'Coupon code not recognized' });
  const outcome = form.apply(validate);
  assert.equal(outcome.outcome, 'invalid');
  assert.equal(form.errorMessage, 'Coupon code not recognized');
  assert.equal(form.inputValue, 'BADCODE');
});

test('clears any prior error when a valid coupon is applied', () => {
  const form = new CouponFormController();
  form.setInputValue('SAVE10');
  form.apply(() => ({ valid: false, reason: 'This coupon has expired' }));
  assert.ok(form.errorMessage);
  form.setInputValue('SAVE10');
  const outcome = form.apply(() => ({
    valid: true,
    coupon: { code: 'SAVE10', discountType: 'percentage', discountValue: 10, status: 'active' },
    discountAmount: 20,
  }));
  assert.equal(outcome.outcome, 'valid');
  assert.equal(form.errorMessage, null);
});
