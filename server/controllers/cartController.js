import Cart from "../models/cart.js";
import Product from "../models/product.js";
import { asyncHandler, AppError } from "../middleware/errorMiddleware.js";
import { logger } from "../utils/logger.js";

/**
 * @desc    Get user cart
 * @route   GET /api/cart
 * @access  Private
 */
export const getCart = asyncHandler(async (req, res, next) => {
  let cart = await Cart.findOne({ user: req.user._id })
    .populate("items.product", "name price images discountPrice stock slug");

  if (!cart) {
    // Create empty cart if doesn't exist
    cart = await Cart.create({ user: req.user._id, items: [], totalPrice: 0 });
  }

  res.json({
    success: true,
    data: cart
  });
});

/**
 * @desc    Add item to cart
 * @route   POST /api/cart
 * @access  Private
 */
export const addToCart = asyncHandler(async (req, res, next) => {
  const { productId, quantity = 1 } = req.body;

  // Validate product exists
  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError("Product not found", 404);
  }

  // Check stock availability
  if (product.stock < quantity) {
    throw new AppError("Insufficient stock available", 400);
  }

  // Find or create cart
  let cart = await Cart.findOne({ user: req.user._id });
  
  if (!cart) {
    cart = new Cart({ user: req.user._id, items: [], totalPrice: 0 });
  }

  // Check if item already in cart
  const existingItemIndex = cart.items.findIndex(
    (item) => item.product.toString() === productId
  );

  if (existingItemIndex > -1) {
    // Update quantity
    const newQuantity = cart.items[existingItemIndex].quantity + quantity;
    
    if (newQuantity > product.stock) {
      throw new AppError("Insufficient stock available", 400);
    }
    
    cart.items[existingItemIndex].quantity = newQuantity;
    cart.items[existingItemIndex].price = product.discountPrice || product.price;
  } else {
    // Add new item
    cart.items.push({
      product: productId,
      quantity,
      price: product.discountPrice || product.price
    });
  }

  // Calculate total price
  cart.totalPrice = cart.items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  await cart.save();

  // Populate product details
  cart = await Cart.findById(cart._id)
    .populate("items.product", "name price images discountPrice stock slug");

  logger.info(`Item added to cart: ${product.name} by user ${req.user._id}`);

  res.json({
    success: true,
    data: cart
  });
});

/**
 * @desc    Update cart item quantity
 * @route   PUT /api/cart/:productId
 * @access  Private
 */
export const updateCartItem = asyncHandler(async (req, res, next) => {
  const { quantity } = req.body;

  if (!quantity || quantity < 1) {
    throw new AppError("Please provide valid quantity", 400);
  }

  const cart = await Cart.findOne({ user: req.user._id });
  
  if (!cart) {
    throw new AppError("Cart not found", 404);
  }

  const itemIndex = cart.items.findIndex(
    (item) => item.product.toString() === req.params.productId
  );

  if (itemIndex === -1) {
    throw new AppError("Item not found in cart", 404);
  }

  // Check stock
  const product = await Product.findById(cart.items[itemIndex].product);
  if (product.stock < quantity) {
    throw new AppError("Insufficient stock available", 400);
  }

  cart.items[itemIndex].quantity = quantity;

  // Recalculate total price
  cart.totalPrice = cart.items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  await cart.save();

  // Populate and return
  const updatedCart = await Cart.findById(cart._id)
    .populate("items.product", "name price images discountPrice stock slug");

  res.json({
    success: true,
    data: updatedCart
  });
});

/**
 * @desc    Remove item from cart
 * @route   DELETE /api/cart/:productId
 * @access  Private
 */
