// Stub SMS channel. Real gateway integration belongs to the parent
// Order Tracking & Notifications epic.
module.exports = {
  send(customerId, event) {
    console.log(`[sms] customer=${customerId} event=${JSON.stringify(event)}`);
  },
};
