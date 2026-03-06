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

  transactionId: String
},
{ timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);