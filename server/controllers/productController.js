import Product from "../models/product.js";
import Category from "../models/category.js";
import Review from "../models/review.js";
import { asyncHandler, AppError } from "../middleware/errorMiddleware.js";
import { uploadImage, deleteImage } from "../utils/cloudinary.js";
import { logger } from "../utils/logger.js";
import fs from "fs";

/**
 * @desc    Get all products
 * @route   GET /api/products
 * @access  Public
 */
export const getProducts = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const skip = (page - 1) * limit;

  // Build query
  let query = {};

  // Search functionality
  if (req.query.search) {
    query.$or = [
      { name: { $regex: req.query.search, $options: "i" } },
      { description: { $regex: req.query.search, $options: "i" } },
      { tags: { $in: [new RegExp(req.query.search, "i")] } }
    ];
  }

  // Category filter
  if (req.query.category) {
    query.category = req.query.category;
  }

  // Brand filter
  if (req.query.brand) {
    query.brand = { $in: req.query.brand.split(",") };
  }

  // Price range filter
  if (req.query.minPrice || req.query.maxPrice) {
    query.price = {};
    if (req.query.minPrice) query.price.$gte = parseInt(req.query.minPrice);
    if (req.query.maxPrice) query.price.$lte = parseInt(req.query.maxPrice);
  }

  // Rating filter
  if (req.query.rating) {
    query.ratings = { $gte: parseInt(req.query.rating) };
  }

  // In stock filter
  if (req.query.inStock === "true") {
    query.stock = { $gt: 0 };
  }

  // Sort options
  let sort = { createdAt: -1 };
  if (req.query.sort) {
    switch (req.query.sort) {
      case "price_asc":
        sort = { price: 1 };
        break;
      case "price_desc":
        sort = { price: -1 };
        break;
      case "rating":
        sort = { ratings: -1 };
        break;
      case "newest":
        sort = { createdAt: -1 };
        break;
      case "popularity":
        sort = { numReviews: -1 };
        break;
      default:
        sort = { createdAt: -1 };
    }
  }

  const products = await Product.find(query)
    .populate("category", "name slug")
    .skip(skip)
    .limit(limit)
    .sort(sort);

  const total = await Product.countDocuments(query);

  res.json({
    success: true,
    data: products,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

/**
 * @desc    Get single product
 * @route   GET /api/products/:id
 * @access  Public
 */
export const getProductById = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id)
    .populate("category", "name slug description")
    .populate({
      path: "reviews",
      populate: { path: "user", select: "name avatar" }
    });

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  res.json({
    success: true,
    data: product
  });
});

/**
 * @desc    Get product by slug
 * @route   GET /api/products/slug/:slug
 * @access  Public
 */
export const getProductBySlug = asyncHandler(async (req, res, next) => {
  const product = await Product.findOne({ slug: req.params.slug })
    .populate("category", "name slug description")
    .populate({
      path: "reviews",
      populate: { path: "user", select: "name avatar" }
    });

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  res.json({
    success: true,
    data: product
  });
});

/**
 * @desc    Create new product
 * @route   POST /api/products
 * @access  Private/Admin
 */
export const createProduct = asyncHandler(async (req, res, next) => {
  const { name, slug, description, price, discountPrice, category, brand, stock, tags } = req.body;

  // Check if slug exists
  const slugExists = await Product.findOne({ slug });
  if (slugExists) {
    throw new AppError("Product with this slug already exists", 400);
  }

  // Handle image uploads
  let images = [];
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const result = await uploadImage(file.path);
      images.push({
        url: result.url,
        public_id: result.public_id
      });
    }
  }

  const product = await Product.create({
    name,
    slug,
    description,
    price,
    discountPrice,
    category,
    brand,
    stock,
    tags: tags ? tags.split(",").map(tag => tag.trim()) : [],
    images,
    aiScore: Math.random() * 100 // Simulated AI score
  });

  logger.info(`Product created: ${product.name}`);

  res.status(201).json({
    success: true,
    data: product
  });
});

/**
 * @desc    Update product
 * @route   PUT /api/products/:id
 * @access  Private/Admin
 */
export const updateProduct = asyncHandler(async (req, res, next) => {
  const { name, description, price, discountPrice, category, brand, stock, tags, aiScore } = req.body;

  let product = await Product.findById(req.params.id);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  // Handle new image uploads
  if (req.files && req.files.length > 0) {
    // Delete old images from Cloudinary
    for (const img of product.images) {
      await deleteImage(img.public_id);
    }

    // Upload new images
    const newImages = [];
    for (const file of req.files) {
      const result = await uploadImage(file.path);
      newImages.push({
        url: result.url,
        public_id: result.public_id
      });
    }

    product.images = newImages;
  }

  // Update fields
  product.name = name || product.name;
  product.description = description || product.description;
  product.price = price || product.price;
  product.discountPrice = discountPrice || product.discountPrice;
  product.category = category || product.category;
  product.brand = brand || product.brand;
  product.stock = stock !== undefined ? stock : product.stock;
  product.tags = tags ? tags.split(",").map(tag => tag.trim()) : product.tags;
  product.aiScore = aiScore || product.aiScore;

  await product.save();

  logger.info(`Product updated: ${product.name}`);

  res.json({
    success: true,
    data: product
  });
});

