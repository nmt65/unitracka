import { useEffect, useState } from "react";
import { api } from "../services/api.js";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    api
      .me()
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setChecking(false));
  }, []);

  async function login(body) {
    const data = await api.login(body);
    setUser(data.user);
  }

  async function register(body) {
    const data = await api.register(body);
    setUser(data.user);
  }

  async function logout(options = {}) {
    if (!options.localOnly) await api.logout();
    setUser(null);
  }

  return { user, setUser, checking, login, register, logout };
}
