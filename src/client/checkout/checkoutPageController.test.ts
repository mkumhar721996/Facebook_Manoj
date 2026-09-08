import { test } from 'node:test';
import assert from 'node:assert/strict';
import { OrderSummary } from '../../domain/order/orderSummary.ts';
import { CouponRepository } from '../../domain/coupon/couponRepository.ts';
import { CouponService } from '../../domain/coupon/couponService.ts';
import { CheckoutPageController } from './checkoutPageController.ts';

function buildController(subtotal = 200): CheckoutPageController {
  const summary = new OrderSummary(subtotal);
  const couponService = new CouponService(new CouponRepository());
  return new CheckoutPageController(summary, couponService);
}

test('Place Order is enabled with no coupon applied', () => {
  const controller = buildController();
  assert.equal(controller.canPlaceOrder, true);
});

test('Place Order is disabled once an invalid coupon error is shown (AC5)', () => {
  const controller = buildController();
  controller.form.setInputValue('NOTREAL');
  controller.applyCoupon();
  assert.equal(controller.canPlaceOrder, false);
});

test('Place Order re-enables after clearing the invalid code (AC5)', () => {
  const controller = buildController();
  controller.form.setInputValue('NOTREAL');
  controller.applyCoupon();
  assert.equal(controller.canPlaceOrder, false);
  controller.form.setInputValue('');
  assert.equal(controller.canPlaceOrder, true);
});

test('Place Order re-enables after applying a different, valid code (AC5)', () => {
  const controller = buildController();
  controller.form.setInputValue('NOTREAL');
  controller.applyCoupon();
  assert.equal(controller.canPlaceOrder, false);
  controller.form.setInputValue('SAVE10');
  controller.applyCoupon();
  assert.equal(controller.canPlaceOrder, true);
});

test('Place Order re-enables after removing the previously invalid attempt (AC5)', () => {
  const controller = buildController();
  controller.form.setInputValue('NOTREAL');
  controller.applyCoupon();
  assert.equal(controller.canPlaceOrder, false);
  controller.removeCoupon();
  assert.equal(controller.canPlaceOrder, true);
});

test('applying a new valid coupon replaces the previously applied one (AC11)', () => {
  const controller = buildController();
  controller.form.setInputValue('SAVE10');
  controller.applyCoupon();
  assert.equal(controller.summary.appliedCoupon?.code, 'SAVE10');
  controller.form.setInputValue('WELCOME5');
  controller.applyCoupon();
  assert.equal(controller.summary.appliedCoupon?.code, 'WELCOME5');
  assert.equal(controller.summary.discountAmount, 5);
});

test('accepts a valid coupon code case-insensitively end-to-end (AC10)', () => {
  const controller = buildController();
  controller.form.setInputValue('save10');
  controller.applyCoupon();
  assert.equal(controller.summary.appliedCoupon?.code, 'SAVE10');
  assert.equal(controller.canPlaceOrder, true);
});
