// Dependency-free security headers (STEP 7).
// Keep minimal to avoid breaking frontend/assets.

export function securityHeaders(req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");

  // Basic CSP: allow same-origin + swagger UI.
  // Frontend is served from browser; APIs are called via XHR/fetch.
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "connect-src 'self'"
  ].join("; ");
  res.setHeader("Content-Security-Policy", csp);

  next();
}

