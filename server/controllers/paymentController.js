import Payment from "../models/payment.js";
import Order from "../models/order.js";
import { asyncHandler, AppError } from "../middleware/errorMiddleware.js";
import { logger } from "../utils/logger.js";
import { createStripePayment } from "../services/paymentService.js";
import { verifyStripePayment } from "../services/paymentService.js";
import { createRazorpayOrder } from "../services/paymentService.js";
import { verifyRazorpayPayment } from "../services/paymentService.js";
import {
  verifyPaymentAndFinalize,
  refundPaymentIdempotent
} from "../services/paymentWorkflow/paymentWorkflowService.js";

import { enqueuePaymentOrderReconciliation } from "../jobs/reconciliation/enqueuePaymentOrderReconciliation.js";

function enqueueReconciliationBestEffort(payload) {
  try {
    // Do not block payment APIs.
    return enqueuePaymentOrderReconciliation(payload).catch((e) => {
      logger.warn("reconciliation_enqueue_failed", {
        error: e?.message,
        provider: payload?.context?.provider,
        orderId: payload?.orderId,
        paymentId: payload?.paymentId
      });
    });
  } catch (e) {
    logger.warn("reconciliation_enqueue_failed_sync", {
      error: e?.message,
      provider: payload?.context?.provider,
      orderId: payload?.orderId,
      paymentId: payload?.paymentId
    });
    return null;
  }
}



/**

 * @desc    Create Stripe payment intent
 * @route   POST /api/payments/stripe/create-intent
 * @access  Private
 */
export const createStripeIntent = asyncHandler(async (req, res, next) => {
  const { orderId, amount } = req.body;

  // Validate order
  const order = await Order.findById(orderId);
  
  if (!order) {
    throw new AppError("Order not found", 404);
  }

  if (order.user.toString() !== req.user._id.toString()) {
    throw new AppError("Not authorized", 403);
  }

  // Create Stripe payment intent
  const paymentIntent = await createStripePayment(amount * 100, "usd", {
    orderId: order._id.toString(),
    userId: req.user._id.toString()
  });

  res.json({
    success: true,
    data: {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    }
  });
});

/**
 * @desc    Verify Stripe payment
 * @route   POST /api/payments/stripe/verify
 * @access  Private
 */
export const verifyStripePaymentController = asyncHandler(async (req, res, next) => {
  const { paymentIntentId, orderId, providerEventId, idempotencyKey } = req.body;

  try {
    const createdPayment = await verifyPaymentAndFinalize({
      provider: "stripe",
      transactionId: paymentIntentId,
      providerEventId,
      idempotencyKey,
      userId: req.user._id,
      orderId,
      amount: undefined,
      changedBy: req.user._id
    });

    const order = await Order.findById(orderId);
    req?.logger?.info?.("payment_verified", { provider: "stripe", orderId: order?._id, transactionId: paymentIntentId });


    // STEP 9: best-effort reconciliation enqueue (non-blocking)
    enqueueReconciliationBestEffort({
      paymentId: paymentIntentId,
      orderId,
      provider: "stripe",
      context: {
        provider: "stripe",
        transactionId: paymentIntentId
      },
      correlation: {
        requestId: req?.headers?.["x-request-id"] || undefined
      },
      sourceWorkflow: "payment_verification"
    });

    // STEP 9: enqueue reconciliation best-effort (non-blocking)
    enqueueReconciliationBestEffort({
      paymentId: razorpayPaymentId,
      orderId,
      provider: "razorpay",
      context: {
        provider: "razorpay",
        transactionId: razorpayPaymentId
      },
      correlation: {
        requestId: req?.headers?.["x-request-id"] || undefined
      },
      sourceWorkflow: "payment_verification"
    });

    return res.json({
      success: true,
      message: "Payment verified successfully",
      data: order
    });

  } catch (err) {

    // STEP 4: idempotency-safe duplicate handling.
    if (err?.details && (err?.statusCode === 200 || err?.statusCode === undefined)) {
      const order = await Order.findById(orderId);
      return res.json({
        success: true,
        message: "Payment already processed",
        data: order
      });
    }
    throw err;
  }
});

/**
 * @desc    Create Razorpay order
 * @route   POST /api/payments/razorpay/create-order
 * @access  Private
 */
export const createRazorpayOrderController = asyncHandler(async (req, res, next) => {
  const { orderId } = req.body;

  const order = await Order.findById(orderId);
  
  if (!order) {
    throw new AppError("Order not found", 404);
  }

  if (order.user.toString() !== req.user._id.toString()) {
    throw new AppError("Not authorized", 403);
  }

  // Create Razorpay order
  const razorpayOrder = await createRazorpayOrder(order.totalPrice * 100, "INR", {
    orderId: order._id.toString(),
    userId: req.user._id.toString()
  });

  res.json({
    success: true,
    data: {
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency
    }
  });
});

