export const getCookieOptions = ({
  type,
  maxAgeMs,
  // req is optional but kept for future CSRF/origin-aware tweaks
  req
}) => {
  const isProd = process.env.NODE_ENV === "production";

  // For cross-origin SPA (frontend/back on different domains) cookies must be:
  //   SameSite=None; Secure
  // Otherwise browsers will silently drop them.
  //
  // Dev/localhost must remain compatible (Secure=false, SameSite=Lax).
  const sameSite = isProd ? "none" : "lax";

  const options = {
    httpOnly: type === "refresh" || type === "access",
    secure: isProd,
    sameSite,
    path: "/",
    maxAge: maxAgeMs
  };

  // Only set domain if explicitly configured.
  // Misconfigured domain is a common reason cookies won't store in production.
  if (isProd && process.env.COOKIE_DOMAIN) {
    options.domain = process.env.COOKIE_DOMAIN;
  }

  return options;
};


export const getClearCookieOptions = ({ type } = {}) => {
  const { maxAge, httpOnly, ...options } = getCookieOptions({ type });
  return options;
};

