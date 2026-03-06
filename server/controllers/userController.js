import User from "../models/user.js";
import { asyncHandler, AppError } from "../middleware/errorMiddleware.js";
import { generateToken } from "../middleware/authMiddleware.js";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

/**
 * @desc    Register new user
 * @route   POST /api/users/register
 * @access  Public
 */
export const registerUser = asyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body;

  // Check if user exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    return next(new AppError("User already exists", 400));
  }

  // Hash password
  const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create user
  const user = await User.create({
    name,
    email,
    password: hashedPassword
  });

  if (user) {
    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        token: generateToken(user._id)
      }
    });
  } else {
    return next(new AppError("Invalid user data", 400));
  }
});

/**
 * @desc    Login user
 * @route   POST /api/users/login
 * @access  Public
 */
export const loginUser = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Check for user
  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError("Invalid credentials", 401));
  }

  // Check password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return next(new AppError("Invalid credentials", 401));
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  // Generate token
  const token = generateToken(user._id);

  res.json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      wishlist: user.wishlist,
      addresses: user.addresses,
      token
    }
  });
});

/**
 * @desc    Get user profile
 * @route   GET /api/users/profile
 * @access  Private
 */
export const getUserProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id)
    .select("-password")
    .populate("wishlist", "name price images discountPrice")
    .populate("browsingHistory.product", "name price images");

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  res.json({
    success: true,
    data: user
  });
});

/**
 * @desc    Update user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
export const updateUserProfile = asyncHandler(async (req, res, next) => {
  const { name, email, avatar, phone } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) {
    return next(new AppError("User not found", 404));
  }

  // Check if email is being changed and if it's already taken
  if (email && email !== user.email) {
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return next(new AppError("Email already in use", 400));
    }
  }

  // Update fields
  if (name) user.name = name;
  if (email) user.email = email;
  if (avatar) user.avatar = avatar;
  if (phone) user.phone = phone;

  const updatedUser = await user.save();

  res.json({
    success: true,
    data: {
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      avatar: updatedUser.avatar,
      token: generateToken(updatedUser._id)
    }
  });
});

/**
 * @desc    Update password
 * @route   PUT /api/users/password
 * @access  Private
 */
export const updatePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) {
    return next(new AppError("User not found", 404));
  }

  // Check current password
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    return next(new AppError("Current password is incorrect", 401));
  }

  // Hash new password
  const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10);
  user.password = await bcrypt.hash(newPassword, salt);

  await user.save();

  res.json({
    success: true,
    message: "Password updated successfully"
  });
});

/**
 * @desc    Get all users (admin)
 * @route   GET /api/users
 * @access  Private/Admin
 */
export const getAllUsers = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const total = await User.countDocuments();
  const users = await User.find()
    .select("-password")
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: users,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

/**
 * @desc    Get user by ID (admin)
 * @route   GET /api/users/:id
 * @access  Private/Admin
 */
export const getUserById = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id)
    .select("-password")
    .populate("wishlist", "name price images")
    .populate("browsingHistory.product", "name price images");

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  res.json({
    success: true,
    data: user
  });
});

/**
 * @desc    Update user (admin)
 * @route   PUT /api/users/:id
 * @access  Private/Admin
 */
export const updateUser = asyncHandler(async (req, res, next) => {
  const { name, email, role, avatar } = req.body;

  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new AppError("User not found", 404));
  }

  if (name) user.name = name;
  if (email) user.email = email;
  if (role) user.role = role;
  if (avatar) user.avatar = avatar;

  const updatedUser = await user.save();

  res.json({
    success: true,
    data: {
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      avatar: updatedUser.avatar
    }
  });
});

/**
 * @desc    Delete user (admin)
 * @route   DELETE /api/users/:id
 * @access  Private/Admin
 */
export const deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new AppError("User not found", 404));
  }

  await user.deleteOne();

  res.json({
    success: true,
    message: "User deleted successfully"
  });
});

/**
 * @desc    Add address to user
 * @route   POST /api/users/addresses
 * @access  Private
 */
