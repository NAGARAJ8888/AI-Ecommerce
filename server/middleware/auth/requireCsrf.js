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

  console.log("CSRF COOKIE:", cookieToken);
  console.log("CSRF HEADER:", headerToken);
  console.log("TOKENS MATCH:", cookieToken === headerToken);

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

