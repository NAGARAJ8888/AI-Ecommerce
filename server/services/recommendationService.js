import Product from "../models/product.js";
import User from "../models/user.js";
import Activity from "../models/activity.js";
import Order from "../models/order.js";
import dotenv from "dotenv";
import { logger } from "../utils/logger.js";

dotenv.config();

/**
 * Get AI-powered recommendations
 * This can be integrated with an external AI service like OpenAI, etc.
 * For now, it uses a hybrid approach combining collaborative filtering and content-based filtering
 * @param {string} userId - User ID
 * @param {number} limit - Number of recommendations
 * @returns {Promise<Product[]>} - Recommended products
 */
export const getAIRecommendations = async (userId, limit = 10) => {
  try {
    // Get user's browsing history
    const user = await User.findById(userId)
      .populate("browsingHistory.product", "category tags price");

    if (!user || !user.browsingHistory.length) {
      // Fallback to popular products if no history
      return await getPersonalizedRecommendations(userId, limit);
    }

    // Extract categories and tags from browsing history
    const categoryWeights = {};
    const tagWeights = {};
    const viewedProducts = [];

    user.browsingHistory.forEach((item, index) => {
      if (item.product) {
        // More recent views have higher weight
        const weight = user.browsingHistory.length - index;
        
        if (item.product.category) {
          categoryWeights[item.product.category] = 
            (categoryWeights[item.product.category] || 0) + weight;
        }
        
        if (item.product.tags) {
          item.product.tags.forEach(tag => {
            tagWeights[tag] = (tagWeights[tag] || 0) + weight;
          });
        }
        
        viewedProducts.push(item.product._id);
      }
    });

    // Build query for recommendations
    const topCategories = Object.entries(categoryWeights)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([cat]) => cat);

    const topTags = Object.entries(tagWeights)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([tag]) => tag);

    // Find products that match user's interests but haven't been viewed
    const recommendations = await Product.find({
      _id: { $nin: viewedProducts },
      stock: { $gt: 0 },
      $or: [
        { category: { $in: topCategories } },
        { tags: { $in: topTags } }
      ]
    })
      .populate("category", "name")
      .limit(limit * 2);

    // Score and sort recommendations
    const scoredProducts = recommendations.map(product => {
      let score = 0;

      // Category match score
      if (topCategories.includes(product.category?._id?.toString())) {
        score += 10;
      }

      // Tag match score
      product.tags?.forEach(tag => {
        if (topTags.includes(tag)) {
          score += 2;
        }
      });

      // Boost by rating and AI score
      score += product.ratings * 0.5;
      score += (product.aiScore || 50) * 0.1;

      return { product, score };
    });

    // Sort by score and return top recommendations
    return scoredProducts
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.product);

  } catch (error) {
    logger.error("AI recommendations error:", error);
    throw error;
  }
};

/**
 * Get personalized recommendations using collaborative filtering
 * @param {string} userId - User ID
 * @param {number} limit - Number of recommendations
 * @returns {Promise<Product[]>} - Recommended products
 */
export const getPersonalizedRecommendations = async (userId, limit = 10) => {
  try {
    // Find products bought by similar users
    const userOrders = await Order.find({ 
      user: userId, 
      orderStatus: { $ne: "Cancelled" } 
    });
    
    const purchasedProducts = userOrders.flatMap(order => 
      order.orderItems.map(item => item.product)
    );

    // Find other users who bought similar products
    const similarUsers = await Order.aggregate([
      {
        $match: {
          orderStatus: { $ne: "Cancelled" },
          "orderItems.product": { $in: purchasedProducts }
        }
      },
      {
        $group: {
          _id: "$user",
          products: { $push: "$orderItems.product" }
        }
      },
      {
        $match: {
          _id: { $ne: userId }
        }
      },
      {
        $limit: 50
      }
    ]);

    // Aggregate products bought by similar users
    const productCounts = {};
    similarUsers.forEach(su => {
      su.products.forEach(prodId => {
        if (!purchasedProducts.includes(prodId.toString())) {
          productCounts[prodId] = (productCounts[prodId] || 0) + 1;
        }
      });
    });

    const topProductIds = Object.entries(productCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit * 2)
      .map(([id]) => id);

    const recommendations = await Product.find({ 
      _id: { $in: topProductIds },
      stock: { $gt: 0 }
    })
      .populate("category", "name")
      .limit(limit);

    // Sort by popularity score
    return recommendations.sort((a, b) => {
      const scoreA = productCounts[a._id.toString()] || 0;
      const scoreB = productCounts[b._id.toString()] || 0;
      return scoreB - scoreA;
    });

  } catch (error) {
    logger.error("Collaborative filtering error:", error);
    // Fallback to trending products
    return await getTrendingProducts(limit);
  }
};

