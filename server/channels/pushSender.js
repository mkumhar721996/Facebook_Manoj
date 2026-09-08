// Stub push channel. Real provider integration belongs to the parent
// Order Tracking & Notifications epic.
module.exports = {
  send(customerId, event) {
    console.log(`[push] customer=${customerId} event=${JSON.stringify(event)}`);
  },
};
