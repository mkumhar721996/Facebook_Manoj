const STORAGE_KEY = "auth_token";

export function createMemoryStorage() {
  const map = new Map();
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, value),
    removeItem: (key) => map.delete(key),
  };
}

export function createAuthStore({ storage } = {}) {
  const backing = storage ?? (typeof localStorage !== "undefined" ? localStorage : createMemoryStorage());
  let token = backing.getItem(STORAGE_KEY);

  return {
    getToken() {
      return token;
    },
    isAuthenticated() {
      return Boolean(token);
    },
    login(newToken) {
      token = newToken;
      backing.setItem(STORAGE_KEY, newToken);
    },
    logout() {
      token = null;
      backing.removeItem(STORAGE_KEY);
    },
  };
}
