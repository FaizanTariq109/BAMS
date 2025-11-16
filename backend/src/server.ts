import express, { Application, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

/**
 * Express Server Setup
 *
 * WHY: Creates the HTTP server for our blockchain API
 * - Handles all HTTP requests from frontend
 * - Routes requests to appropriate controllers
 * - Manages middleware (CORS, JSON parsing)
 *
 * WHAT IT DOES:
 * 1. Initializes Express app
 * 2. Sets up middleware (CORS, JSON parser)
 * 3. Registers API routes
 * 4. Starts listening on specified port
 *
 * HOW IT WORKS:
 * - Express creates HTTP server
 * - Middleware processes all requests first
 * - Routes direct requests to controllers
 * - Controllers use services to interact with blockchain
 */

const app: Application = express();
const PORT = process.env.PORT || 5000;

/**
 * Middleware Setup
 */

// CORS - Allow frontend (different origin) to make requests
// WHY: Frontend runs on localhost:3000, backend on localhost:5000
// Without CORS, browser blocks cross-origin requests
app.use(
  cors({
    origin: "http://localhost:3000", // Allow Next.js frontend
    credentials: true,
  })
);

// JSON Parser - Parse JSON request bodies
// WHY: Frontend sends data as JSON, we need to parse it
app.use(express.json());

// URL Encoded Parser - Parse form data
app.use(express.urlencoded({ extended: true }));

/**
 * Request Logger Middleware
 * WHY: Helpful for debugging
 * - See all incoming requests
 * - Track response times
 */
app.use((req: Request, res: Response, next) => {
  const start = Date.now();
  console.log(`📥 ${req.method} ${req.path}`);

  // Log response when finished
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `📤 ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`
    );
  });

  next();
});

/**
 * Health Check Route
 * WHY: Verify server is running
 * - Used by deployment platforms
 * - Quick way to test if API is alive
 */
app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

/**
 * Root Route
 */
app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "🔗 Blockchain-Based Attendance Management System API",
    version: "1.0.0",
    endpoints: {
      departments: "/api/departments",
      classes: "/api/classes",
      students: "/api/students",
      attendance: "/api/attendance",
      validation: "/api/validate",
    },
  });
});

/**
 * API Routes
 */
import departmentRoutes from "./routes/departmentRoutes";
import classRoutes from "./routes/classRoutes";
import studentRoutes from "./routes/studentRoutes";
import attendanceRoutes from "./routes/attendanceRoutes";
import validationRoutes from "./routes/validationRoutes";

/**
 * Register Routes
 */
app.use("/api/departments", departmentRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/validate", validationRoutes);

/**
 * 404 Handler - Route not found
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: "Route not found",
    path: req.path,
    method: req.method,
  });
});

/**
 * Global Error Handler
 * WHY: Catch all errors and return proper JSON response
 * - Prevents server crashes
 * - Provides useful error messages to frontend
 */
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error("❌ Error:", err);

  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

/**
 * Initialize Blockchain Service
 * WHY: Load all blockchains from storage before accepting requests
 */
import blockchainService from "./services/blockchainService";

/**
 * Start Server
 */
const startServer = async () => {
  try {
    // Initialize blockchain service (load chains from storage)
    await blockchainService.initialize();

    // Start listening for requests
    app.listen(PORT, () => {
      console.log("🚀 ================================");
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🚀 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🚀 Difficulty: ${process.env.DIFFICULTY || 4}`);
      console.log("🚀 ================================");
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Start the server
startServer();

export default app;
