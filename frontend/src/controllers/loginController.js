export function createLoginController({ authClient, authStore, navigate }) {
  return {
    async submit(email, password) {
      if (!email || !password) {
        return { success: false, error: "Email and password are required" };
      }

      let result;
      try {
        result = await authClient.login(email, password);
      } catch (err) {
        return { success: false, error: err.message };
      }

      authStore.login(result.token);
      navigate("/tasks");
      return { success: true };
    },
  };
}
