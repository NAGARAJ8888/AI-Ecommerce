import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
{
  name: {
    type: String,
    required: true
  },

  slug: {
    type: String,
    required: true,
    unique: true
  },

  description: String,

  price: {
    type: Number,
    required: true
  },

  discountPrice: Number,

  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category"
  },

  brand: String,

  images: [
    {
      url: String,
      public_id: String
    }
  ],

  stock: {
    type: Number,
    default: 0
  },

  ratings: {
    type: Number,
    default: 0
  },

  numReviews: {
    type: Number,
    default: 0
  },

  tags: [String],

  aiScore: Number
},
{ timestamps: true }
);

export default mongoose.model("Product", productSchema);