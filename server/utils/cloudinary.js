import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload image to Cloudinary
 * @param {string} filePath - Path to the file to upload
 * @param {object} options - Additional options for Cloudinary upload
 * @returns {Promise<object>} - Cloudinary upload result
 */
export const uploadImage = async (filePath, options = {}) => {
  try {
    const defaultOptions = {
      folder: "ai-ecommerce",
      resource_type: "image",
      ...options
    };

    const result = await cloudinary.uploader.upload(filePath, defaultOptions);
    
    // Delete local file after upload
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return {
      url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new Error("Failed to upload image");
  }
};

/**
 * Upload multiple images to Cloudinary
 * @param {string[]} filePaths - Array of file paths
 * @param {object} options - Additional options
 * @returns {Promise<object[]>} - Array of upload results
 */
export const uploadMultipleImages = async (filePaths, options = {}) => {
  try {
    const uploadPromises = filePaths.map((filePath) => uploadImage(filePath, options));
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    console.error("Cloudinary multiple upload error:", error);
    throw new Error("Failed to upload images");
  }
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<object>} - Cloudinary delete result
 */
export const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    throw new Error("Failed to delete image");
  }
};

/**
 * Delete multiple images from Cloudinary
 * @param {string[]} publicIds - Array of Cloudinary public IDs
 * @returns {Promise<object>} - Cloudinary delete result
 */
export const deleteMultipleImages = async (publicIds) => {
  try {
    const result = await cloudinary.api.delete_resources(publicIds);
    return result;
  } catch (error) {
    console.error("Cloudinary multiple delete error:", error);
    throw new Error("Failed to delete images");
  }
};

/**
 * Get optimized image URL
 * @param {string} publicId - Cloudinary public ID
 * @param {object} transformations - Additional transformations
 * @returns {string} - Optimized image URL
 */
export const getOptimizedUrl = (publicId, transformations = {}) => {
  const defaultTransformations = {
    fetch_format: "auto",
    quality: "auto",
    ...transformations
  };

  return cloudinary.url(publicId, defaultTransformations);
};

/**
 * Get responsive image URLs
 * @param {string} publicId - Cloudinary public ID
 * @returns {object} - URLs for different sizes
 */
export const getResponsiveUrls = (publicId) => {
  return {
    small: cloudinary.url(publicId, {
      width: 300,
      height: 300,
      crop: "fill",
      fetch_format: "auto",
      quality: "auto"
    }),
    medium: cloudinary.url(publicId, {
      width: 600,
      height: 600,
      crop: "fill",
      fetch_format: "auto",
      quality: "auto"
    }),
    large: cloudinary.url(publicId, {
      width: 1200,
      height: 1200,
      crop: "fill",
      fetch_format: "auto",
      quality: "auto"
    }),
    original: cloudinary.url(publicId, {
      fetch_format: "auto",
      quality: "auto"
    })
  };
};

export default cloudinary;

