const SESSION_COOKIE_NAME = "renda_shared_session";
const SESSION_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: SESSION_MAX_AGE,
  ...(process.env.AUTH_COOKIE_DOMAIN
    ? { domain: process.env.AUTH_COOKIE_DOMAIN }
    : process.env.NODE_ENV === "production"
      ? { domain: ".rendahomes.com" }
      : {})
});

const clearSharedSessionCookie = (res) => {
  const { maxAge, ...options } = cookieOptions();
  res.clearCookie(SESSION_COOKIE_NAME, options);
};

const setSharedSessionCookie = (res, user, token) => {
  if (!["user", "agent"].includes(user.role)) {
    clearSharedSessionCookie(res);
    return;
  }
  res.cookie(SESSION_COOKIE_NAME, token, cookieOptions());
};

const getSharedSessionToken = (req) => {
  const cookie = (req.headers.cookie || "")
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${SESSION_COOKIE_NAME}=`));
  if (!cookie) return null;

  try {
    return decodeURIComponent(cookie.slice(SESSION_COOKIE_NAME.length + 1));
  } catch {
    return null;
  }
};

module.exports = { clearSharedSessionCookie, getSharedSessionToken, setSharedSessionCookie };
