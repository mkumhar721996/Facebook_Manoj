import { test } from "node:test";
import assert from "node:assert/strict";
import { createOrder } from "../../src/domain/order.js";
import { CancellationRequest, CANCELLATION_TIMEOUT_MS } from "../../src/domain/cancellationRequest.js";

test("confirming before the 30s window resolves the request as confirmed", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const order = createOrder({ id: "order-1", status: "preparing" });
  const request = new CancellationRequest(order);

  request.submit();
  t.mock.timers.tick(CANCELLATION_TIMEOUT_MS - 1);
  request.confirm();

  assert.equal(request.status, "confirmed");
});

test("confirming before timeout transitions the order to the cancelled terminal state", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const order = createOrder({ id: "order-2", status: "accepted" });
  const request = new CancellationRequest(order);

  request.submit();
  t.mock.timers.tick(1000);
  request.confirm();

  assert.equal(order.status, "cancelled");
  assert.equal(order.history.at(-1).status, "cancelled");
});

test("no confirmation within 30s auto-resolves the request as timed_out and leaves the order unchanged", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const order = createOrder({ id: "order-3", status: "placed" });
  const request = new CancellationRequest(order);

  request.submit();
  t.mock.timers.tick(CANCELLATION_TIMEOUT_MS);

  assert.equal(request.status, "timed_out");
  assert.equal(order.status, "placed");
});

test("confirming after the timeout has already fired has no effect", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const order = createOrder({ id: "order-4", status: "placed" });
  const request = new CancellationRequest(order);

  request.submit();
  t.mock.timers.tick(CANCELLATION_TIMEOUT_MS);
  request.confirm();

  assert.equal(request.status, "timed_out");
  assert.equal(order.status, "placed");
});
