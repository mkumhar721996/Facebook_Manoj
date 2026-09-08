import { createServer, type Server, type IncomingMessage, type ServerResponse } from 'node:http';
import { CouponRepository } from '../../domain/coupon/couponRepository.ts';
import { CouponService } from '../../domain/coupon/couponService.ts';
import { OrderSummary } from '../../domain/order/orderSummary.ts';

interface SummaryPayload {
  subtotal: number;
  discountAmount: number;
  total: number;
  appliedCouponCode: string | null;
}

function toPayload(summary: OrderSummary): SummaryPayload {
  return {
    subtotal: summary.subtotal,
    discountAmount: summary.discountAmount,
    total: summary.total,
    appliedCouponCode: summary.appliedCoupon ? summary.appliedCoupon.code : null,
  };
}

function readBody(request: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let raw = '';
    request.on('data', (chunk) => {
      raw += chunk;
    });
    request.on('end', () => resolve(raw));
    request.on('error', reject);
  });
}

function sendJson(response: ServerResponse, status: number, body: unknown): void {
  const json = JSON.stringify(body);
  response.writeHead(status, { 'Content-Type': 'application/json' });
  response.end(json);
}

export function createCheckoutServer(subtotal: number): Server {
  const repository = new CouponRepository();
  const couponService = new CouponService(repository);
  const summary = new OrderSummary(subtotal);

  return createServer(async (request, response) => {
    if (request.url === '/api/checkout/coupon' && request.method === 'POST') {
      const raw = await readBody(request);
      let code = '';
      try {
        const parsed = JSON.parse(raw || '{}');
        code = typeof parsed.code === 'string' ? parsed.code : '';
      } catch {
        sendJson(response, 400, { error: 'Invalid request body' });
        return;
      }

      const result = couponService.validate(code, summary.subtotal);
      if (!result.valid) {
        sendJson(response, 422, { error: result.reason });
        return;
      }

      summary.applyCoupon(result.coupon, result.discountAmount);
      sendJson(response, 200, { summary: toPayload(summary) });
      return;
    }

    if (request.url === '/api/checkout/coupon' && request.method === 'DELETE') {
      summary.removeCoupon();
      sendJson(response, 200, { summary: toPayload(summary) });
      return;
    }

    sendJson(response, 404, { error: 'Not found' });
  });
}
