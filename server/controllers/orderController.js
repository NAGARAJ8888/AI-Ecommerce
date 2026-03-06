import Order from "../models/order.js";
import Cart from "../models/cart.js";
import Product from "../models/product.js";
import Payment from "../models/payment.js";
import { asyncHandler, AppError } from "../middleware/errorMiddleware.js";
import { logger } from "../utils/logger.js";

/**
 * @desc    Create new order
 * @route   POST /api/orders
 * @access  Private
 */
export const createOrder = asyncHandler(async (req, res, next) => {
  const { shippingAddress, paymentMethod, paymentInfo } = req.body;

  // Get user's cart
  const cart = await Cart.findOne({ user: req.user._id })
    .populate("items.product", "name price images discountPrice stock");

  if (!cart || cart.items.length === 0) {
    throw new AppError("Cart is empty", 400);
  }

  // Validate stock for all items
  for (const item of cart.items) {
    if (item.product.stock < item.quantity) {
      throw new AppError(`Insufficient stock for ${item.product.name}`, 400);
    }
  }

  // Create order items
  const orderItems = cart.items.map((item) => ({
    product: item.product._id,
    name: item.product.name,
    price: item.price,
    quantity: item.quantity,
    image: item.product.images[0]?.url || ""
  }));

  // Calculate prices
  const totalPrice = cart.totalPrice;
  const shippingCost = totalPrice > 100 ? 0 : 10; // Free shipping over $100
  const tax = totalPrice * 0.1; // 10% tax
  const finalPrice = totalPrice + shippingCost + tax;

  // Create order
  const order = await Order.create({
    user: req.user._id,
    orderItems,
    shippingAddress,
    paymentMethod,
    paymentInfo: paymentInfo || { id: "pending", status: "pending" },
    totalPrice: finalPrice,
    shippingCost,
    tax,
    orderStatus: "Processing"
  });

  // Update product stock
  for (const item of cart.items) {
    await Product.findByIdAndUpdate(item.product._id, {
      $inc: { stock: -item.quantity }
    });
  }

  // Clear cart after successful order
  cart.items = [];
  cart.totalPrice = 0;
  await cart.save();

  logger.info(`Order created: ${order._id} by user ${req.user._id}`);

  res.status(201).json({
    success: true,
    data: order
  });
});

/**
 * @desc    Get user's orders
 * @route   GET /api/orders
 * @access  Private
 */
export const getMyOrders = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const orders = await Order.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Order.countDocuments({ user: req.user._id });

  res.json({
    success: true,
    data: orders,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

/**
 * @desc    Get single order
 * @route   GET /api/orders/:id
 * @access  Private
 */
export const getOrderById = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate("user", "name email")
    .populate("orderItems.product", "name images");

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  // Check if user owns the order or is admin
  if (
    order.user._id.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    throw new AppError("Not authorized to view this order", 403);
  }

  res.json({
    success: true,
    data: order
  });
});

/**
 * @desc    Update order status
 * @route   PUT /api/orders/:id/status
 * @access  Private/Admin
 */
export const updateOrderStatus = asyncHandler(async (req, res, next) => {
  const { orderStatus } = req.body;

  const validStatuses = ["Processing", "Shipped", "Delivered", "Cancelled"];

  if (!validStatuses.includes(orderStatus)) {
    throw new AppError("Invalid order status", 400);
  }

  const order = await Order.findById(req.params.id);

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  // If cancelling, restore stock
  if (orderStatus === "Cancelled" && order.orderStatus !== "Cancelled") {
    for (const item of order.orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity }
      });
    }
  }

  order.orderStatus = orderStatus;

  if (orderStatus === "Delivered") {
    order.deliveredAt = new Date();
  }

  await order.save();

  logger.info(`Order ${order._id} status updated to ${orderStatus}`);

  res.json({
    success: true,
    data: order
  });
});

/**
 * @desc    Update payment status
 * @route   PUT /api/orders/:id/payment
 * @access  Private
 */
