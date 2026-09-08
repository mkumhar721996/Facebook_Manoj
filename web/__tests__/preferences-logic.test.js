const test = require("node:test");
const assert = require("node:assert/strict");
const {
  CHANNEL_OPTIONS,
  createInitialState,
  applyLoadedPreference,
  selectChannel,
} = require("../preferences-logic");

test("exposes exactly the three selectable channel options: push, sms, both (AC1)", () => {
  const ids = CHANNEL_OPTIONS.map((option) => option.id).sort();
  assert.deepEqual(ids, ["both", "push", "sms"]);
  for (const option of CHANNEL_OPTIONS) {
    assert.ok(option.label && option.label.length > 0, `${option.id} must have a descriptive label`);
  }
});

test("applyLoadedPreference sets the selected channel from a loaded preference", () => {
  const state = applyLoadedPreference(createInitialState(), "sms");
  assert.equal(state.selectedChannel, "sms");
  assert.equal(state.status, "loaded");
});

test("selecting an option updates the selected state (AC1)", () => {
  let state = applyLoadedPreference(createInitialState(), "push");

  state = selectChannel(state, "sms");
  assert.equal(state.selectedChannel, "sms");

  state = selectChannel(state, "both");
  assert.equal(state.selectedChannel, "both");
});

test("selectChannel rejects an id that is not one of the three options", () => {
  const state = createInitialState();
  assert.throws(() => selectChannel(state, "fax"));
});
