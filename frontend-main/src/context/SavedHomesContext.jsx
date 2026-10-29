import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/api";

const SAVED_KEY = "renda_saved_listings";
const SavedHomesContext = createContext(null);

const listingId = (item) => (typeof item === "string" ? item : item?._id);

const getLegacySavedIds = () => {
  try {
    return JSON.parse(localStorage.getItem(SAVED_KEY) || "[]").map(listingId).filter(Boolean);
  } catch {
    return [];
  }
};

export function SavedHomesProvider({ children }) {
  const [user, setUser] = useState(null);
  const [savedIds, setSavedIds] = useState(() => new Set());
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const session = await api.get("/auth/session", { withCredentials: true });
      if (!session.data.authenticated) {
        setUser(null);
        setSavedIds(new Set());
        return;
      }

      setUser(session.data.user);
      const legacyIds = [...new Set(getLegacySavedIds())];
      if (legacyIds.length) {
        const migration = await Promise.allSettled(
          legacyIds.map((id) => api.put(`/users/saved-listings/${id}`, {}, { withCredentials: true }))
        );
        if (migration.every((result) => result.status === "fulfilled")) {
          localStorage.removeItem(SAVED_KEY);
        }
      }

      const response = await api.get("/users/saved-listings", { withCredentials: true });
      setSavedIds(new Set((response.data.savedListings || []).map((listing) => String(listing._id))));
    } catch {
      setUser(null);
      setSavedIds(new Set());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const sync = async () => {
      if (!active) return;
      await refresh();
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") sync();
    };

    sync();
    window.addEventListener("focus", sync);
    window.addEventListener("pageshow", sync);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      active = false;
      window.removeEventListener("focus", sync);
      window.removeEventListener("pageshow", sync);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [refresh]);

  const toggleSaved = useCallback(async (id) => {
    if (!user) return false;
    const key = String(id);
    const exists = savedIds.has(key);
    const request = exists
      ? api.delete(`/users/saved-listings/${key}`, { withCredentials: true })
      : api.put(`/users/saved-listings/${key}`, {}, { withCredentials: true });
    const response = await request;
    setSavedIds(new Set((response.data.savedListings || []).map((listing) => String(listing._id))));
    return true;
  }, [savedIds, user]);

  const value = useMemo(() => ({ user, savedIds, loading, refresh, toggleSaved }), [user, savedIds, loading, refresh, toggleSaved]);
  return <SavedHomesContext.Provider value={value}>{children}</SavedHomesContext.Provider>;
}

export function useSavedHomes() {
  const context = useContext(SavedHomesContext);
  if (!context) throw new Error("useSavedHomes must be used inside SavedHomesProvider");
  return context;
}
