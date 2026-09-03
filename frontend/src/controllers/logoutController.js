export function logout({ authStore, navigate }) {
  authStore.logout();
  navigate("/login");
}