/**
 * @desc    Delete product
 * @route   DELETE /api/products/:id
 * @access  Private/Admin
 */
export const deleteProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  // Delete images from Cloudinary
  for (const img of product.images) {
    await deleteImage(img.public_id);
  }

  // Delete all reviews for this product
  await Review.deleteMany({ product: product._id });

  await product.deleteOne();

  logger.info(`Product deleted: ${product.name}`);

  res.json({
    success: true,
    message: "Product deleted successfully"
  });
});

/**
 * @desc    Get featured products
 * @route   GET /api/products/featured
 * @access  Public
 */
export const getFeaturedProducts = asyncHandler(async (req, res, next) => {
  const limit = parseInt(req.query.limit) || 10;

  const products = await Product.find({ stock: { $gt: 0 } })
    .populate("category", "name slug")
    .sort({ ratings: -1, numReviews: -1 })
    .limit(limit);

  res.json({
    success: true,
    data: products
  });
});

/**
 * @desc    Get products on sale
 * @route   GET /api/products/sale
 * @access  Public
 */
export const getProductsOnSale = asyncHandler(async (req, res, next) => {
  const limit = parseInt(req.query.limit) || 10;

  const products = await Product.find({ 
    discountPrice: { $exists: true, $gt: 0 },
    stock: { $gt: 0 }
  })
    .populate("category", "name slug")
    .sort({ createdAt: -1 })
    .limit(limit);

  res.json({
    success: true,
    data: products
  });
});

/**
 * @desc    Get new arrivals
 * @route   GET /api/products/new
 * @access  Public
 */
export const getNewArrivals = asyncHandler(async (req, res, next) => {
  const limit = parseInt(req.query.limit) || 10;

  const products = await Product.find({ stock: { $gt: 0 } })
    .populate("category", "name slug")
    .sort({ createdAt: -1 })
    .limit(limit);

  res.json({
    success: true,
    data: products
  });
});

/**
 * @desc    Get products by category
 * @route   GET /api/products/category/:categoryId
 * @access  Public
 */
export const getProductsByCategory = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const skip = (page - 1) * limit;

  const products = await Product.find({ 
    category: req.params.categoryId,
    stock: { $gt: 0 }
  })
    .populate("category", "name slug")
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await Product.countDocuments({ 
    category: req.params.categoryId,
    stock: { $gt: 0 }
  });

  res.json({
    success: true,
    data: products,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

/**
 * @desc    Search products
 * @route   GET /api/products/search
 * @access  Public
 */
export const searchProducts = asyncHandler(async (req, res, next) => {
  const { keyword } = req.query;
  const limit = parseInt(req.query.limit) || 20;

  if (!keyword) {
    throw new AppError("Please provide a search keyword", 400);
  }

  const products = await Product.find({
    $or: [
      { name: { $regex: keyword, $options: "i" } },
      { description: { $regex: keyword, $options: "i" } },
      { brand: { $regex: keyword, $options: "i" } },
      { tags: { $in: [new RegExp(keyword, "i")] } }
    ]
  })
    .populate("category", "name slug")
    .limit(limit);

  res.json({
    success: true,
    data: products,
    count: products.length
  });
});

/**
 * @desc    Get all brands
 * @route   GET /api/products/brands
 * @access  Public
 */
export const getAllBrands = asyncHandler(async (req, res, next) => {
  const brands = await Product.distinct("brand", { brand: { $exists: true, $ne: "" } });

  res.json({
    success: true,
    data: brands
  });
});

/**
 * @desc    Update product stock
 * @route   PUT /api/products/:id/stock
 * @access  Private/Admin
 */
export const updateProductStock = asyncHandler(async (req, res, next) => {
  const { stock } = req.body;

  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { stock },
    { new: true }
  );

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  res.json({
    success: true,
    data: product
  });
});

/**
 * @desc    Get product statistics (admin)
 * @route   GET /api/products/stats
 * @access  Private/Admin
 */
export const getProductStats = asyncHandler(async (req, res, next) => {
  const totalProducts = await Product.countDocuments();
  const outOfStock = await Product.countDocuments({ stock: 0 });
  const lowStock = await Product.countDocuments({ stock: { $gt: 0, $lte: 10 } });
  const totalValue = await Product.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: { $multiply: ["$price", "$stock"] } }
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      totalProducts,
      outOfStock,
      lowStock,
      inStock: totalProducts - outOfStock,
      totalInventoryValue: totalValue[0]?.total || 0
    }
  });
});

