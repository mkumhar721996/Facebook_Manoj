import { validateSignup } from "../../shared/validation.js";

/**
 * @param {HTMLFormElement} form
 * @param {typeof fetch} fetchImpl
 */
export function attachSignupForm(form, fetchImpl) {
  const emailInput = /** @type {HTMLInputElement} */ (form.querySelector('[name="email"]'));
  const passwordInput = /** @type {HTMLInputElement} */ (form.querySelector('[name="password"]'));
  const emailError = form.querySelector('[data-error-for="email"]');
  const passwordError = form.querySelector('[data-error-for="password"]');
  const formMessage = form.querySelector("[data-form-message]");

  function setError(el, message) {
    if (!el) return;
    el.textContent = message;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    setError(emailError, "");
    setError(passwordError, "");
    setError(formMessage, "");

    const email = emailInput.value ?? "";
    const password = passwordInput.value ?? "";

    const validation = validateSignup({ email, password });
    if (!validation.valid) {
      setError(emailError, validation.errors.email ?? "");
      setError(passwordError, validation.errors.password ?? "");
      return;
    }

    const response = await fetchImpl("/api/signup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const body = await response.json();

    if (response.status === 409) {
      setError(formMessage, body.message);
      return;
    }

    setError(formMessage, body.message);
  });
}
