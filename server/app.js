import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Import error handling
import { errorMiddleware, notFound, handleUncaughtException, handleUnhandledRejection } from "./middleware/errorMiddleware.js";

// Import routes
import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import recommendationRoutes from "./routes/recommendationRoutes.js";

// Import logger
import { logger } from "./utils/logger.js";

// Import Swagger
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.js";

dotenv.config();

// Initialize express
const app = express();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Handle uncaught exceptions
handleUncaughtException();
handleUnhandledRejection();

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Body parser - for raw body (webhooks)
app.use("/api/webhooks/stripe", express.raw({ type: "application/json" }));

// Body parser - for regular JSON
app.use(express.json({ limit: "10mb" }));

// URL encoded parser
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Static files (for uploads)
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/recommendations", recommendationRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "API is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development"
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to AI E-commerce API",
    version: "1.0.0",
    endpoints: {
      users: "/api/users",
      products: "/api/products",
      cart: "/api/cart",
      orders: "/api/orders",
      categories: "/api/categories",
      reviews: "/api/reviews",
      payments: "/api/payments",
      recommendations: "/api/recommendations"
    },
    health: "/api/health",
    swaggerDocs: "/api-docs.json",
    swaggerUi: "/api-docs"
  });
});

// Swagger documentation routes
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/api-docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// Error handling
app.use(notFound);
app.use(errorMiddleware);

export default app;