export const removeFromCart = asyncHandler(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user._id });
  
  if (!cart) {
    throw new AppError("Cart not found", 404);
  }

  cart.items = cart.items.filter(
    (item) => item.product.toString() !== req.params.productId
  );

  // Recalculate total price
  cart.totalPrice = cart.items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  await cart.save();

  // Populate and return
  const updatedCart = await Cart.findById(cart._id)
    .populate("items.product", "name price images discountPrice stock slug");

  logger.info(`Item removed from cart: ${req.params.productId} by user ${req.user._id}`);

  res.json({
    success: true,
    data: updatedCart
  });
});

/**
 * @desc    Clear cart
 * @route   DELETE /api/cart
 * @access  Private
 */
export const clearCart = asyncHandler(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user._id });
  
  if (!cart) {
    throw new AppError("Cart not found", 404);
  }

  cart.items = [];
  cart.totalPrice = 0;
  await cart.save();

  logger.info(`Cart cleared by user ${req.user._id}`);

  res.json({
    success: true,
    message: "Cart cleared successfully",
    data: cart
  });
});

/**
 * @desc    Apply coupon code
 * @route   POST /api/cart/coupon
 * @access  Private
 */
export const applyCoupon = asyncHandler(async (req, res, next) => {
  const { couponCode } = req.body;

  // Simple coupon logic (can be expanded with a Coupon model)
  const validCoupons = {
    "SAVE10": 0.10,
    "SAVE20": 0.20,
    "WELCOME": 0.15
  };

  const discount = validCoupons[couponCode.toUpperCase()];
  
  if (!discount) {
    throw new AppError("Invalid coupon code", 400);
  }

  const cart = await Cart.findOne({ user: req.user._id })
    .populate("items.product", "name price images discountPrice stock");

  if (!cart || cart.items.length === 0) {
    throw new AppError("Cart is empty", 400);
  }

  const discountAmount = cart.totalPrice * discount;
  const finalPrice = cart.totalPrice - discountAmount;

  cart.couponCode = couponCode.toUpperCase();
  cart.discountAmount = discountAmount;
  cart.finalPrice = finalPrice;
  
  await cart.save();

  res.json({
    success: true,
    data: {
      couponCode: cart.couponCode,
      discountAmount: cart.discountAmount,
      finalPrice: cart.finalPrice,
      totalPrice: cart.totalPrice
    }
  });
});

/**
 * @desc    Get cart item count
 * @route   GET /api/cart/count
 * @access  Private
 */
export const getCartCount = asyncHandler(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user._id });

  const itemCount = cart 
    ? cart.items.reduce((count, item) => count + item.quantity, 0)
    : 0;

  res.json({
    success: true,
    data: { itemCount }
  });
});

/**
 * @desc    Sync cart (merge guest cart with user cart)
 * @route   POST /api/cart/sync
 * @access  Private
 */
export const syncCart = asyncHandler(async (req, res, next) => {
  const { items } = req.body; // Array of { productId, quantity }

  let cart = await Cart.findOne({ user: req.user._id });
  
  if (!cart) {
    cart = new Cart({ user: req.user._id, items: [], totalPrice: 0 });
  }

  // Process incoming items
  for (const item of items) {
    const product = await Product.findById(item.productId);
    
    if (!product || product.stock < 1) continue;

    const existingItemIndex = cart.items.findIndex(
      (cartItem) => cartItem.product.toString() === item.productId
    );

    if (existingItemIndex > -1) {
      const newQuantity = Math.min(
        cart.items[existingItemIndex].quantity + item.quantity,
        product.stock
      );
      cart.items[existingItemIndex].quantity = newQuantity;
    } else {
      cart.items.push({
        product: item.productId,
        quantity: Math.min(item.quantity, product.stock),
        price: product.discountPrice || product.price
      });
    }
  }

  // Recalculate total price
  cart.totalPrice = cart.items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  await cart.save();

  const updatedCart = await Cart.findById(cart._id)
    .populate("items.product", "name price images discountPrice stock slug");

  logger.info(`Cart synced for user ${req.user._id}`);

  res.json({
    success: true,
    data: updatedCart
  });
});

