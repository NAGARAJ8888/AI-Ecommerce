import mongoose from "mongoose";

const RefreshTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    // Link tokens issued as part of the same refresh "family".
    familyId: {
      type: String,
      required: true,
      index: true
    },

    tokenHash: {
      type: String,
      required: true,
      unique: true
    },

    revokedAt: {
      type: Date,
      default: null
    },

    // When the refresh token expires.
    expiresAt: {
      type: Date,
      required: true,
      index: true
    },

    // Optional metadata.
    createdAt: {
      type: Date,
      default: Date.now
    },

    lastUsedAt: {
      type: Date,
      default: null
    },

    // Simple reuse counter for audit.
    reuseCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

RefreshTokenSchema.index({ userId: 1, expiresAt: 1 });
RefreshTokenSchema.index({ familyId: 1, revokedAt: 1 });

const RefreshToken = mongoose.model("RefreshToken", RefreshTokenSchema);
export default RefreshToken;


