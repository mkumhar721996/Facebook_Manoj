import test from "node:test";
import assert from "node:assert/strict";
import { attachSignupForm } from "../../src/web/src/signupForm.js";

type FakeElement = {
  textContent: string;
  className: string;
  value?: string;
};

function createFakeInput(): FakeElement {
  return { textContent: "", className: "", value: "" };
}

function createFakeErrorSpan(): FakeElement {
  return { textContent: "", className: "" };
}

function createFakeForm() {
  const listeners: Record<string, (event: unknown) => void> = {};
  const elements = {
    email: createFakeInput(),
    password: createFakeInput(),
    "email-error": createFakeErrorSpan(),
    "password-error": createFakeErrorSpan(),
    "form-message": createFakeErrorSpan(),
  };

  const form = {
    addEventListener(event: string, handler: (e: unknown) => void) {
      listeners[event] = handler;
    },
    querySelector(selector: string) {
      const selectorToKey: Record<string, keyof typeof elements> = {
        '[name="email"]': "email",
        '[name="password"]': "password",
        '[data-error-for="email"]': "email-error",
        '[data-error-for="password"]': "password-error",
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
    event: {
      preventDefault() {
        defaultPrevented = true;
      },
    },
    wasPrevented: () => defaultPrevented,
  };
}

// AC8 + AC9
test("submitting the signup form with an invalid email and short password shows inline errors and blocks submission", async () => {
  const { form, listeners, elements } = createFakeForm();
  let fetchCalled = false;
  const fakeFetch = async () => {
    fetchCalled = true;
    return { ok: true, status: 201, json: async () => ({ message: "" }) } as Response;
  };

  attachSignupForm(form as unknown as HTMLFormElement, fakeFetch as unknown as typeof fetch);

  elements.email.value = "not-an-email";
  elements.password.value = "short";

  const { event, wasPrevented } = makeSubmitEvent();
  await listeners["submit"](event);

  assert.equal(wasPrevented(), true);
  assert.equal(fetchCalled, false);
  assert.ok(elements["email-error"].textContent.length > 0);
  assert.ok(elements["password-error"].textContent.length > 0);
});

test("submitting the signup form with valid input calls fetch and clears previous errors", async () => {
  const { form, listeners, elements } = createFakeForm();
  elements["email-error"].textContent = "old error";
  let fetchCalled = false;
  const fakeFetch = async () => {
    fetchCalled = true;
    return { ok: true, status: 201, json: async () => ({ message: "Account created." }) } as Response;
  };

  attachSignupForm(form as unknown as HTMLFormElement, fakeFetch as unknown as typeof fetch);

  elements.email.value = "user@example.com";
  elements.password.value = "test-password1";

  const { event, wasPrevented } = makeSubmitEvent();
  await listeners["submit"](event);

  assert.equal(wasPrevented(), true);
  assert.equal(fetchCalled, true);
  assert.equal(elements["email-error"].textContent, "");
});
