# 🛒 AI E-Commerce Platform

A full-stack AI-powered E-Commerce platform built using **Next.js, TypeScript, Node.js, Express, MongoDB, Redis, BullMQ, Stripe, and Razorpay**.

The platform provides a complete online shopping experience with product management, secure authentication, AI-powered recommendations, payment integration, inventory management, order processing, reviews, analytics, and an admin dashboard.

---

## 🚀 Features

### 👤 Authentication & Authorization

* User Registration & Login
* JWT Authentication
* Cookie-Based Authentication
* CSRF Protection
* Refresh Token Support
* User Profile Management
* Role-Based Access Control (User/Admin)

### 🛍️ Product Management

* Product Listing
* Product Search
* Featured Products
* New Arrivals
* Products on Sale
* Category-Based Products
* Product Details Page
* Product Reviews
* Product Stock Management
* Product Image Uploads

### ❤️ Wishlist

* Add Products to Wishlist
* Remove Products from Wishlist
* View Wishlist

### 🛒 Shopping Cart

* Add to Cart
* Update Quantity
* Remove Items
* Clear Cart
* Apply Coupons
* Cart Synchronization

### 📦 Order Management

* Create Orders
* Order Tracking
* Order Statistics
* Inventory Reservation
* Order Cancellation
* Payment Status Updates
* Order Workflow Management

### 💳 Payment Integration

#### Stripe

* Create Payment Intent
* Verify Payment
* Refund Processing

#### Razorpay

* Create Order
* Verify Payment
* Payment Tracking

### ⭐ Reviews & Ratings

* Add Reviews
* Edit Reviews
* Delete Reviews
* View Product Reviews
* Admin Review Management

### 🤖 AI Recommendation System

* Personalized Recommendations
* Trending Products
* Similar Products
* Frequently Bought Together
* Guest Recommendations
* User Activity Tracking
* Recommendation Analytics

### 📊 Admin Dashboard

* User Management
* Product Management
* Category Management
* Order Management
* Payment Management
* Review Management
* Recommendation Analytics
* Product Statistics

### 🔄 Background Jobs

* Recommendation Refresh Queue
* Payment Reconciliation Queue
* BullMQ Workers
* Redis-Based Job Processing

### 📚 API Documentation

* Swagger UI
* Swagger JSON Documentation

---

# 🏗️ Tech Stack

## Frontend

* Next.js (App Router)
* React
* TypeScript
* Tailwind CSS
* Radix UI
* React Hook Form
* Zod
* Recharts
* Sonner
* Lucide React

## Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT Authentication
* Cookie Parser
* Multer
* Swagger

## Queue & Caching

* Redis
* BullMQ
* ioredis

## Payments

* Stripe
* Razorpay

## Dev Tools

* Winston Logging
* Swagger API Docs

---

# 📁 Project Structure

```bash
AI-Ecommerce/
│
├── client/
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   ├── styles/
│   └── public/
│
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── queues/
│   ├── workers/
│   ├── observability/
│   ├── jobs/
│   └── utils/
│
└── README.md
```

---

# 🔐 Authentication Flow

```text
User Login
    ↓
JWT Generated
    ↓
Stored in Secure Cookie
    ↓
Protected Routes Access
    ↓
CSRF Validation
    ↓
Authorized Request
```

---

# 🤖 Recommendation Engine

The recommendation module provides:

* Personalized Recommendations
* Trending Products
* Similar Products
* Frequently Bought Together
* User Activity Tracking
* Recommendation Analytics

Background workers continuously update recommendation data using Redis queues and BullMQ.

---

# 📦 Order Workflow

```text
PENDING
   ↓
PAYMENT_PENDING
   ↓
PAID
   ↓
PROCESSING
   ↓
PACKED
   ↓
SHIPPED
   ↓
DELIVERED
```

Alternative States:

```text
PAYMENT_FAILED
CANCELLED
REFUNDED
```

---

# 🌐 API Endpoints

## Authentication

```http
POST   /api/users/register
POST   /api/users/login
POST   /api/users/logout
POST   /api/users/refresh
GET    /api/users/me
```

## Products

```http
GET    /api/products
GET    /api/products/search
GET    /api/products/featured
GET    /api/products/sale
GET    /api/products/new
POST   /api/products
PUT    /api/products/:id
DELETE /api/products/:id
```

## Cart

```http
GET    /api/cart
POST   /api/cart
PUT    /api/cart/:productId
DELETE /api/cart/:productId
```

## Orders

```http
POST   /api/orders
GET    /api/orders
GET    /api/orders/:id
PUT    /api/orders/:id/status
PUT    /api/orders/:id/cancel
```

## Payments

```http
POST /api/payments/stripe/create-intent
POST /api/payments/stripe/verify

POST /api/payments/razorpay/create-order
POST /api/payments/razorpay/verify
```

---

# ⚙️ Environment Variables

Create a `.env` file in the server directory:

```env
PORT=5000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret

JWT_EXPIRE_ACCESS=10m

FRONTEND_URL=http://localhost:3000

REDIS_HOST=localhost
REDIS_PORT=6379

STRIPE_SECRET_KEY=your_stripe_secret

RAZORPAY_KEY_ID=your_key_id
RAZORPAY_SECRET=your_secret
```

---

# 🚀 Installation

## Clone Repository

```bash
git clone https://github.com/yourusername/AI-Ecommerce.git
```

```bash
cd AI-Ecommerce
```

---

## Backend Setup

```bash
cd server

npm install

npm run dev
```

---

## Frontend Setup

```bash
cd client

npm install

npm run dev
```

---

## Redis Setup

Make sure Redis is running:

```bash
redis-server
```

---

# 📚 API Documentation

After running the backend:

```text
http://localhost:5000/api-docs
```

Swagger documentation:

```text
http://localhost:5000/api-docs.json
```

---

# 🔒 Security Features

* JWT Authentication
* Cookie-Based Sessions
* CSRF Protection
* Role-Based Authorization
* Rate Limiting
* Secure Headers
* CORS Protection
* Input Validation

---

# 📈 Future Enhancements

* AI Chat Shopping Assistant
* Product Image Search
* Real-Time Notifications
* Multi-Vendor Marketplace
* Advanced Recommendation Models
* Sales Forecasting
* Mobile Application

---

# 👨‍💻 Author

**Nagaraj Botekar**

* GitHub: https://github.com/NAGARAJ8888
* LinkedIn: https://www.linkedin.com/in/nagaraj-botekar-s406/
* Email: [nagaraj81471@gmail.com](mailto:nagaraj81471@gmail.com)

---

# ⭐ Support

If you like this project, please give it a ⭐ on GitHub and contribute to make it even better.
