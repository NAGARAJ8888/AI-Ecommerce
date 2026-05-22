import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
{
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order"
  },

  amount: Number,

  provider: {
    type: String,
    enum: ["stripe", "razorpay"]
  },

  status: String,

  // Provider transaction identifier (Stripe PaymentIntent ID / Razorpay payment ID)
  transactionId: String,

  // Optional idempotency fields (STEP 4 foundation)
  providerEventId: {
    type: String,
    default: undefined
  },
  idempotencyKey: {
    type: String,
    default: undefined
  },

  // Optional refund tracking (STEP 4 foundation)
  refundId: {
    type: String,
    default: undefined
  },
  refundedAt: {
    type: Date,
    default: undefined
  }
},
{ timestamps: true }
);

// STEP 4: Uniqueness guarantees for replay/duplicate protection.
// This is the core idempotency foundation for duplicate payment verification.
paymentSchema.index(
  { provider: 1, transactionId: 1 },
  {
    unique: true,
    sparse: true
  }
);

// Optional: provider event uniqueness (foundation-level; only used if providerEventId is passed).
paymentSchema.index(
  { provider: 1, providerEventId: 1 },
  {
    unique: true,
    sparse: true
  }
);


export default mongoose.model("Payment", paymentSchema);