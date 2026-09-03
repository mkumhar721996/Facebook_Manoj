export function createAuthClient({ baseUrl, fetchImpl = fetch }) {
  async function post(path, payload) {
    const res = await fetchImpl(`${baseUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Request failed");
    }
    return data;
  }

  return {
    register(email, password) {
      return post("/auth/register", { email, password });
    },
    login(email, password) {
      return post("/auth/login", { email, password });
    },
  };
}
