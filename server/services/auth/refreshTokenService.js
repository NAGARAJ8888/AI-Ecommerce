import crypto from "crypto";
import RefreshToken from "../../models/refreshToken.js";

const algorithm = "sha256";

export const hashRefreshToken = (token) => {
  return crypto.createHash(algorithm).update(token).digest("hex");
};

export const generateSecureToken = (bytes = 64) => {
  return crypto.randomBytes(bytes).toString("hex");
};

export const issueRefreshTokenForUser = async ({
  userId,
  familyId,
  refreshToken,
  expiresAt
}) => {
  const tokenHash = hashRefreshToken(refreshToken);

  // Store hashed refresh token only.
  await RefreshToken.create({
    userId,
    familyId,
    tokenHash,
    expiresAt
  });

  return {
    refreshToken,
    familyId
  };
};

export const revokeRefreshToken = async (tokenHash) => {
  await RefreshToken.updateOne(
    { tokenHash, revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );
};

export const revokeFamilyTokens = async (familyId) => {
  await RefreshToken.updateMany(
    { familyId, revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );
};

export const findValidRefreshToken = async ({ tokenHash }) => {
  // Not revoked + not expired.
  return RefreshToken.findOne({
    tokenHash,
    revokedAt: null,
    expiresAt: { $gt: new Date() }
  });
};

export const findByTokenHashIncludingRevoked = async ({ tokenHash }) => {
  return RefreshToken.findOne({ tokenHash });
};

export const rotateRefreshToken = async ({
  userId,
  familyId,
  oldRefreshToken,
  oldTokenHash,
  newRefreshToken,
  newExpiresAt
}) => {
  // Ensure family id stays consistent across rotations.
  // Revoke old refresh token; if the same old refresh token is reused later,
  // the record will be marked revoked and we can detect a reuse attack.
  await revokeRefreshToken(oldTokenHash);

  // Issue new token record (same familyId).
  await issueRefreshTokenForUser({
    userId,
    familyId,
    refreshToken: newRefreshToken,
    expiresAt: newExpiresAt
  });

  // Update last used (best-effort; we only store hash)
  await RefreshToken.updateOne(
    { tokenHash: oldTokenHash },
    { $set: { lastUsedAt: new Date() } }
  );
};



