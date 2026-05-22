export const getCookieOptions = ({
  type,
  maxAgeMs
}) => {
  const isProd = process.env.NODE_ENV === "production";
  const configuredSameSite = process.env.COOKIE_SAMESITE;
  const sameSite = isProd && configuredSameSite
    ? configuredSameSite === "strict"
      ? "strict"
      : configuredSameSite === "none"
        ? "none"
        : "lax"
    : "lax";

  const options = {
    httpOnly: type === "refresh",
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

