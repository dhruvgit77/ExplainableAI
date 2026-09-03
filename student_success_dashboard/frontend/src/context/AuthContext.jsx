import { createContext, useContext, useState } from 'react';
import { api } from '../api/client';

const AUTH_KEY = 'vs_auth';
const AuthContext = createContext(null);

function readStored() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null');
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(readStored);

  // The session itself lives in an httpOnly cookie set by the server; this
  // local copy only carries non-sensitive display/routing info.
  function login({ role, name, user_id }) {
    const data = { role, name, userId: user_id };
    localStorage.setItem(AUTH_KEY, JSON.stringify(data));
    setAuth(data);
  }

  function logout() {
    api.logout().catch(() => {});
    localStorage.removeItem(AUTH_KEY);
    setAuth(null);
  }

  return <AuthContext.Provider value={{ auth, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
