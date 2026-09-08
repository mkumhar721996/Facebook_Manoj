(function () {
  const { CHANNEL_OPTIONS, createInitialState, applyLoadedPreference, selectChannel } =
    window.preferencesLogic;

  function getCustomerId() {
    return new URLSearchParams(window.location.search).get("customerId") || "demo-customer";
  }

  function preferenceUrl(customerId) {
    return `/api/customers/${encodeURIComponent(customerId)}/notification-preference`;
  }

  function renderSelection(state) {
    for (const option of CHANNEL_OPTIONS) {
      const input = document.getElementById(`channel-${option.id}`);
      input.checked = state.selectedChannel === option.id;
    }
  }

  function setStatus(message) {
    document.getElementById("preference-status").textContent = message;
  }

  async function loadPreference(customerId) {
    const response = await fetch(preferenceUrl(customerId));
    const body = await response.json();
    return body.channel;
  }

  async function savePreference(customerId, channel) {
    await fetch(preferenceUrl(customerId), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel }),
    });
  }

  async function init() {
    const customerId = getCustomerId();
    let state = createInitialState();

    const channel = await loadPreference(customerId);
    state = applyLoadedPreference(state, channel);
    renderSelection(state);

    for (const option of CHANNEL_OPTIONS) {
      document.getElementById(`channel-${option.id}`).addEventListener("change", () => {
        state = selectChannel(state, option.id);
      });
    }

    document.getElementById("notification-preferences-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      await savePreference(customerId, state.selectedChannel);
      setStatus("Preference saved.");
    });
  }

  init();
})();
