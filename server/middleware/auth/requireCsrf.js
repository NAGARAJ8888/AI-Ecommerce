import { asyncHandler, AppError } from "../../middleware/errorMiddleware.js";

/**
 * CSRF protection for cookie-based auth.
 *
 * Pattern: double-submit
 * - server sets readable cookie: XSRF-TOKEN (non-HttpOnly)
 * - client must echo its value in header: X-CSRF-Token
 */
export const requireCsrf = asyncHandler(async (req, res, next) => {

  // Only protect unsafe methods
  const method = (req.method || "").toUpperCase();
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) return next();

  const cookieToken = req.cookies?.["XSRF-TOKEN"];
  const headerToken = req.headers["x-csrf-token"];

  // Extra production diagnostics (safe: no token values logged).
  console.log("CSRF DEBUG: incomingCookies.has(XSRF-TOKEN)=", Boolean(cookieToken));
  console.log("CSRF DEBUG: header x-csrf-token present=", Boolean(headerToken));
  console.log("CSRF DEBUG: cookieTokenLength=", cookieToken ? String(cookieToken).length : 0);
  console.log("CSRF DEBUG: headerTokenLength=", headerToken ? String(headerToken).length : 0);
  console.log("CSRF DEBUG: TOKENS MATCH:", cookieToken && headerToken ? cookieToken === headerToken : false);

  // Log raw header keys for casing/expectation debugging.
  console.log(
    "CSRF DEBUG: request header keys:",
    Object.keys(req.headers || {}).filter((k) => k.toLowerCase().includes("csrf"))
  );


  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ success: false, message: "Invalid CSRF token" });
  }

  // Extra hardening: for cookie auth, ensure browser-origin.
  // In production you should also validate Origin against FRONTEND_URL.
  const origin = req.headers.origin;
  if (origin && process.env.FRONTEND_URL) {
    const allowed = process.env.FRONTEND_URL;
    if (allowed && origin !== allowed) {
      return res.status(403).json({ success: false, message: "Invalid request origin" });
    }
  }

  return next();
});

