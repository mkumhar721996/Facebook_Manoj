export function renderTaskListPage(container, { onLogout }) {
  container.innerHTML = `
    <h1>Your tasks</h1>
    <p>No tasks yet.</p>
    <button id="logout-button">Log out</button>
  `;

  container.querySelector("#logout-button").addEventListener("click", onLogout);
}