/**
 * @desc    Verify Razorpay payment
 * @route   POST /api/payments/razorpay/verify
 * @access  Private
 */
export const verifyRazorpayPaymentController = asyncHandler(async (req, res, next) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId, providerEventId, idempotencyKey } = req.body;

  // Verify Razorpay signature (correctness)
  const isValid = await verifyRazorpayPayment(
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature
  );

  if (!isValid) {
    throw new AppError("Invalid payment signature", 400);
  }

  try {
    await verifyPaymentAndFinalize({
      provider: "razorpay",
      transactionId: razorpayPaymentId,
      providerEventId,
      idempotencyKey,
      userId: req.user._id,
      orderId,
      amount: undefined,
      changedBy: req.user._id
    });

    const order = await Order.findById(orderId);
    req?.logger?.info?.("payment_verified", { provider: "razorpay", orderId: order?._id, transactionId: razorpayPaymentId });


    return res.json({
      success: true,
      message: "Payment verified successfully",
      data: order
    });
  } catch (err) {
    // STEP 4: idempotency-safe duplicate handling.
    if (err?.details && (err?.statusCode === 200 || err?.statusCode === undefined)) {
      const order = await Order.findById(orderId);
      return res.json({
        success: true,
        message: "Payment already processed",
        data: order
      });
    }
    throw err;
  }
});

/**
 * @desc    Get user's payment history
 * @route   GET /api/payments
 * @access  Private
 */
export const getMyPayments = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const payments = await Payment.find({ user: req.user._id })
    .populate("order", "orderItems totalPrice orderStatus")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Payment.countDocuments({ user: req.user._id });

  res.json({
    success: true,
    data: payments,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

/**
 * @desc    Get payment by ID
 * @route   GET /api/payments/:id
 * @access  Private
 */
export const getPaymentById = asyncHandler(async (req, res, next) => {
  const payment = await Payment.findById(req.params.id)
    .populate("order")
    .populate("user", "name email");

  if (!payment) {
    throw new AppError("Payment not found", 404);
  }

  // Check ownership or admin
  if (payment.user._id.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    throw new AppError("Not authorized", 403);
  }

  res.json({
    success: true,
    data: payment
  });
});

/**
 * @desc    Get all payments (admin)
 * @route   GET /api/payments/admin/all
 * @access  Private/Admin
 */
export const getAllPayments = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  // Filter options
  let query = {};
  if (req.query.status) {
    query.status = req.query.status;
  }
  if (req.query.provider) {
    query.provider = req.query.provider;
  }

  const payments = await Payment.find(query)
    .populate("user", "name email")
    .populate("order", "totalPrice orderStatus")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Payment.countDocuments(query);

  res.json({
    success: true,
    data: payments,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

/**
 * @desc    Get payment statistics (admin)
 * @route   GET /api/payments/admin/stats
 * @access  Private/Admin
 */
export const getPaymentStats = asyncHandler(async (req, res, next) => {
  const totalPayments = await Payment.countDocuments();
  const completedPayments = await Payment.countDocuments({ status: "completed" });
  const failedPayments = await Payment.countDocuments({ status: "failed" });

  const revenue = await Payment.aggregate([
    { $match: { status: "completed" } },
    {
      $group: {
        _id: null,
        total: { $sum: "$amount" }
      }
    }
  ]);

  const providerStats = await Payment.aggregate([
    { $match: { status: "completed" } },
    {
      $group: {
        _id: "$provider",
        count: { $sum: 1 },
        total: { $sum: "$amount" }
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      totalPayments,
      completedPayments,
      failedPayments,
      totalRevenue: revenue[0]?.total || 0,
      providerStats: providerStats.reduce((acc, curr) => {
        acc[curr._id] = { count: curr.count, total: curr.total };
        return acc;
      }, {})
    }
  });
});

/**
 * @desc    Process refund
 * @route   POST /api/payments/:id/refund
 * @access  Private/Admin
 */
export const processRefund = asyncHandler(async (req, res, next) => {
  const payment = await Payment.findById(req.params.id);

  if (!payment) {
    throw new AppError("Payment not found", 404);
  }

  if (payment.status !== "completed") {
    // STEP 4: refund idempotency.
    if (payment.status === "refunded") {
      return res.json({
        success: true,
        message: "Refund already processed",
        data: payment
      });
    }
    throw new AppError("Can only refund completed payments", 400);
  }

  try {
    const { refundId } = req.body || {};
    const refunded = await refundPaymentIdempotent({
      paymentId: payment._id,
      provider: payment.provider,
      refundId,
      changedBy: req.user._id
    });

    logger.info(`Refund processed for payment ${payment._id}`);

    return res.json({
      success: true,
      message: "Refund processed successfully",
      data: refunded
    });
  } catch (err) {
    if (err?.details && (err?.statusCode === 200 || err?.statusCode === undefined)) {
      return res.json({
        success: true,
        message: "Refund already processed",
        data: payment
      });
    }
    throw err;
  }
});

