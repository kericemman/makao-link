const axios = require("axios");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const GOOGLE = {
  issuer: ["https://accounts.google.com", "accounts.google.com"],
  jwksUrl: "https://www.googleapis.com/oauth2/v3/certs",
  audiencesEnv: "GOOGLE_OAUTH_CLIENT_IDS"
};

class SocialIdentityError extends Error {
  constructor(message, statusCode = 401) {
    super(message);
    this.name = "SocialIdentityError";
    this.statusCode = statusCode;
  }
}

const defaultGetJson = async (url) => {
  const response = await axios.get(url, { timeout: 5000, maxRedirects: 0 });
  return { data: response.data, cacheControl: response.headers["cache-control"] || "" };
};

const parseAudiences = () => (process.env[GOOGLE.audiencesEnv] || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

const createSocialIdentityVerifier = ({ getJson = defaultGetJson, now = () => Date.now() } = {}) => {
  let jwksCache;

  const loadJwks = async (force = false) => {
    if (!force && jwksCache && jwksCache.expiresAt > now()) return jwksCache.keys;

    try {
      const response = await getJson(GOOGLE.jwksUrl);
      const jwks = response?.data ?? response;
      if (!Array.isArray(jwks?.keys)) throw new Error("Google keys unavailable");
      const maxAge = response?.cacheControl?.match(/(?:^|,)\s*max-age=(\d+)/i)?.[1];
      jwksCache = {
        keys: jwks.keys,
        expiresAt: now() + (maxAge ? Number(maxAge) * 1000 : 5 * 60 * 1000)
      };
      return jwksCache.keys;
    } catch {
      throw new SocialIdentityError("Google sign-in is temporarily unavailable", 503);
    }
  };

  return async ({ provider, idToken }) => {
    if (provider !== "google") throw new SocialIdentityError("Unsupported social login provider", 400);
    if (typeof idToken !== "string" || idToken.length < 20 || idToken.length > 12000) {
      throw new SocialIdentityError("A valid Google identity token is required");
    }

    const audience = parseAudiences();
    if (!audience.length) throw new SocialIdentityError("Google sign-in is not configured", 503);

    const decoded = jwt.decode(idToken, { complete: true });
    if (!decoded?.header?.kid || decoded.header.alg !== "RS256") {
      throw new SocialIdentityError("Invalid Google identity token");
    }

    let keys = await loadJwks();
    let jwk = keys.find((key) => key.kid === decoded.header.kid && key.use === "sig" && key.kty === "RSA");
    if (!jwk) {
      keys = await loadJwks(true);
      jwk = keys.find((key) => key.kid === decoded.header.kid && key.use === "sig" && key.kty === "RSA");
    }
    if (!jwk) throw new SocialIdentityError("Invalid Google identity token");

    let claims;
    try {
      const publicKey = crypto.createPublicKey({ key: jwk, format: "jwk" });
      claims = jwt.verify(idToken, publicKey, {
        algorithms: ["RS256"],
        issuer: GOOGLE.issuer,
        audience,
        clockTolerance: 5,
        clockTimestamp: Math.floor(now() / 1000)
      });
    } catch {
      throw new SocialIdentityError("Invalid or expired Google identity token");
    }

    if (!claims.sub || !claims.email || claims.email_verified !== true) {
      throw new SocialIdentityError("Google did not provide a verified account email");
    }

    return {
      provider: "google",
      providerId: String(claims.sub),
      email: String(claims.email).toLowerCase().trim(),
      name: claims.name || "RendaHomes User",
      avatar: claims.picture || ""
    };
  };
};

const verifySocialIdentity = createSocialIdentityVerifier();

module.exports = verifySocialIdentity;
module.exports.createSocialIdentityVerifier = createSocialIdentityVerifier;
module.exports.SocialIdentityError = SocialIdentityError;
