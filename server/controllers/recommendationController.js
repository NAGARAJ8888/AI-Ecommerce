import Recommendation from "../models/recommendation.js";
import Product from "../models/product.js";
import User from "../models/user.js";
import Activity from "../models/activity.js";
import { asyncHandler, AppError } from "../middleware/errorMiddleware.js";
import { logger } from "../utils/logger.js";
import { getAIRecommendations, getPersonalizedRecommendations, getSimilarProducts } from "../services/recommendationService.js";

/**
 * @desc    Get AI recommendations for user
 * @route   GET /api/recommendations
 * @access  Private
 */
export const getRecommendations = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const limit = parseInt(req.query.limit) || 10;

  // Get or create recommendation document
  let recommendation = await Recommendation.findOne({ user: userId });

  if (!recommendation) {
    // Generate new recommendations
    recommendation = await generateRecommendations(userId, limit);
  }

  // Check if recommendations need refresh (older than 24 hours)
  const lastUpdated = recommendation.updatedAt || recommendation.createdAt;
  const hoursSinceUpdate = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60);

  if (hoursSinceUpdate > 24) {
    // Refresh recommendations in background
    setImmediate(async () => {
      await generateRecommendations(userId, limit);
    });
  }

  // Populate product details
  await recommendation.populate("recommendedProducts", "name price images discountPrice ratings slug");

  res.json({
    success: true,
    data: recommendation.recommendedProducts,
    reason: recommendation.reason
  });
});

/**
 * @desc    Generate recommendations for user
 * @access  Private
 */
const generateRecommendations = async (userId, limit) => {
  try {
    // Get user's browsing history
    const user = await User.findById(userId)
      .populate("browsingHistory.product", "category tags");

    // Get user's purchase history
    const userActivities = await Activity.find({ 
      user: userId, 
      action: "purchase" 
    }).populate("product", "category tags");

    // Try AI-based recommendations first
    let recommendedProducts = [];
    let reason = "Based on your browsing history and preferences";

    try {
      recommendedProducts = await getAIRecommendations(userId, limit);
      reason = "AI-powered personalized recommendations";
    } catch (error) {
      logger.warn("AI recommendations failed, falling back to collaborative filtering");
      
      // Fallback to collaborative filtering
      recommendedProducts = await getPersonalizedRecommendations(userId, limit);
    }

    // Save or update recommendation
    let recommendation = await Recommendation.findOneAndUpdate(
      { user: userId },
      {
        user: userId,
        recommendedProducts: recommendedProducts.map(p => p._id),
        reason
      },
      { new: true, upsert: true }
    );

    return recommendation;
  } catch (error) {
    logger.error("Error generating recommendations:", error);
    throw error;
  }
};

/**
 * @desc    Get similar products
 * @route   GET /api/recommendations/similar/:productId
 * @access  Public
 */
export const getSimilarProductsController = asyncHandler(async (req, res, next) => {
  const { productId } = req.params;
  const limit = parseInt(req.query.limit) || 5;

  const product = await Product.findById(productId);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  // Get similar products
  const similarProducts = await getSimilarProducts(productId, limit);

  res.json({
    success: true,
    data: similarProducts
  });
});

/**
 * @desc    Get trending products
 * @route   GET /api/recommendations/trending
 * @access  Public
 */
export const getTrendingProducts = asyncHandler(async (req, res, next) => {
  const limit = parseInt(req.query.limit) || 10;

  // Get products with most views in last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const trendingProductIds = await Activity.aggregate([
    { $match: { action: "view", createdAt: { $gte: sevenDaysAgo } } },
    { $group: { _id: "$product", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit }
  ]);

  // Get product details
  const productIds = trendingProductIds.map(item => item._id);
  const products = await Product.find({ _id: { $in: productIds } })
    .populate("category", "name slug")
    .sort({ ratings: -1 });

  res.json({
    success: true,
    data: products
  });
});

/**
 * @desc    Get frequently bought together products
 * @route   GET /api/recommendations/frequently-bought/:productId
 * @access  Public
 */
