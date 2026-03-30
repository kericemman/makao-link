import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [usage, setUsage] = useState({ used: 0, limit: 0, remaining: 0 });
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("makao_token");

  const fetchMe = async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data.user);
      setSubscription(data.subscription);
      setUsage(data.usage || { used: 0, limit: 0, remaining: 0 });
      return data;
    } catch (error) {
      localStorage.removeItem("makao_token");
      setUser(null);
      setSubscription(null);
      setUsage({ used: 0, limit: 0, remaining: 0 });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchMe().catch(() => {});
    } else {
      setLoading(false);
    }
  }, []);

  const login = ({ token, user, subscription, usage }) => {
    localStorage.setItem("makao_token", token);
    setUser(user);
    setSubscription(subscription);
    setUsage(usage || { used: 0, limit: 0, remaining: 0 });
  };

  const logout = () => {
    localStorage.removeItem("makao_token");
    setUser(null);
    setSubscription(null);
    setUsage({ used: 0, limit: 0, remaining: 0 });
  };

  const refreshAuth = async () => {
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
      refreshAuth
    }),
    [user, subscription, usage, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);