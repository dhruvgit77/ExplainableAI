import { createContext, useContext, useState } from 'react';

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

  function login({ access_token, role, name, user_id }) {
    const data = { token: access_token, role, name, userId: user_id };
    localStorage.setItem(AUTH_KEY, JSON.stringify(data));
    setAuth(data);
  }

  function logout() {
    localStorage.removeItem(AUTH_KEY);
    setAuth(null);
  }

  return <AuthContext.Provider value={{ auth, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
