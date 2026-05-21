import { admin, checkRole, isOwnerOrAdmin } from "./adminMiddleware.js";

// Re-export admin functions from adminMiddleware for backward compatibility
export { admin, checkRole, isOwnerOrAdmin };

// Cookie-based auth
// NOTE: we keep these exports to avoid updating every router import immediately.
export { protect } from "./auth/requireAuth.js";
export { optionalAuth } from "./auth/optionalAuth.js";

// Generate short-lived access token (used for cookie-based access flow)
import jwt from "jsonwebtoken";

export const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE_ACCESS || "10m"
  });
};

