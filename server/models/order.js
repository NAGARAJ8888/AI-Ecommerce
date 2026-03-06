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
    default: "Processing"
  },

  deliveredAt: Date
},
{ timestamps: true }
);

export default mongoose.model("Order", orderSchema);