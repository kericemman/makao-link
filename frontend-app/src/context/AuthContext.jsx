import { useCallback, useEffect, useMemo, useState } from "react";
import AuthContext from "./auth-context";
import api from "../api/api";

const defaultUsage = { used: 0, limit: 0, remaining: 0 };

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [usage, setUsage] = useState(defaultUsage);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("makao_token");

    if (token) {
      fetchMe().catch(() => {});
    } else {
      setLoading(false);
    }
  }, [fetchMe]);

  const login = useCallback(({ token, user, subscription, usage }) => {
    localStorage.setItem("makao_token", token);

    setUser(user || null);
    setSubscription(subscription || null);
    setUsage(usage || defaultUsage);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("makao_token");

    setUser(null);
    setSubscription(null);
    setUsage(defaultUsage);
  }, []);

  const refreshAuth = useCallback(() => fetchMe(), [fetchMe]);

  const refreshSubscription = useCallback(() => fetchMe(), [fetchMe]);

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
    [user, subscription, usage, loading, login, logout, refreshAuth, refreshSubscription]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
