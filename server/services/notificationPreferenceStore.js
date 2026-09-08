const VALID_CHANNELS = new Set(["push", "sms", "both"]);
const DEFAULT_CHANNEL = "push";

function createNotificationPreferenceStore() {
  const preferencesByCustomerId = new Map();

  return {
    getPreference(customerId) {
      return preferencesByCustomerId.get(customerId) ?? DEFAULT_CHANNEL;
    },
    setPreference(customerId, channel) {
      if (!VALID_CHANNELS.has(channel)) {
        throw new Error(`Unsupported notification channel: ${channel}`);
      }
      preferencesByCustomerId.set(customerId, channel);
    },
  };
}

module.exports = {
  createNotificationPreferenceStore,
  VALID_CHANNELS,
  DEFAULT_CHANNEL,
};
