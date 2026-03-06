import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "AI E-commerce API",
      version: "1.0.0",
      description: "API documentation for AI-powered E-commerce platform",
      contact: {
        name: "API Support",
        email: "support@example.com"
      }
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Development server"
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            _id: { type: "string" },
            name: { type: "string" },
            email: { type: "string", format: "email" },
            phone: { type: "string" },
            avatar: { type: "string" },
            role: { type: "string", enum: ["user", "admin"] },
            isVerified: { type: "boolean" },
            wishlist: { type: "array", items: { type: "string" } },
            addresses: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  _id: { type: "string" },
                  name: { type: "string" },
                  street: { type: "string" },
                  city: { type: "string" },
                  state: { type: "string" },
                  zipCode: { type: "string" },
                  country: { type: "string" },
                  isDefault: { type: "boolean" }
                }
              }
            },
            createdAt: { type: "string", format: "date-time" }
          }
        },
        AuthRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string", format: "password" }
          }
        },
        RegisterRequest: {
          type: "object",
          required: ["name", "email", "password"],
          properties: {
            name: { type: "string" },
            email: { type: "string", format: "email" },
            password: { type: "string", format: "password" },
            phone: { type: "string" }
          }
        },
        Product: {
          type: "object",
          properties: {
            _id: { type: "string" },
            name: { type: "string" },
            slug: { type: "string" },
            description: { type: "string" },
            price: { type: "number" },
            originalPrice: { type: "number" },
            discount: { type: "number" },
            category: { type: "string" },
            subcategory: { type: "string" },
            brand: { type: "string" },
            images: { type: "array", items: { type: "string" } },
            stock: { type: "integer" },
            soldCount: { type: "integer" },
            ratings: { type: "number" },
            numReviews: { type: "integer" },
            isFeatured: { type: "boolean" },
            isOnSale: { type: "boolean" },
            isNewArrival: { type: "boolean" },
            tags: { type: "array", items: { type: "string" } },
            specifications: { type: "object" },
            createdAt: { type: "string", format: "date-time" }
          }
        },
        Category: {
          type: "object",
          properties: {
            _id: { type: "string" },
            name: { type: "string" },
            slug: { type: "string" },
            description: { type: "string" },
            image: { type: "string" },
            parentCategory: { type: "string" },
            isActive: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" }
          }
        },
        Cart: {
          type: "object",
          properties: {
            _id: { type: "string" },
            user: { type: "string" },
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  product: { type: "string" },
                  quantity: { type: "integer" },
                  price: { type: "number" }
                }
              }
            },
            totalAmount: { type: "number" },
            createdAt: { type: "string", format: "date-time" }
          }
        },
        Order: {
          type: "object",
          properties: {
            _id: { type: "string" },
            user: { type: "string" },
            orderItems: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  product: { type: "string" },
                  name: { type: "string" },
                  quantity: { type: "integer" },
                  price: { type: "number" },
                  image: { type: "string" }
                }
              }
            },
            shippingAddress: {
              type: "object",
              properties: {
                name: { type: "string" },
                street: { type: "string" },
                city: { type: "string" },
                state: { type: "string" },
                zipCode: { type: "string" },
                country: { type: "string" }
              }
            },
            paymentMethod: { type: "string" },
            paymentStatus: { type: "string", enum: ["pending", "paid", "failed", "refunded"] },
            orderStatus: { type: "string", enum: ["processing", "shipped", "delivered", "cancelled"] },
            totalAmount: { type: "number" },
            createdAt: { type: "string", format: "date-time" }
          }
        },
        Review: {
          type: "object",
          properties: {
            _id: { type: "string" },
            product: { type: "string" },
            user: { type: "string" },
            rating: { type: "integer", minimum: 1, maximum: 5 },
            comment: { type: "string" },
            createdAt: { type: "string", format: "date-time" }
          }
        },
        Error: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string" },
            error: { type: "string" }
          }
        },
        Success: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string" },
            data: { type: "object" }
          }
        }
      }
    },
    security: [{
      bearerAuth: []
    }]
  },
  apis: ["./routes/*.js", "./controllers/*.js"]
};

export const swaggerSpec = swaggerJsdoc(options);

