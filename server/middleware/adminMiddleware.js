import User from "../models/user.js";

/**
 * Admin middleware - check if user is admin
 */
export const admin = async (req, res, next) => {
  try {
    // First check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, please login first"
      });
    }

    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required."
      });
    }

    next();
  } catch (error) {
    console.error("Admin middleware error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error in admin authorization"
    });
  }
};

/**
 * Check if user has specific role
 */
export const checkRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, please login first"
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${roles.join(", ")}`
      });
    }

    next();
  };
};

/**
 * Verify if user is the owner or admin
 */
export const isOwnerOrAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, please login first"
      });
    }

    // User is admin or the owner
    if (req.user.role === "admin" || req.user._id.toString() === req.params.id) {
      next();
    } else {
      return res.status(403).json({
        success: false,
        message: "Not authorized to perform this action"
      });
    }
  } catch (error) {
    console.error("Owner/Admin check error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error in authorization"
    });
  }
};

