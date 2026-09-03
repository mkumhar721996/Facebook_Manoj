import { isEmailValid, isPasswordValid } from "../validation.js";

export function createRegisterController({ authClient, navigate }) {
  return {
    async submit(email, password) {
      if (!email) {
        return { success: false, error: "Email is required" };
      }
      if (!isEmailValid(email)) {
        return { success: false, error: "Email must be a valid email address" };
      }
      if (!password) {
        return { success: false, error: "Password is required" };
      }
      if (!isPasswordValid(password)) {
        return {
          success: false,
          error: "Password must be at least 8 characters long and include a letter and a digit",
        };
      }

      try {
        await authClient.register(email, password);
      } catch (err) {
        return { success: false, error: err.message };
      }

      navigate("/tasks");
      return { success: true };
    },
  };
}
