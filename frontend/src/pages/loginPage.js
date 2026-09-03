export function renderLoginPage(container, { controller }) {
  container.innerHTML = `
    <h1>Log in</h1>
    <form id="login-form">
      <label>Email <input id="email" type="email" autocomplete="email" /></label>
      <label>Password <input id="password" type="password" autocomplete="current-password" /></label>
      <button type="submit">Log in</button>
    </form>
    <p id="error" role="alert"></p>
    <p><a href="/register" data-nav>Need an account? Register</a></p>
  `;

  const form = container.querySelector("#login-form");
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
