import { createAuthClient } from "./api/authClient.js";
import { createAuthStore } from "./state/authStore.js";
import { createRegisterController } from "./controllers/registerController.js";
import { createLoginController } from "./controllers/loginController.js";
import { logout } from "./controllers/logoutController.js";
import { guardTasksRoute } from "./routes/protectedRoute.js";
import { renderRegisterPage } from "./pages/registerPage.js";
import { renderLoginPage } from "./pages/loginPage.js";
import { renderTaskListPage } from "./pages/taskListPage.js";
import { BACKEND_BASE_URL } from "/config.js";

const authStore = createAuthStore();
const authClient = createAuthClient({ baseUrl: BACKEND_BASE_URL });

function navigate(path) {
  window.history.pushState({}, "", path);
  render();
}

function render() {
  const app = document.getElementById("app");
  const path = window.location.pathname;

  if (path === "/register") {
    renderRegisterPage(app, { controller: createRegisterController({ authClient, navigate }) });
    return;
  }

  if (path === "/tasks") {
    if (!guardTasksRoute({ authStore, navigate })) return;
    renderTaskListPage(app, { onLogout: () => logout({ authStore, navigate }) });
    return;
  }

  renderLoginPage(app, { controller: createLoginController({ authClient, authStore, navigate }) });
}

document.addEventListener("click", (event) => {
  const link = event.target.closest("a[data-nav]");
  if (!link) return;
  event.preventDefault();
  navigate(link.getAttribute("href"));
});

window.addEventListener("popstate", render);
render();
