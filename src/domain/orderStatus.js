export const CANCELLABLE_STATUSES = ["placed", "pending", "accepted", "preparing"];

export function isCancellationAvailable(status) {
  return CANCELLABLE_STATUSES.includes(status);
}
