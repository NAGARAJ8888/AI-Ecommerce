export const getCookieOptions = ({
  type,
  maxAgeMs,
  // req is optional but kept for future CSRF/origin-aware tweaks
  req
}) => {
  const isProd = process.env.NODE_ENV === "production";

  // Default behavior:
  // - localhost/dev: lax, secure=false
  // - production cross-site (frontend/back on different domains): needs SameSite=None + Secure
  const configuredSameSite = process.env.COOKIE_SAMESITE;
  const sameSite = isProd
    ? (configuredSameSite
        ? configuredSameSite === "strict"
          ? "strict"
          : configuredSameSite === "none"
            ? "none"
            : "lax"
        : (process.env.COOKIE_CROSS_SITE === "true" ? "none" : "lax"))
    : "lax";

  const options = {
    httpOnly: type === "refresh" || type === "access",
    secure: isProd,
    sameSite,
    path: "/",
    maxAge: maxAgeMs
  };

  if (isProd && process.env.COOKIE_DOMAIN) {
    options.domain = process.env.COOKIE_DOMAIN;
  }

  return options;
};

export const getClearCookieOptions = ({ type } = {}) => {
  const { maxAge, httpOnly, ...options } = getCookieOptions({ type });
  return options;
};

