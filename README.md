# E-Commerce and Inventory Management System — Backend API

A RESTful and real-time backend service built with **Node.js**, **Express.js**, **MongoDB**, **Mongoose**, and **Socket.IO** for managing products, shopping carts, atomic inventory updates, order lifecycles, and sales/stock analytics.

---

## Tech Stack

- **Runtime & Framework:** Node.js, Express.js (MVC Architecture)
- **Database & ODM:** MongoDB, Mongoose (Schemas, Validation, Compound Indexes, Aggregation Pipelines)
- **Authentication & Security:** `bcrypt`, JSON Web Tokens (`jsonwebtoken` — Access & Refresh Tokens), Role-Based Access Control (`customer`, `seller`, `admin`), `dotenv`
- **Real-Time & Event-Driven:** Node.js `EventEmitter`, `Socket.IO` (JWT-authenticated socket connections & role/user rooms)
- **Logging & Error Handling:** Custom request logger + centralized JSON error middleware

---

## Project Structure

```text
├── config/
│   └── db.js                  # MongoDB connection setup
├── controllers/
│   ├── authController.js      # Register, login, refresh token, logout
│   ├── userController.js      # Profile & admin user management
│   ├── categoryController.js  # Category CRUD
│   ├── productController.js   # Product CRUD, filtering, pagination
│   ├── cartController.js      # Server-validated shopping cart
│   ├── orderController.js     # Checkout, atomic stock updates, status transitions
│   └── reportController.js    # MongoDB aggregation analytics
├── events/
│   └── appEvents.js           # EventEmitter listeners & Socket.IO bridges
├── middleware/
│   ├── auth.js                # JWT verification & RBAC authorize(...)
│   ├── errorHandler.js        # Centralized error formatter
│   ├── logger.js              # HTTP request logger
│   └── validate.js            # Request payload & ObjectId validation
├── models/
│   ├── User.js
│   ├── Category.js
│   ├── Product.js
│   ├── Cart.js
│   └── Order.js
├── routes/
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── categoryRoutes.js
│   ├── productRoutes.js
│   ├── cartRoutes.js
│   ├── orderRoutes.js
│   └── reportRoutes.js
├── seed/
│   └── seed.js                # Sample users, categories, products, and orders
├── sockets/
│   └── socketHandler.js       # Socket.IO JWT auth & room subscriptions
├── .env.example
├── package.json
├── postman_collection.json
└── server.js                  # Express + HTTP + Socket.IO entry point
```

---

## Prerequisites

- **Node.js** v18+
- **MongoDB** (local instance or MongoDB Atlas URI)
- **Postman** (or Thunder Client / cURL) for API testing

---

## Environment Variables

Create a `.env` file in the root directory based on `.env.example` (do not commit `.env` to Git):

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/ecommerce_capstone
JWT_ACCESS_SECRET=your_super_secret_access_key
JWT_REFRESH_SECRET=your_super_secret_refresh_key
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

---

## Installation & Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure
