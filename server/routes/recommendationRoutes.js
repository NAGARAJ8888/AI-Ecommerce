import express from "express";
import {
  getRecommendations,
  getSimilarProductsController,
  getTrendingProducts,
  getFrequentlyBoughtTogether,
  trackActivity,
  refreshRecommendations,
  getGuestRecommendations,
  getRecommendationAnalytics
} from "../controllers/recommendationController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * /api/recommendations/trending:
 *   get:
 *     summary: Get trending products
 *     tags: [Recommendations]
 *     responses:
 *       200:
 *         description: Trending products retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 */

/**
 * @swagger
 * /api/recommendations/guest:
 *   get:
 *     summary: Get guest recommendations
 *     tags: [Recommendations]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Guest recommendations retrieved
 */

/**
 * @swagger
 * /api/recommendations/similar/{productId}:
 *   get:
 *     summary: Get similar products
 *     tags: [Recommendations]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Similar products retrieved
 */

/**
 * @swagger
 * /api/recommendations:
 *   get:
 *     summary: Get personalized recommendations
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Personalized recommendations retrieved
 */

/**
 * @swagger
 * /api/recommendations/track:
 *   post:
 *     summary: Track user activity
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             productId: "product_id_here"
 *             action: "view"
 *     responses:
 *       200:
 *         description: Activity tracked successfully
 */

// Public routes
router.get("/trending", getTrendingProducts);
router.get("/guest", getGuestRecommendations);
router.get("/similar/:productId", getSimilarProductsController);
router.get("/frequently-bought/:productId", getFrequentlyBoughtTogether);

// Protected routes
router.get("/", protect, getRecommendations);
router.post("/track", protect, trackActivity);
router.post("/refresh", protect, refreshRecommendations);

// Admin routes
router.get("/admin/analytics", protect, admin, getRecommendationAnalytics);

export default router;

