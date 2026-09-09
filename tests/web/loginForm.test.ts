import test from "node:test";
import assert from "node:assert/strict";
import { attachLoginForm } from "../../src/web/src/loginForm.js";

type FakeElement = {
  textContent: string;
  value?: string;
};

function createFakeForm() {
  const listeners: Record<string, (event: unknown) => void> = {};
  const elements = {
    email: { textContent: "", value: "" } as FakeElement,
    password: { textContent: "", value: "" } as FakeElement,
    "form-message": { textContent: "" } as FakeElement,
  };

  const form = {
    addEventListener(event: string, handler: (e: unknown) => void) {
      listeners[event] = handler;
    },
    querySelector(selector: string) {
      const selectorToKey: Record<string, keyof typeof elements> = {
        '[name="email"]': "email",
        '[name="password"]': "password",
        "[data-form-message]": "form-message",
      };
      const key = selectorToKey[selector];
      return key ? elements[key] : undefined;
    },
  };

  return { form, listeners, elements };
}

function makeSubmitEvent() {
  let defaultPrevented = false;
  return {
    event: { preventDefault: () => (defaultPrevented = true) },
    wasPrevented: () => defaultPrevented,
  };
}

// AC6 + AC7
test("submitting the login form for an unverified account surfaces the check-your-inbox message", async () => {
  const { form, listeners, elements } = createFakeForm();
  const fakeFetch = async () =>
    ({
      status: 403,
      json: async () => ({ message: "Please check your inbox for the verification link before logging in." }),
    }) as Response;

  attachLoginForm(form as unknown as HTMLFormElement, fakeFetch as unknown as typeof fetch);

  elements.email.value = "unverified@example.com";
  elements.password.value = "test-password1";

  const { event, wasPrevented } = makeSubmitEvent();
  await listeners["submit"](event);

  assert.equal(wasPrevented(), true);
  assert.match(elements["form-message"].textContent, /check your inbox/i);
});

test("submitting the login form with valid verified credentials shows the success message", async () => {
  const { form, listeners, elements } = createFakeForm();
  const fakeFetch = async () =>
    ({
      status: 200,
      json: async () => ({ message: "Logged in." }),
    }) as Response;

  attachLoginForm(form as unknown as HTMLFormElement, fakeFetch as unknown as typeof fetch);

  elements.email.value = "verified@example.com";
  elements.password.value = "test-password1";

  const { event } = makeSubmitEvent();
  await listeners["submit"](event);

  assert.equal(elements["form-message"].textContent, "Logged in.");
});
