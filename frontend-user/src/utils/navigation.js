export function safeNextPath(value, fallback = "/") {
  if (typeof value !== "string" || !value || value.length > 2048 || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return fallback;
  }

  const origin = globalThis.location?.origin || "https://rendahomes.invalid";
  try {
    const destination = new URL(value, origin);
    if (destination.origin !== origin || destination.pathname.startsWith("//")) return fallback;
    return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    return fallback;
  }
}

export function userHasAnyRole(user, roles = []) {
  const granted = new Set([user?.role, ...(Array.isArray(user?.roles) ? user.roles : [])].filter(Boolean));
  return roles.some((role) => granted.has(role));
}

export function safeRoleDestination(value, user, fallback = "/") {
  const destination = safeNextPath(value, fallback);
  if (destination.startsWith("/agent/") && !userHasAnyRole(user, ["agent"])) return fallback;
  return destination;
}

export function safeSignupDestination(value) {
  const destination = safeNextPath(value, "");
  return destination.startsWith("/agent/") ? "" : destination;
}
