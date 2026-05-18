import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/api";

const AuthContext = createContext(null);

const defaultUsage = { used: 0, limit: 0, remaining: 0 };

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [usage, setUsage] = useState(defaultUsage);
  const [loading, setLoading] = useState(true);

  const fetchMe = async () => {
    try {
      const { data } = await api.get("/auth/me");

      setUser(data.user || null);
      setSubscription(data.subscription || null);
      setUsage(data.usage || defaultUsage);

      return data;
    } catch (error) {
      localStorage.removeItem("makao_token");

      setUser(null);
      setSubscription(null);
      setUsage(defaultUsage);

      throw error;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("makao_token");

    if (token) {
      fetchMe().catch(() => {});
    } else {
      setLoading(false);
    }
  }, []);

  const login = ({ token, user, subscription, usage }) => {
    localStorage.setItem("makao_token", token);

    setUser(user || null);
    setSubscription(subscription || null);
    setUsage(usage || defaultUsage);
  };

  const logout = () => {
    localStorage.removeItem("makao_token");

    setUser(null);
    setSubscription(null);
    setUsage(defaultUsage);
  };

  const refreshAuth = async () => {
    return fetchMe();
  };

  const refreshSubscription = async () => {
    return fetchMe();
  };

  const value = useMemo(
    () => ({
      user,
      subscription,
      usage,
      loading,
      login,
      logout,
      refreshAuth,
      refreshSubscription
    }),
    [user, subscription, usage, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);