import { transitionOrderStatus } from "./order.js";

export const CANCELLATION_TIMEOUT_MS = 30_000;

export class CancellationRequest {
  constructor(order) {
    this.order = order;
    this.status = "pending";
    this._timeoutHandle = null;
  }

  submit() {
    this.status = "pending";
    this._timeoutHandle = setTimeout(() => {
      this._timeoutHandle = null;
      if (this.status === "pending") {
        this.status = "timed_out";
      }
    }, CANCELLATION_TIMEOUT_MS);
  }

  confirm() {
    if (this.status !== "pending") {
      return;
    }
    clearTimeout(this._timeoutHandle);
    this._timeoutHandle = null;
    this.status = "confirmed";
    transitionOrderStatus(this.order, "cancelled");
  }
}
