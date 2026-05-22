import User from "../models/user.js";
import { asyncHandler } from "../middleware/errorMiddleware.js";

import jwt from "jsonwebtoken";
import crypto from "crypto";

import {
  findValidRefreshToken,
  findByTokenHashIncludingRevoked,
  revokeFamilyTokens,
  rotateRefreshToken,
  generateSecureToken,
  issueRefreshTokenForUser
} from "../services/auth/refreshTokenService.js";

import { generateToken } from "../middleware/authMiddleware.js";
import { getClearCookieOptions, getCookieOptions } from "../utils/cookieOptions.js";

/**
 * @desc   Silent refresh with rotation (secure cookie-based)
 * @route  POST /api/users/refresh
 * @access Private (requires refresh cookie + CSRF)
 */
export const refreshAuth = asyncHandler(async (req, res, next) => {
  const refreshToken = req.cookies?.refresh_token;
  if (!refreshToken) {
    return res.status(401).json({ success: false, message: "Missing refresh token" });
  }

  const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

  // Reuse detection: if revoked already, revoke entire family.
  const record = await findByTokenHashIncludingRevoked({ tokenHash });
  if (!record) {
    return res.status(401).json({ success: false, message: "Invalid refresh token" });
  }

  if (record.revokedAt) {
    // Reuse detected (someone used a rotated token)
    await revokeFamilyTokens(record.familyId);
    return res.status(401).json({ success: false, message: "Refresh token reuse detected" });
  }

  // Expired
  if (record.expiresAt <= new Date()) {
    return res.status(401).json({ success: false, message: "Refresh token expired" });
  }

  // Issue new access token
  const user = await User.findById(record.userId).select("-password");
  if (!user) {
    return res.status(401).json({ success: false, message: "User not found" });
  }

  const accessToken = generateToken(user._id);

  // Rotate refresh token
  const newRefreshToken = generateSecureToken(64);
  const refreshMaxAgeMs = parseInt(process.env.REFRESH_TOKEN_MAX_AGE_MS, 10) || 1000 * 60 * 60 * 24 * 30;
  const newExpiresAt = new Date(Date.now() + refreshMaxAgeMs);

  const newFamilyId = record.familyId; // keep family id

  await rotateRefreshToken({
    userId: record.userId,
    familyId: record.familyId,
    oldRefreshToken: refreshToken,
    oldTokenHash: tokenHash,
    newRefreshToken,
    newExpiresAt
  });

  // Set cookies
  const { secure, sameSite, httpOnly, path, domain } = getCookieOptions({
    req,
    type: "refresh",
    maxAgeMs: refreshMaxAgeMs
  });

  const refreshCookieOptions = {
    httpOnly,
    secure,
    sameSite,
    path,
    maxAge: refreshMaxAgeMs,
    ...(domain ? { domain } : {})
  };
  console.log("SETTING COOKIE:", "refresh_token", refreshCookieOptions);
  res.cookie("refresh_token", newRefreshToken, refreshCookieOptions);

  // XSRF token: rotate on refresh as well (optional but increases security)
  const csrfToken = generateSecureToken(32);
  const csrfCookieOptions = {
    ...getCookieOptions({
      type: "csrf",
      maxAgeMs: refreshMaxAgeMs
    }),
    // Override for CSRF cookie: must be readable by JS (not HttpOnly)
    httpOnly: false
  };

  // Ensure cross-origin cookie attributes are preserved
  if (domain) {
    csrfCookieOptions.domain = domain;
  }

  console.log("SETTING COOKIE:", "XSRF-TOKEN", csrfCookieOptions);
  res.cookie("XSRF-TOKEN", csrfToken, csrfCookieOptions);

  // Access token is short-lived; cookie should be HttpOnly for XSS resistance.
  const accessCookieOptions = {
    httpOnly: true,
    secure,
    sameSite,
    path,
    maxAge: 1000 * 60 * 10,
    ...(domain ? { domain } : {})
  };
  console.log("SETTING COOKIE:", "access_token", accessCookieOptions);
  res.cookie("access_token", accessToken, accessCookieOptions);

  return res.json({ success: true, data: { userId: user._id } });
});

/**
 * @desc   Logout by revoking refresh token family
 * @route  POST /api/users/logout
 */
export const logoutAuth = asyncHandler(async (req, res, next) => {
  console.log("LOGOUT AUTH CONTROLLER HIT");
  const refreshToken = req.cookies?.refresh_token;
  if (refreshToken) {
    const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
    const record = await findByTokenHashIncludingRevoked({ tokenHash });
    if (record?.familyId) {
      await revokeFamilyTokens(record.familyId);
    }
  }

  res.clearCookie("refresh_token", getClearCookieOptions({ type: "refresh" }));
  res.clearCookie("access_token", getClearCookieOptions({ type: "access" }));
  res.clearCookie("XSRF-TOKEN", getClearCookieOptions({ type: "csrf" }));

  return res.json({ success: true, message: "User logged out successfully" });
});


/**
 * @desc   Get current user using access cookie
 */
export const me = asyncHandler(async (req, res, next) => {
  // requireAuth middleware attaches req.user
  res.json({ success: true, data: req.user });
});

