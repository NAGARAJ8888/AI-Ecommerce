import mongoose from "mongoose";

const recommendationSchema = new mongoose.Schema(
{
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  recommendedProducts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product"
    }
  ],

  reason: String
},
{ timestamps: true }
);

export default mongoose.model("Recommendation", recommendationSchema);