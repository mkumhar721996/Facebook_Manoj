import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCheckoutServer } from './couponRoutes.ts';

async function withServer<T>(fn: (baseUrl: string) => Promise<T>): Promise<T> {
  const server = createCheckoutServer(200);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  if (address === null || typeof address === 'string') {
    throw new Error('expected server to bind to a port');
  }
  const baseUrl = `http://127.0.0.1:${address.port}`;
  try {
    return await fn(baseUrl);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

test('POST /api/checkout/coupon applies a valid coupon and returns the updated summary (AC1, AC2)', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/checkout/coupon`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'SAVE10' }),
    });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.summary.discountAmount, 20);
    assert.equal(body.summary.total, 180);
    assert.equal(body.summary.appliedCouponCode, 'SAVE10');
  });
});

test('POST /api/checkout/coupon accepts a lowercase code (AC10)', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/checkout/coupon`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'save10' }),
    });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.summary.appliedCouponCode, 'SAVE10');
  });
});

test('POST /api/checkout/coupon rejects an unrecognized code with a 422 and reason (AC8)', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/checkout/coupon`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'NOTREAL' }),
    });
    assert.equal(response.status, 422);
    const body = await response.json();
    assert.equal(body.error, 'Coupon code not recognized');
  });
});

test('POST /api/checkout/coupon rejects an expired code with the specific reason (AC3)', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/checkout/coupon`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'EXPIRED10' }),
    });
    assert.equal(response.status, 422);
    const body = await response.json();
    assert.equal(body.error, 'This coupon has expired');
  });
});

test('DELETE /api/checkout/coupon removes the applied coupon and reverts the total (AC6, AC7)', async () => {
  await withServer(async (baseUrl) => {
    await fetch(`${baseUrl}/api/checkout/coupon`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'SAVE10' }),
    });
    const response = await fetch(`${baseUrl}/api/checkout/coupon`, { method: 'DELETE' });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.summary.discountAmount, 0);
    assert.equal(body.summary.total, 200);
    assert.equal(body.summary.appliedCouponCode, null);
  });
});

test('POST /api/checkout/coupon replaces a previously applied coupon with a new valid one (AC11)', async () => {
  await withServer(async (baseUrl) => {
    await fetch(`${baseUrl}/api/checkout/coupon`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'SAVE10' }),
    });
    const response = await fetch(`${baseUrl}/api/checkout/coupon`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'WELCOME5' }),
    });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.summary.appliedCouponCode, 'WELCOME5');
    assert.equal(body.summary.discountAmount, 5);
  });
});
