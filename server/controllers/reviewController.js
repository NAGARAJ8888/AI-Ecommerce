import Review from "../models/review.js";
import Product from "../models/product.js";
import Order from "../models/order.js";
import { asyncHandler, AppError } from "../middleware/errorMiddleware.js";
import { logger } from "../utils/logger.js";

/**
 * @desc    Get reviews for a product
 * @route   GET /api/reviews/product/:productId
 * @access  Public
 */
export const getProductReviews = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const reviews = await Review.find({ product: req.params.productId })
    .populate("user", "name avatar")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Review.countDocuments({ product: req.params.productId });

  // Calculate average rating
  const ratingStats = await Review.aggregate([
    { $match: { product: req.params.productId } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  res.json({
    success: true,
    data: reviews,
    rating: ratingStats[0]?.averageRating || 0,
    ratingCount: ratingStats[0]?.totalReviews || 0,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

/**
 * @desc    Create review
 * @route   POST /api/reviews
 * @access  Private
 */
export const createReview = asyncHandler(async (req, res, next) => {
  const { productId, rating, comment } = req.body;

  // Validate rating
  if (!rating || rating < 1 || rating > 5) {
    throw new AppError("Please provide a rating between 1 and 5", 400);
  }

  // Check if product exists
  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError("Product not found", 404);
  }

  // Check if user already reviewed this product
  const existingReview = await Review.findOne({
    user: req.user._id,
    product: productId
  });

  if (existingReview) {
    throw new AppError("You have already reviewed this product", 400);
  }

  // Check if user purchased the product (optional: enforce purchase requirement)
  // Uncomment below to enforce purchase requirement
  /*
  const hasPurchased = await Order.findOne({
    user: req.user._id,
    "orderItems.product": productId,
    orderStatus: "Delivered"
  });

  if (!hasPurchased) {
    throw new AppError("You must purchase this product to review it", 400);
  }
  */

  // Determine sentiment based on rating
  let sentiment = "neutral";
  if (rating >= 4) sentiment = "positive";
  else if (rating <= 2) sentiment = "negative";

  // Create review
  const review = await Review.create({
    user: req.user._id,
    product: productId,
    rating,
    comment,
    sentiment
  });

  // Populate user info
  await review.populate("user", "name avatar");

  // Update product rating
  const stats = await Review.aggregate([
    { $match: { product: productId } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  await Product.findByIdAndUpdate(productId, {
    ratings: stats[0]?.averageRating || rating,
    numReviews: stats[0]?.totalReviews || 1
  });

  logger.info(`Review created for product ${productId} by user ${req.user._id}`);

  res.status(201).json({
    success: true,
    data: review
  });
});

/**
 * @desc    Update review
 * @route   PUT /api/reviews/:id
 * @access  Private
 */
export const updateReview = asyncHandler(async (req, res, next) => {
  const { rating, comment } = req.body;

  let review = await Review.findById(req.params.id);

  if (!review) {
    throw new AppError("Review not found", 404);
  }

  // Check ownership
  if (review.user.toString() !== req.user._id.toString()) {
    throw new AppError("Not authorized to update this review", 403);
  }

  // Validate rating
  if (rating && (rating < 1 || rating > 5)) {
    throw new AppError("Rating must be between 1 and 5", 400);
  }

  review.rating = rating || review.rating;
  review.comment = comment || review.comment;

  // Update sentiment
  if (rating) {
    if (rating >= 4) review.sentiment = "positive";
    else if (rating <= 2) review.sentiment = "negative";
    else review.sentiment = "neutral";
  }

  await review.save();

  // Update product rating
  const stats = await Review.aggregate([
    { $match: { product: review.product } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$rating" }
      }
    }
  ]);

  await Product.findByIdAndUpdate(review.product, {
    ratings: stats[0]?.averageRating || review.rating
  });

  res.json({
    success: true,
    data: review
  });
});

/**
 * @desc    Delete review
 * @route   DELETE /api/reviews/:id
 * @access  Private
 */
export const deleteReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    throw new AppError("Review not found", 404);
  }

  // Check ownership or admin
  if (review.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    throw new AppError("Not authorized to delete this review", 403);
  }

  const productId = review.product;

  await review.deleteOne();

  // Update product rating
  const stats = await Review.aggregate([
    { $match: { product: productId } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  await Product.findByIdAndUpdate(productId, {
    ratings: stats[0]?.averageRating || 0,
    numReviews: stats[0]?.totalReviews || 0
  });

  logger.info(`Review deleted: ${req.params.id}`);

  res.json({
    success: true,
    message: "Review deleted successfully"
  });
});

/**
 * @desc    Get user's reviews
 * @route   GET /api/reviews/my-reviews
 * @access  Private
 */
export const getMyReviews = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const reviews = await Review.find({ user: req.user._id })
    .populate("product", "name images slug")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Review.countDocuments({ user: req.user._id });

  res.json({
    success: true,
    data: reviews,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

/**
 * @desc    Get all reviews (admin)
 * @route   GET /api/reviews/admin/all
 * @access  Private/Admin
 */
export const getAllReviews = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  // Filter options
  let query = {};
  if (req.query.product) {
    query.product = req.query.product;
  }
  if (req.query.sentiment) {
    query.sentiment = req.query.sentiment;
  }
  if (req.query.rating) {
    query.rating = parseInt(req.query.rating);
  }

  const reviews = await Review.find(query)
    .populate("user", "name email avatar")
    .populate("product", "name slug images")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Review.countDocuments(query);

  res.json({
    success: true,
    data: reviews,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

/**
 * @desc    Get review statistics (admin)
 * @route   GET /api/reviews/admin/stats
 * @access  Private/Admin
 */
export const getReviewStats = asyncHandler(async (req, res, next) => {
  const totalReviews = await Review.countDocuments();

  const sentimentStats = await Review.aggregate([
    {
      $group: {
        _id: "$sentiment",
        count: { $sum: 1 }
      }
    }
  ]);

  const ratingStats = await Review.aggregate([
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      totalReviews,
      averageRating: ratingStats[0]?.averageRating || 0,
      sentiment: {
        positive: sentimentStats.find(s => s._id === "positive")?.count || 0,
        neutral: sentimentStats.find(s => s._id === "neutral")?.count || 0,
        negative: sentimentStats.find(s => s._id === "negative")?.count || 0
      }
    }
  });
});

