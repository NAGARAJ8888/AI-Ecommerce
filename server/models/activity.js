import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
{
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  action: {
    type: String,
    enum: ["view", "click", "add_to_cart", "purchase"]
  },

  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product"
  },

  metadata: Object
},
{ timestamps: true }
);

export default mongoose.model("Activity", activitySchema);