/**
 * Get similar products based on content similarity
 * @param {string} productId - Product ID
 * @param {number} limit - Number of similar products
 * @returns {Promise<Product[]>} - Similar products
 */
export const getSimilarProducts = async (productId, limit = 5) => {
  try {
    const product = await Product.findById(productId);

    if (!product) {
      return [];
    }

    // Find products with similar category or tags
    const similarProducts = await Product.find({
      _id: { $ne: productId },
      stock: { $gt: 0 },
      $or: [
        { category: product.category },
        { tags: { $in: product.tags } }
      ]
    })
      .populate("category", "name")
      .limit(limit * 2);

    // Score products by similarity
    const scoredProducts = similarProducts.map(p => {
      let score = 0;

      // Same category
      if (p.category?.toString() === product.category?.toString()) {
        score += 10;
      }

      // Shared tags
      const sharedTags = p.tags?.filter(tag => 
        product.tags?.includes(tag)
      ) || [];
      score += sharedTags.length * 2;

      // Price similarity (closer price = higher score)
      const priceDiff = Math.abs(p.price - product.price);
      if (priceDiff < 10) score += 5;
      else if (priceDiff < 50) score += 3;
      else if (priceDiff < 100) score += 1;

      return { product: p, score };
    });

    // Sort by score and return
    return scoredProducts
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.product);

  } catch (error) {
    logger.error("Similar products error:", error);
    throw error;
  }
};

/**
 * Get trending products based on recent activity
 * @param {number} limit - Number of products
 * @returns {Promise<Product[]>} - Trending products
 */
export const getTrendingProducts = async (limit = 10) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get most viewed products in last 7 days
    const trendingProductIds = await Activity.aggregate([
      { $match: { action: "view", createdAt: { $gte: sevenDaysAgo } } },
      { $group: { _id: "$product", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit }
    ]);

    if (trendingProductIds.length === 0) {
      // Fallback to top-rated products
      return await Product.find({ stock: { $gt: 0 } })
        .populate("category", "name")
        .sort({ ratings: -1, numReviews: -1 })
        .limit(limit);
    }

    const productIds = trendingProductIds.map(item => item._id);
    
    const products = await Product.find({ 
      _id: { $in: productIds },
      stock: { $gt: 0 }
    })
      .populate("category", "name");

    // Sort by view count
    const productViewCounts = trendingProductIds.reduce((acc, item) => {
      acc[item._id.toString()] = item.count;
      return acc;
    }, {});

    return products.sort((a, b) => 
      (productViewCounts[b._id.toString()] || 0) - 
      (productViewCounts[a._id.toString()] || 0)
    );

  } catch (error) {
    logger.error("Trending products error:", error);
    throw error;
  }
};

/**
 * Get recommendations for products frequently bought together
 * @param {string} productId - Product ID
 * @param {number} limit - Number of products
 * @returns {Promise<Product[]>} - Products frequently bought together
 */
export const getFrequentlyBoughtTogether = async (productId, limit = 4) => {
  try {
    // Find orders containing this product
    const orders = await Order.find({
      "orderItems.product": productId,
      orderStatus: { $ne: "Cancelled" }
    });

    // Count products bought together
    const productCounts = {};
    
    orders.forEach(order => {
      order.orderItems.forEach(item => {
        if (item.product.toString() !== productId) {
          productCounts[item.product] = (productCounts[item.product] || 0) + 1;
        }
      });
    });

    // Sort by frequency
    const sortedProductIds = Object.entries(productCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([id]) => id);

    return await Product.find({ _id: { $in: sortedProductIds } })
      .populate("category", "name");

  } catch (error) {
    logger.error("Frequently bought together error:", error);
    throw error;
  }
};

/**
 * Calculate AI score for a product
 * This can be used to rank products based on various factors
 * @param {object} product - Product object
 * @returns {number} - AI score (0-100)
 */
export const calculateAIScore = async (product) => {
  let score = 50; // Base score

  // Boost based on rating
  score += product.ratings * 5;

  // Boost based on number of reviews
  if (product.numReviews > 10) score += 10;
  else if (product.numReviews > 5) score += 5;
  else if (product.numReviews > 0) score += 2;

  // Boost based on stock (products with good stock get slightly higher score)
  if (product.stock > 50) score += 5;
  else if (product.stock > 10) score += 3;

  // Boost for discounted products
  if (product.discountPrice && product.discountPrice < product.price) {
    const discount = ((product.price - product.discountPrice) / product.price) * 100;
    score += discount * 0.2;
  }

  // Cap at 100
  return Math.min(Math.round(score), 100);
};

export default {
  getAIRecommendations,
  getPersonalizedRecommendations,
  getSimilarProducts,
  getTrendingProducts,
  getFrequentlyBoughtTogether,
  calculateAIScore
};