export const getFrequentlyBoughtTogether = asyncHandler(async (req, res, next) => {
  const { productId } = req.params;
  const limit = parseInt(req.query.limit) || 4;

  // Find orders containing this product
  const orders = await Order.find({
    "orderItems.product": productId,
    orderStatus: { $ne: "Cancelled" }
  });

  // Find products frequently bought together
  const productCounts = {};
  
  for (const order of orders) {
    for (const item of order.orderItems) {
      if (item.product.toString() !== productId) {
        productCounts[item.product] = (productCounts[item.product] || 0) + 1;
      }
    }
  }

  // Sort by frequency and get top products
  const sortedProducts = Object.entries(productCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([productId]) => productId);

  const products = await Product.find({ _id: { $in: sortedProducts } })
    .populate("category", "name slug");

  // Sort to match frequency order
  const sortedResult = sortedProducts.map(id => 
    products.find(p => p._id.toString() === id)
  ).filter(Boolean);

  res.json({
    success: true,
    data: sortedResult
  });
});

/**
 * @desc    Track user activity
 * @route   POST /api/recommendations/track
 * @access  Private
 */
export const trackActivity = asyncHandler(async (req, res, next) => {
  const { productId, action } = req.body;

  const validActions = ["view", "click", "add_to_cart", "purchase"];

  if (!validActions.includes(action)) {
    throw new AppError("Invalid action", 400);
  }

  const product = await Product.findById(productId);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  // Create activity record
  await Activity.create({
    user: req.user._id,
    action,
    product: productId,
    metadata: {
      timestamp: new Date(),
      userAgent: req.headers["user-agent"]
    }
  });

  // Update user's browsing history for views
  if (action === "view") {
    const user = await User.findById(req.user._id);
    
    // Remove existing entry
    user.browsingHistory = user.browsingHistory.filter(
      item => item.product.toString() !== productId
    );

    // Add new entry at the beginning
    user.browsingHistory.unshift({
      product: productId,
      viewedAt: new Date()
    });

    // Keep only last 20 items
    user.browsingHistory = user.browsingHistory.slice(0, 20);
    await user.save();
  }

  res.json({
    success: true,
    message: "Activity tracked"
  });
});

/**
 * @desc    Refresh recommendations
 * @route   POST /api/recommendations/refresh
 * @access  Private
 */
export const refreshRecommendations = asyncHandler(async (req, res, next) => {
  const limit = parseInt(req.query.limit) || 10;

  const recommendation = await generateRecommendations(req.user._id, limit);

  await recommendation.populate("recommendedProducts", "name price images discountPrice ratings slug");

  logger.info(`Recommendations refreshed for user ${req.user._id}`);

  res.json({
    success: true,
    data: recommendation.recommendedProducts,
    reason: recommendation.reason
  });
});

/**
 * @desc    Get recommendations for guest users
 * @route   GET /api/recommendations/guest
 * @access  Public
 */
export const getGuestRecommendations = asyncHandler(async (req, res, next) => {
  const limit = parseInt(req.query.limit) || 10;

  // Get popular products based on recent activity
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const popularProductIds = await Activity.aggregate([
    { $match: { createdAt: { $gte: sevenDaysAgo } } },
    { $group: { _id: "$product", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit }
  ]);

  if (popularProductIds.length === 0) {
    // Fallback to top-rated products
    const products = await Product.find({ stock: { $gt: 0 } })
      .populate("category", "name slug")
      .sort({ ratings: -1, numReviews: -1 })
      .limit(limit);

    return res.json({
      success: true,
      data: products,
      reason: "Popular products"
    });
  }

  const productIds = popularProductIds.map(item => item._id);
  const products = await Product.find({ _id: { $in: productIds } })
    .populate("category", "name slug");

  res.json({
    success: true,
    data: products,
    reason: "Trending products based on recent activity"
  });
});

/**
 * @desc    Get recommendation analytics (admin)
 * @route   GET /api/recommendations/admin/analytics
 * @access  Private/Admin
 */
export const getRecommendationAnalytics = asyncHandler(async (req, res, next) => {
  const totalRecommendations = await Recommendation.countDocuments();
  
  const recentRecommendations = await Recommendation.find()
    .sort({ updatedAt: -1 })
    .limit(10)
    .populate("user", "name email")
    .populate("recommendedProducts", "name price");

  // Get activity stats
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const activityStats = await Activity.aggregate([
    { $match: { createdAt: { $gte: sevenDaysAgo } } },
    {
      $group: {
        _id: "$action",
        count: { $sum: 1 }
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      totalRecommendations,
      recentRecommendations,
      activityStats: activityStats.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {})
    }
  });
});

// Import Order for frequently bought together
import Order from "../models/order.js";