export const updatePaymentStatus = asyncHandler(async (req, res, next) => {
  const { paymentInfo } = req.body;

  const order = await Order.findById(req.params.id);

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  // Verify ownership
  if (order.user.toString() !== req.user._id.toString()) {
    throw new AppError("Not authorized", 403);
  }

  order.paymentInfo = paymentInfo;
  await order.save();

  // Create payment record
  await Payment.create({
    user: req.user._id,
    order: order._id,
    amount: order.totalPrice,
    provider: paymentMethod || "stripe",
    status: paymentInfo.status,
    transactionId: paymentInfo.id
  });

  res.json({
    success: true,
    data: order
  });
});

/**
 * @desc    Get all orders (admin)
 * @route   GET /api/orders/admin/all
 * @access  Private/Admin
 */
export const getAllOrders = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  // Filter by status
  let query = {};
  if (req.query.status) {
    query.orderStatus = req.query.status;
  }

  // Filter by date range
  if (req.query.startDate || req.query.endDate) {
    query.createdAt = {};
    if (req.query.startDate) {
      query.createdAt.$gte = new Date(req.query.startDate);
    }
    if (req.query.endDate) {
      query.createdAt.$lte = new Date(req.query.endDate);
    }
  }

  const orders = await Order.find(query)
    .populate("user", "name email")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Order.countDocuments(query);

  res.json({
    success: true,
    data: orders,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

/**
 * @desc    Get order statistics (admin)
 * @route   GET /api/orders/admin/stats
 * @access  Private/Admin
 */
export const getOrderStats = asyncHandler(async (req, res, next) => {
  const totalOrders = await Order.countDocuments();
  const pendingOrders = await Order.countDocuments({ orderStatus: "Processing" });
  const shippedOrders = await Order.countDocuments({ orderStatus: "Shipped" });
  const deliveredOrders = await Order.countDocuments({ orderStatus: "Delivered" });
  const cancelledOrders = await Order.countDocuments({ orderStatus: "Cancelled" });

  const revenue = await Order.aggregate([
    { $match: { orderStatus: { $ne: "Cancelled" } } },
    {
      $group: {
        _id: null,
        total: { $sum: "$totalPrice" }
      }
    }
  ]);

  // Get recent orders (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const recentOrders = await Order.countDocuments({
    createdAt: { $gte: sevenDaysAgo }
  });

  res.json({
    success: true,
    data: {
      totalOrders,
      pendingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue: revenue[0]?.total || 0,
      recentOrders
    }
  });
});

/**
 * @desc    Cancel order
 * @route   PUT /api/orders/:id/cancel
 * @access  Private
 */
export const cancelOrder = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  // Verify ownership
  if (order.user.toString() !== req.user._id.toString()) {
    throw new AppError("Not authorized", 403);
  }

  // Can only cancel if not already shipped or delivered
  if (["Shipped", "Delivered", "Cancelled"].includes(order.orderStatus)) {
    throw new AppError("Cannot cancel this order", 400);
  }

  // Restore stock
  for (const item of order.orderItems) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: item.quantity }
    });
  }

  order.orderStatus = "Cancelled";
  await order.save();

  logger.info(`Order cancelled: ${order._id}`);

  res.json({
    success: true,
    message: "Order cancelled successfully",
    data: order
  });
});

/**
 * @desc    Get my orders for dashboard
 * @route   GET /api/orders/my/orders
 * @access  Private
 */
export const getMyOrderStats = asyncHandler(async (req, res, next) => {
  const totalOrders = await Order.countDocuments({ user: req.user._id });
  const deliveredOrders = await Order.countDocuments({
    user: req.user._id,
    orderStatus: "Delivered"
  });

  const totalSpent = await Order.aggregate([
    { 
      $match: { 
        user: req.user._id,
        orderStatus: { $ne: "Cancelled" }
      } 
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$totalPrice" }
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      totalOrders,
      deliveredOrders,
      totalSpent: totalSpent[0]?.total || 0
    }
  });
});

