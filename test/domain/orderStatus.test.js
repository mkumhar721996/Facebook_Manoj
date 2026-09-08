import { test } from "node:test";
import assert from "node:assert/strict";
import { isCancellationAvailable } from "../../src/domain/orderStatus.js";

test("isCancellationAvailable is true for placed, pending, accepted, preparing", () => {
  for (const status of ["placed", "pending", "accepted", "preparing"]) {
    assert.equal(isCancellationAvailable(status), true, `expected ${status} to allow cancellation`);
  }
});

test("isCancellationAvailable is false for picked_up and delivered", () => {
  for (const status of ["picked_up", "delivered"]) {
    assert.equal(isCancellationAvailable(status), false, `expected ${status} to not allow cancellation`);
  }
});

test("isCancellationAvailable is false for cancelled", () => {
  assert.equal(isCancellationAvailable("cancelled"), false);
});
