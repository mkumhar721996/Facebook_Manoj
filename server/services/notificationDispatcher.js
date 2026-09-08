const defaultPushSender = require("../channels/pushSender");
const defaultSmsSender = require("../channels/smsSender");

const SENDERS_BY_CHANNEL = {
  push: (senders) => [senders.pushSender],
  sms: (senders) => [senders.smsSender],
  both: (senders) => [senders.pushSender, senders.smsSender],
};

function createNotificationDispatcher({
  preferenceStore,
  pushSender = defaultPushSender,
  smsSender = defaultSmsSender,
}) {
  const senders = { pushSender, smsSender };

  return {
    dispatchOrderStatusNotification(customerId, event) {
      const channel = preferenceStore.getPreference(customerId);
      const resolveSenders = SENDERS_BY_CHANNEL[channel];
      for (const sender of resolveSenders(senders)) {
        sender.send(customerId, event);
      }
    },
  };
}

module.exports = { createNotificationDispatcher };
