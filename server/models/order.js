import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    orderItems: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product"
        },

        name: String,

        price: Number,

        quantity: Number,

        image: String
      }
    ],

    shippingAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },

    paymentInfo: {
      id: String,
      status: String
    },

    totalPrice: Number,

    orderStatus: {
      type: String,
      default: "Processing",
      // STEP 1: enforce valid status values while preserving legacy values.
      // This prevents accidental typos and creates a stable foundation for transitions.
      enum: [
        // Canonical workflow statuses
        "PENDING",
        "PAYMENT_PENDING",
        "PAYMENT_FAILED",
        "PAID",
        "PROCESSING",
        "PACKED",
        "SHIPPED",
        "DELIVERED",
        "CANCELLED",
        "REFUNDED",
        // Legacy values currently used by controllers/DB
        "Processing",
        "Shipped",
        "Delivered",
        "Cancelled"
      ]
    },

    // STEP 1: audit trail of order state changes.
    // Each entry represents a workflow transition intent.
    statusHistory: [
      {
        status: String,
        changedAt: Date,
        reason: String,
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User"
        }
      }
    ],

    deliveredAt: Date
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);

