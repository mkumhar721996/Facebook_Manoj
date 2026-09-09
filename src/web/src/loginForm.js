/**
 * @param {HTMLFormElement} form
 * @param {typeof fetch} fetchImpl
 */
export function attachLoginForm(form, fetchImpl) {
  const emailInput = /** @type {HTMLInputElement} */ (form.querySelector('[name="email"]'));
  const passwordInput = /** @type {HTMLInputElement} */ (form.querySelector('[name="password"]'));
  const formMessage = form.querySelector("[data-form-message]");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = emailInput.value ?? "";
    const password = passwordInput.value ?? "";

    const response = await fetchImpl("/api/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const body = await response.json();

    if (formMessage) {
      formMessage.textContent = body.message;
    }

    if (response.status === 200 && typeof window !== "undefined") {
      window.location.href = "/";
    }
  });
}
