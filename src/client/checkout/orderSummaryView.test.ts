import { test } from 'node:test';
import assert from 'node:assert/strict';
import { OrderSummary } from '../../domain/order/orderSummary.ts';
import { toOrderSummaryViewModel } from './orderSummaryView.ts';

test('shows no discount line and the subtotal as the total when no coupon is applied', () => {
  const summary = new OrderSummary(200);
  const view = toOrderSummaryViewModel(summary);
  assert.equal(view.discountLine, null);
  assert.equal(view.totalLabel, '$200.00');
});

test('shows the discount amount in the summary immediately after applying a valid coupon (AC1, AC2)', () => {
  const summary = new OrderSummary(200);
  summary.applyCoupon({ code: 'SAVE10', discountType: 'percentage', discountValue: 10, status: 'active' }, 20);
  const view = toOrderSummaryViewModel(summary);
  assert.ok(view.discountLine);
  assert.equal(view.discountLine?.amountLabel, '-$20.00');
  assert.equal(view.totalLabel, '$180.00');
});

test('removes the discount line and reverts the total after removing the coupon (AC6, AC7)', () => {
  const summary = new OrderSummary(200);
  summary.applyCoupon({ code: 'SAVE10', discountType: 'percentage', discountValue: 10, status: 'active' }, 20);
  summary.removeCoupon();
  const view = toOrderSummaryViewModel(summary);
  assert.equal(view.discountLine, null);
  assert.equal(view.totalLabel, '$200.00');
});
