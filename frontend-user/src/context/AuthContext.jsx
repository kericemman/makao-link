import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getMe, loginUser, registerUser, verifyEmail as verifyEmailRequest } from "../services/auth.service";

const AuthContext = createContext(null);

const TOKEN_KEY = "renda_user_token";
const USER_KEY = "renda_user_profile";

const notifyAuthChange = () => {
  window.dispatchEvent(new Event("renda-user-auth"));
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  });
  const [booting, setBooting] = useState(Boolean(localStorage.getItem(TOKEN_KEY)));

  const saveSession = (nextToken, nextUser) => {
    localStorage.setItem(TOKEN_KEY, nextToken);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
    notifyAuthChange();
  };

  const clearSession = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    notifyAuthChange();
  };

  useEffect(() => {
    if (!token) {
      setBooting(false);
      return;
    }

    getMe()
      .then((data) => {
        const nextUser = data.user;
        localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
        setUser(nextUser);
      })
      .catch(clearSession)
      .finally(() => setBooting(false));
  }, [token]);

  const value = useMemo(
    () => ({
      user,
      token,
      booting,
      isAuthenticated: Boolean(token && user),
      register: registerUser,
      login: async (payload) => {
        const data = await loginUser(payload);
        saveSession(data.token, data.user);
        return data;
      },
      verifyEmail: async (payload) => {
        const data = await verifyEmailRequest(payload);
        saveSession(data.token, data.user);
        return data;
      },
      updateUser: (nextUser) => {
        localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
        setUser(nextUser);
        notifyAuthChange();
      },
      logout: clearSession
    }),
    [booting, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
