import crypto from "crypto";
import { asyncHandler } from "../middleware/errorMiddleware.js";
import { getCookieOptions } from "../utils/cookieOptions.js";

/**
 * @desc Issue/rotate CSRF token cookie (double-submit pattern)
 * @route GET /api/users/csrf
 * @access Public (no auth required)
 */
export const issueCsrfCookie = asyncHandler(async (req, res) => {
  const csrfToken = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(32).toString("hex");

  // CSRF cookie MUST be readable by JS (non-HttpOnly)
  const { secure, sameSite, path, domain } = getCookieOptions({
    req,
    type: "csrf",
    maxAgeMs: parseInt(process.env.CSRF_TOKEN_MAX_AGE_MS, 10) || 1000 * 60 * 60 * 24 * 7 // default 7d
  });

  const csrfCookieOptions = {
    httpOnly: false,
    secure,
    sameSite,
    path: path || "/",
    maxAge: parseInt(process.env.CSRF_TOKEN_MAX_AGE_MS, 10) || 1000 * 60 * 60 * 24 * 7,
    ...(domain ? { domain } : {})
  };

  // Diagnostics for production lifecycle
  res.cookie("XSRF-TOKEN", csrfToken, csrfCookieOptions);

  const setCookieHeader = res.getHeader("Set-Cookie");
  console.log("CSRF COOKIE SET endpoint:", {
    hasSetCookie: Boolean(setCookieHeader),
    sameSite,
    secure,
    httpOnly: false,
    path: csrfCookieOptions.path,
    domain: csrfCookieOptions.domain,
  });

  return res.json({
    success: true,
    csrfToken
  });

});

