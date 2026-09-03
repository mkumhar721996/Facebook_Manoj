export function renderRegisterPage(container, { controller }) {
  container.innerHTML = `
    <h1>Register</h1>
    <form id="register-form">
      <label>Email <input id="email" type="email" autocomplete="email" /></label>
      <label>Password <input id="password" type="password" autocomplete="new-password" /></label>
      <button type="submit">Register</button>
    </form>
    <p id="error" role="alert"></p>
    <p><a href="/login" data-nav>Already have an account? Log in</a></p>
  `;

  const form = container.querySelector("#register-form");
  const errorEl = container.querySelector("#error");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorEl.textContent = "";
    const email = container.querySelector("#email").value;
    const password = container.querySelector("#password").value;
    const result = await controller.submit(email, password);
    if (!result.success) {
      errorEl.textContent = result.error;
    }
  });
}
