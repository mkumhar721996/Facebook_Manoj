export function createOrder({ id, status, history = [] }) {
  return {
    id,
    status,
    history: history.length > 0 ? history : [{ status, at: new Date() }],
  };
}

export function transitionOrderStatus(order, newStatus, at = new Date()) {
  order.status = newStatus;
  order.history.push({ status: newStatus, at });
  return order;
}
