export function canActivate(authStore) {
  return authStore.isAuthenticated();
}

export function guardTasksRoute({ authStore, navigate }) {
  if (!canActivate(authStore)) {
    navigate("/login");
    return false;
  }
  return true;
}
