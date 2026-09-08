const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { CHANNEL_OPTIONS } = require("../preferences-logic");

const HTML_PATH = path.join(__dirname, "..", "notification-preferences.html");
const CSS_PATH = path.join(__dirname, "..", "notification-preferences.css");

const html = fs.readFileSync(HTML_PATH, "utf8");
const css = fs.readFileSync(CSS_PATH, "utf8");

// Matches raw hex (#fff, #ffffff) or rgb()/rgba() colour literals so we can
// assert the page introduces no new, unverified colours (AC4) and instead
// reuses the pre-verified tokens.css palette (see contrast_check.py).
const HARD_CODED_COLOR_PATTERN = /(#[0-9a-fA-F]{3,8}\b)|(rgba?\([^)]*\))/g;

test("the preference group is exposed as a radiogroup with a descriptive accessible name (AC4)", () => {
  assert.match(html, /role=["']radiogroup["']/);
  assert.match(html, /aria-labelledby=|aria-label=/);
});

test("every channel option has an associated, non-empty visible label (AC4)", () => {
  for (const option of CHANNEL_OPTIONS) {
    const inputIdMatch = new RegExp(
      `<input[^>]*id=["']channel-${option.id}["'][^>]*>`,
    );
    assert.match(html, inputIdMatch, `missing radio input for ${option.id}`);

    const labelMatch = new RegExp(
      `<label[^>]*for=["']channel-${option.id}["'][^>]*>([^<]*${escapeRegExp(
        option.label,
      )}[^<]*)</label>`,
    );
    assert.match(html, labelMatch, `missing descriptive label for ${option.id}`);
  }
});

test("each channel radio input declares an accessible type and name attribute", () => {
  for (const option of CHANNEL_OPTIONS) {
    const inputTagMatch = new RegExp(
      `<input[^>]*id=["']channel-${option.id}["'][^>]*>`,
    ).exec(html);
    assert.ok(inputTagMatch, `missing radio input for ${option.id}`);

    const [inputTag] = inputTagMatch;
    assert.match(inputTag, /type=["']radio["']/, `${option.id} must be type=radio`);
    assert.match(
      inputTag,
      /name=["']notification-channel["']/,
      `${option.id} must belong to the notification-channel group`,
    );
  }
});

test("the save action has a descriptive accessible name", () => {
  assert.match(html, /<button[^>]*>[^<]*Save[^<]*<\/button>/i);
});

test("the page introduces no unverified hard-coded colours; all colours reuse tokens.css var(--color-*) (AC4)", () => {
  const htmlMatches = html.match(HARD_CODED_COLOR_PATTERN) || [];
  const cssMatches = css.match(HARD_CODED_COLOR_PATTERN) || [];

  assert.deepEqual(htmlMatches, []);
  assert.deepEqual(cssMatches, []);
});

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
