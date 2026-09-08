import { test } from "node:test";
import assert from "node:assert/strict";
import { createOrder } from "../../src/domain/order.js";
import { transitionOrderStatus } from "../../src/domain/order.js";
import { renderTrackingScreen, ACTIONS } from "../../src/ui/trackingScreen.js";

function noop() {}

test("AC1: a cancel action is visible and actionable for each pre-pickup status", () => {
  for (const status of ["placed", "pending", "accepted", "preparing"]) {
    const order = createOrder({ id: "o1", status });
    let called = false;
    const view = renderTrackingScreen({ order, onCancelRequested: () => (called = true) });

    assert.match(view.html, new RegExp(`data-action="${ACTIONS.CANCEL_ORDER}"`));
    assert.doesNotMatch(view.html, /data-action="cancel-order"[^>]*disabled/);

    const dispatched = view.dispatch(ACTIONS.CANCEL_ORDER);
    assert.equal(dispatched, true);
    assert.equal(called, true, `expected cancel action to be actionable for ${status}`);
  }
});

test("AC2: no cancellation option is presented for picked_up or delivered orders", () => {
  for (const status of ["picked_up", "delivered"]) {
    const order = createOrder({ id: "o2", status });
    const view = renderTrackingScreen({ order, onCancelRequested: noop });

    assert.doesNotMatch(view.html, new RegExp(`data-action="${ACTIONS.CANCEL_ORDER}"`));
    assert.equal(view.dispatch(ACTIONS.CANCEL_ORDER), false);
  }
});

test("AC3 & AC8: once cancellation is confirmed, a success message and read-only history view are shown", () => {
  const order = createOrder({ id: "o3", status: "preparing" });
  transitionOrderStatus(order, "cancelled");

  const view = renderTrackingScreen({ order, onCancelRequested: noop });

  assert.equal(view.isReadOnly, true);
  assert.match(view.html, /cancel(l?)ed/i);
  assert.match(view.html, /confirm/i);
  assert.doesNotMatch(view.html, new RegExp(`data-action="${ACTIONS.CANCEL_ORDER}"`));
  assert.doesNotMatch(view.html, new RegExp(`data-action="${ACTIONS.RESUBMIT_CANCELLATION}"`));
  assert.equal(view.dispatch(ACTIONS.CANCEL_ORDER), false);
});

test("AC6 & AC7: a timed-out request shows a failure message with an actionable resubmit control", () => {
  const order = createOrder({ id: "o4", status: "placed" });
  let resubmitted = false;
  const view = renderTrackingScreen({
    order,
    lastOutcome: "timed_out",
    onCancelRequested: () => (resubmitted = true),
  });

  assert.match(view.html, /(couldn't|failed|unable)/i);
  assert.match(view.html, new RegExp(`data-action="${ACTIONS.RESUBMIT_CANCELLATION}"`));

  const dispatched = view.dispatch(ACTIONS.RESUBMIT_CANCELLATION);
  assert.equal(dispatched, true);
  assert.equal(resubmitted, true);
});