export const addAddress = asyncHandler(async (req, res, next) => {
  const { name, phone, street, city, state, zipCode, country, isDefault } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) {
    return next(new AppError("User not found", 404));
  }

  const address = {
    name,
    phone,
    street,
    city,
    state,
    zipCode,
    country,
    isDefault: isDefault || false
  };

  // If this is set as default, unset other addresses
  if (isDefault) {
    user.addresses.forEach(addr => {
      addr.isDefault = false;
    });
  }

  user.addresses.push(address);
  await user.save();

  res.status(201).json({
    success: true,
    data: user.addresses
  });
});

/**
 * @desc    Remove address from user
 * @route   DELETE /api/users/addresses/:addressId
 * @access  Private
 */
export const removeAddress = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    return next(new AppError("User not found", 404));
  }

  const addressId = req.params.addressId;
  const addressIndex = user.addresses.findIndex(
    addr => addr._id.toString() === addressId
  );

  if (addressIndex === -1) {
    return next(new AppError("Address not found", 404));
  }

  user.addresses.splice(addressIndex, 1);
  await user.save();

  res.json({
    success: true,
    message: "Address removed successfully",
    data: user.addresses
  });
});

/**
 * @desc    Add to wishlist
 * @route   POST /api/users/wishlist/:productId
 * @access  Private
 */
export const addToWishlist = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    return next(new AppError("User not found", 404));
  }

  const productId = req.params.productId;

  // Check if product already in wishlist
  if (user.wishlist.includes(productId)) {
    return next(new AppError("Product already in wishlist", 400));
  }

  user.wishlist.push(productId);
  await user.save();

  res.json({
    success: true,
    message: "Product added to wishlist",
    data: user.wishlist
  });
});

/**
 * @desc    Remove from wishlist
 * @route   DELETE /api/users/wishlist/:productId
 * @access  Private
 */
export const removeFromWishlist = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    return next(new AppError("User not found", 404));
  }

  const productId = req.params.productId;
  const productIndex = user.wishlist.findIndex(
    id => id.toString() === productId
  );

  if (productIndex === -1) {
    return next(new AppError("Product not found in wishlist", 404));
  }

  user.wishlist.splice(productIndex, 1);
  await user.save();

  res.json({
    success: true,
    message: "Product removed from wishlist",
    data: user.wishlist
  });
});

/**
 * @desc    Track browsing history
 * @route   POST /api/users/track
 * @access  Private
 */
export const trackBrowsingHistory = asyncHandler(async (req, res, next) => {
  const { productId } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) {
    return next(new AppError("User not found", 404));
  }

  if (!productId) {
    return next(new AppError("Product ID is required", 400));
  }

  // Remove existing entry for this product if exists
  const existingIndex = user.browsingHistory.findIndex(
    item => item.product && item.product.toString() === productId
  );

  if (existingIndex !== -1) {
    user.browsingHistory.splice(existingIndex, 1);
  }

  // Add to beginning of array
  user.browsingHistory.unshift({
    product: productId,
    viewedAt: new Date()
  });

  // Keep only last 50 items
  if (user.browsingHistory.length > 50) {
    user.browsingHistory = user.browsingHistory.slice(0, 50);
  }

  await user.save();

  res.json({
    success: true,
    message: "Browsing history updated"
  });
});

/**
 * @desc    Get browsing history
 * @route   GET /api/users/history
 * @access  Private
 */
export const getBrowsingHistory = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id)
    .select("browsingHistory")
    .populate("browsingHistory.product", "name price images discountPrice");

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  res.json({
    success: true,
    data: user.browsingHistory
  });
});

/**
 * @desc    Update password (alias for compatibility)
 * @route   PUT /api/users/password
 * @access  Private
 */
export const updateUserPassword = updatePassword;

/**
 * @desc    Logout user
 * @route   POST /api/users/logout
 * @access  Private
 */
export const logoutUser = asyncHandler(async (req, res, next) => {
  res.json({
    success: true,
    message: "User logged out successfully"
  });
});
