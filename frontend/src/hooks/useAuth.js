import { useEffect, useRef, useState } from "react";
import { api } from "../services/api.js";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const authVersion = useRef(0);

  useEffect(() => {
    const version = authVersion.current;
    api
      .me()
      .then((data) => {
        if (authVersion.current === version) setUser(data.user);
      })
      .catch(() => {
        if (authVersion.current === version) setUser(null);
      })
      .finally(() => {
        if (authVersion.current === version) setChecking(false);
      });
  }, []);

  async function login(body) {
    authVersion.current += 1;
    const data = await api.login(body);
    setUser(data.user);
    setChecking(false);
  }

  async function register(body) {
    authVersion.current += 1;
    const data = await api.register(body);
    setUser(data.user);
    setChecking(false);
  }

  async function logout(options = {}) {
    authVersion.current += 1;
    if (!options.localOnly) await api.logout();
    setUser(null);
    setChecking(false);
  }

  return { user, setUser, checking, login, register, logout };
}
