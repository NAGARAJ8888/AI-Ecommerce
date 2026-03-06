import Category from "../models/category.js";
import Product from "../models/product.js";
import { asyncHandler, AppError } from "../middleware/errorMiddleware.js";
import { uploadImage, deleteImage } from "../utils/cloudinary.js";
import { logger } from "../utils/logger.js";

/**
 * @desc    Get all categories
 * @route   GET /api/categories
 * @access  Public
 */
export const getCategories = asyncHandler(async (req, res, next) => {
  const categories = await Category.find().sort({ name: 1 });

  res.json({
    success: true,
    data: categories
  });
});

/**
 * @desc    Get single category
 * @route   GET /api/categories/:id
 * @access  Public
 */
export const getCategoryById = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    throw new AppError("Category not found", 404);
  }

  res.json({
    success: true,
    data: category
  });
});

/**
 * @desc    Get category by slug
 * @route   GET /api/categories/slug/:slug
 * @access  Public
 */
export const getCategoryBySlug = asyncHandler(async (req, res, next) => {
  const category = await Category.findOne({ slug: req.params.slug });

  if (!category) {
    throw new AppError("Category not found", 404);
  }

  res.json({
    success: true,
    data: category
  });
});

/**
 * @desc    Create new category
 * @route   POST /api/categories
 * @access  Private/Admin
 */
export const createCategory = asyncHandler(async (req, res, next) => {
  const { name, slug, description } = req.body;

  // Check if slug exists
  const slugExists = await Category.findOne({ slug });
  if (slugExists) {
    throw new AppError("Category with this slug already exists", 400);
  }

  // Handle image upload
  let image = null;
  if (req.file) {
    const result = await uploadImage(req.file.path);
    image = {
      url: result.url,
      public_id: result.public_id
    };
  }

  const category = await Category.create({
    name,
    slug,
    description,
    image: image?.url || null
  });

  logger.info(`Category created: ${category.name}`);

  res.status(201).json({
    success: true,
    data: category
  });
});

/**
 * @desc    Update category
 * @route   PUT /api/categories/:id
 * @access  Private/Admin
 */
export const updateCategory = asyncHandler(async (req, res, next) => {
  const { name, description } = req.body;

  let category = await Category.findById(req.params.id);

  if (!category) {
    throw new AppError("Category not found", 404);
  }

  // Handle image upload
  if (req.file) {
    // Delete old image if exists
    if (category.image) {
      const publicId = category.image.split("/").pop().split(".")[0];
      await deleteImage(`ai-ecommerce/${publicId}`);
    }

    const result = await uploadImage(req.file.path);
    category.image = result.url;
  }

  // Update fields
  category.name = name || category.name;
  category.description = description || category.description;

  await category.save();

  logger.info(`Category updated: ${category.name}`);

  res.json({
    success: true,
    data: category
  });
});

/**
 * @desc    Delete category
 * @route   DELETE /api/categories/:id
 * @access  Private/Admin
 */
export const deleteCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    throw new AppError("Category not found", 404);
  }

  // Check if category has products
  const productCount = await Product.countDocuments({ category: category._id });
  if (productCount > 0) {
    throw new AppError("Cannot delete category with associated products", 400);
  }

  // Delete image from Cloudinary
  if (category.image) {
    const publicId = category.image.split("/").pop().split(".")[0];
    await deleteImage(`ai-ecommerce/${publicId}`);
  }

  await category.deleteOne();

  logger.info(`Category deleted: ${category.name}`);

  res.json({
    success: true,
    message: "Category deleted successfully"
  });
});

/**
 * @desc    Get category with products
 * @route   GET /api/categories/:id/products
 * @access  Public
 */
export const getCategoryWithProducts = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const skip = (page - 1) * limit;

  const category = await Category.findById(req.params.id);

  if (!category) {
    throw new AppError("Category not found", 404);
  }

  const products = await Product.find({ category: category._id })
    .populate("category", "name slug")
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await Product.countDocuments({ category: category._id });

  res.json({
    success: true,
    data: {
      category,
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

/**
 * @desc    Get popular categories
 * @route   GET /api/categories/popular
 * @access  Public
 */
export const getPopularCategories = asyncHandler(async (req, res, next) => {
  const limit = parseInt(req.query.limit) || 6;

  // Get categories with most products
  const categories = await Category.aggregate([
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "category",
        as: "products"
      }
    },
    {
      $addFields: {
        productCount: { $size: "$products" }
      }
    },
    {
      $sort: { productCount: -1 }
    },
    {
      $limit: limit
    }
  ]);

  res.json({
    success: true,
    data: categories
  });
});

