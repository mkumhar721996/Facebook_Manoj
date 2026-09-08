const CHANNEL_OPTIONS = [
  { id: "push", label: "Push notification" },
  { id: "sms", label: "SMS" },
  { id: "both", label: "Push and SMS" },
];

const VALID_CHANNEL_IDS = new Set(CHANNEL_OPTIONS.map((option) => option.id));

function createInitialState() {
  return { selectedChannel: null, status: "loading" };
}

function applyLoadedPreference(state, channel) {
  return { ...state, selectedChannel: channel, status: "loaded" };
}

function selectChannel(state, channelId) {
  if (!VALID_CHANNEL_IDS.has(channelId)) {
    throw new Error(`Unsupported notification channel: ${channelId}`);
  }
  return { ...state, selectedChannel: channelId };
}

const preferencesLogic = {
  CHANNEL_OPTIONS,
  createInitialState,
  applyLoadedPreference,
  selectChannel,
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = preferencesLogic;
} else {
  window.preferencesLogic = preferencesLogic;
}
