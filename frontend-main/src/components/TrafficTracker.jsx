import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import api from "../api/api";

let activeAttribution = null;

const getAttribution = (search) => {
  const params = new URLSearchParams(search);
  const utmSource = params.get("utm_source");
  const utmMedium = params.get("utm_medium");
  if (utmSource || utmMedium) {
    return { source: utmSource || "other", medium: utmMedium || "other" };
  }
  if (typeof document === "undefined" || !document.referrer) return { source: "direct", medium: "direct" };
  try {
    const referrer = new URL(document.referrer);
    if (referrer.hostname === window.location.hostname) return { source: "direct", medium: "direct" };
    return { source: referrer.hostname, medium: "referral" };
  } catch {
    return { source: "direct", medium: "direct" };
  }
};

export default function TrafficTracker() {
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (!activeAttribution || params.has("utm_source") || params.has("utm_medium")) {
      activeAttribution = getAttribution(location.search);
    }
    fetch(`${api.defaults.baseURL.replace(/\/$/, "")}/analytics/pageview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: location.pathname, source: activeAttribution.source, medium: activeAttribution.medium }),
      credentials: "omit",
      keepalive: true,
      referrerPolicy: "no-referrer"
    }).catch(() => {});
  }, [location.pathname, location.search]);

  return null;
}
