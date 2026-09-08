import { isCancellationAvailable } from "../domain/orderStatus.js";

export const ACTIONS = {
  CANCEL_ORDER: "cancel-order",
  RESUBMIT_CANCELLATION: "resubmit-cancellation",
};

const STATUS_LABELS = {
  placed: "Order placed",
  pending: "Pending",
  accepted: "Accepted",
  preparing: "Preparing",
  picked_up: "Picked up",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

function statusLabel(status) {
  return STATUS_LABELS[status] ?? status;
}

function renderReadOnlyHistory(order) {
  const historyItems = order.history
    .map((entry) => `<li class="chip chip-neutral">${statusLabel(entry.status)}</li>`)
    .join("");

  const html = `
    <section class="card" data-view="order-history" aria-label="Order history">
      <div class="card-header">
        <p class="chip chip-success" role="status">Cancellation confirmed. Your order has been cancelled.</p>
      </div>
      <div class="card-body">
        <ul class="u-stack u-gap-2">${historyItems}</ul>
      </div>
    </section>
  `;

  return {
    html,
    isReadOnly: true,
    dispatch: () => false,
  };
}

function renderLiveTracking(order, lastOutcome, onCancelRequested) {
  const canCancel = isCancellationAvailable(order.status);
  const showResubmit = lastOutcome === "timed_out";

  const failureMessage = showResubmit
    ? `<p class="chip chip-danger" role="alert">We couldn't confirm your cancellation in time. Your request was not completed.</p>`
    : "";

  const cancelButton = canCancel
    ? `<button type="button" class="btn btn-danger" data-action="${ACTIONS.CANCEL_ORDER}">Cancel order</button>`
    : "";

  const resubmitButton = showResubmit
    ? `<button type="button" class="btn btn-outline" data-action="${ACTIONS.RESUBMIT_CANCELLATION}">Try cancelling again</button>`
    : "";

  const html = `
    <section class="card" data-view="live-tracking" aria-label="Order tracking">
      <div class="card-header">
        <p class="chip chip-neutral">${statusLabel(order.status)}</p>
      </div>
      <div class="card-body u-stack u-gap-3">
        ${failureMessage}
        <div class="u-row u-gap-2">
          ${cancelButton}
          ${resubmitButton}
        </div>
      </div>
    </section>
  `;

  return {
    html,
    isReadOnly: false,
    dispatch(actionId) {
      if (actionId === ACTIONS.CANCEL_ORDER && canCancel) {
        onCancelRequested();
        return true;
      }
      if (actionId === ACTIONS.RESUBMIT_CANCELLATION && showResubmit) {
        onCancelRequested();
        return true;
      }
      return false;
    },
  };
}

export function renderTrackingScreen({ order, lastOutcome, onCancelRequested }) {
  if (order.status === "cancelled") {
    return renderReadOnlyHistory(order);
  }
  return renderLiveTracking(order, lastOutcome, onCancelRequested);
}
