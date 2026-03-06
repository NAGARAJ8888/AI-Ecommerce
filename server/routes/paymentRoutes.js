import express from "express";
import {
  createStripeIntent,
  verifyStripePaymentController,
  createRazorpayOrderController,
  verifyRazorpayPaymentController,
  getMyPayments,
  getPaymentById,
  getAllPayments,
  getPaymentStats,
  processRefund
} from "../controllers/paymentController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * /api/payments/stripe/create-intent:
 *   post:
 *     summary: Create Stripe payment intent
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             amount: 1000
 *             currency: "usd"
 *     responses:
 *       200:
 *         description: Payment intent created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 clientSecret:
 *                   type: string
 *                   example: "pi_xxx_secret_xxx"
 */

/**
 * @swagger
 * /api/payments/razorpay/create-order:
 *   post:
 *     summary: Create Razorpay order
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             amount: 1000
 *             currency: "INR"
 *     responses:
 *       200:
 *         description: Razorpay order created
 */

/**
 * @swagger
 * /api/payments:
 *   get:
 *     summary: Get user's payments
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payments retrieved successfully
 */

/**
 * @swagger
 * /api/payments/admin/all:
 *   get:
 *     summary: Get all payments (Admin only)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All payments retrieved
 */

// Stripe routes
router.post("/stripe/create-intent", protect, createStripeIntent);
router.post("/stripe/verify", protect, verifyStripePaymentController);

// Razorpay routes
router.post("/razorpay/create-order", protect, createRazorpayOrderController);
router.post("/razorpay/verify", protect, verifyRazorpayPaymentController);

// Protected routes
router.get("/", protect, getMyPayments);
router.get("/:id", protect, getPaymentById);

// Admin routes
router.get("/admin/all", protect, admin, getAllPayments);
router.get("/admin/stats", protect, admin, getPaymentStats);
router.post("/:id/refund", protect, admin, processRefund);

export default router;

