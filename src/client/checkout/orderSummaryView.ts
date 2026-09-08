import type { OrderSummary } from '../../domain/order/orderSummary.ts';

export interface DiscountLineViewModel {
  label: string;
  amountLabel: string;
}

export interface OrderSummaryViewModel {
  subtotalLabel: string;
  discountLine: DiscountLineViewModel | null;
  totalLabel: string;
}

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function toOrderSummaryViewModel(summary: OrderSummary): OrderSummaryViewModel {
  return {
    subtotalLabel: formatCurrency(summary.subtotal),
    discountLine: summary.appliedCoupon
      ? { label: `Discount (${summary.appliedCoupon.code})`, amountLabel: `-${formatCurrency(summary.discountAmount)}` }
      : null,
    totalLabel: formatCurrency(summary.total),
  };
}
