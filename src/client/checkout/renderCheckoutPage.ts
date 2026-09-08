interface CheckoutSummaryResponse {
  subtotal: number;
  discountAmount: number;
  total: number;
  appliedCouponCode: string | null;
}

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

function render(root: HTMLElement, summary: CheckoutSummaryResponse, errorMessage: string | null, inputValue: string): void {
  root.innerHTML = '';

  const subtotalLine = document.createElement('p');
  subtotalLine.textContent = `Subtotal: ${formatCurrency(summary.subtotal)}`;
  root.appendChild(subtotalLine);

  if (summary.appliedCouponCode) {
    const discountLine = document.createElement('p');
    discountLine.textContent = `Discount (${summary.appliedCouponCode}): -${formatCurrency(summary.discountAmount)}`;
    root.appendChild(discountLine);
  }

  const totalLine = document.createElement('p');
  totalLine.textContent = `Total: ${formatCurrency(summary.total)}`;
  root.appendChild(totalLine);

  const input = document.createElement('input');
  input.value = inputValue;
  input.setAttribute('aria-label', 'Coupon code');
  root.appendChild(input);

  const applyButton = document.createElement('button');
  applyButton.textContent = 'Apply';
  root.appendChild(applyButton);

  const removeButton = document.createElement('button');
  removeButton.textContent = 'Remove coupon';
  removeButton.disabled = !summary.appliedCouponCode;
  root.appendChild(removeButton);

  if (errorMessage) {
    const errorLine = document.createElement('p');
    errorLine.setAttribute('role', 'alert');
    errorLine.textContent = errorMessage;
    root.appendChild(errorLine);
  }

  const placeOrderButton = document.createElement('button');
  placeOrderButton.textContent = 'Place Order';
  placeOrderButton.disabled = errorMessage !== null;
  root.appendChild(placeOrderButton);

  applyButton.addEventListener('click', async () => {
    const code = input.value;
    const response = await fetch('/api/checkout/coupon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    const body = await response.json();
    if (response.ok) {
      render(root, body.summary as CheckoutSummaryResponse, null, code);
    } else {
      render(root, summary, body.error as string, code);
    }
  });

  removeButton.addEventListener('click', async () => {
    const response = await fetch('/api/checkout/coupon', { method: 'DELETE' });
    const body = await response.json();
    render(root, body.summary as CheckoutSummaryResponse, null, '');
  });
}

export function mountCheckoutPage(root: HTMLElement, initialSummary: CheckoutSummaryResponse): void {
  render(root, initialSummary, null, '');
}
