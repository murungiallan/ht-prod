import express, { json } from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { Server } from "socket.io";
import http from "http";
import { initializeApp, cert } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import { getAuth } from "firebase-admin/auth";
import dotenv from "dotenv";
import routes from "./routes/index.js";
import pino from "pino"; // Import pino for logging
import pinoHttp from "pino-http"; // Middleware for logging HTTP requests

dotenv.config();

// Initialize logger with conditional transport
const logger = pino({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  ...(process.env.NODE_ENV !== "production" && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname",
      },
    },
  }),
});

// Validate environment variables
const requiredEnvVars = [
  "FIREBASE_TYPE",
  "FIREBASE_PROJECT_ID",
  "FIREBASE_PRIVATE_KEY_ID",
  "FIREBASE_PRIVATE_KEY",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_CLIENT_ID",
  "FIREBASE_AUTH_URI",
  "FIREBASE_TOKEN_URI",
  "FIREBASE_AUTH_PROVIDER_X509_CERT_URL",
  "FIREBASE_CLIENT_X509_CERT_URL",
  "FIREBASE_UNIVERSE_DOMAIN",
];

requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    logger.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
});

// Construct service account credentials from environment variables
const serviceAccount = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    : undefined,
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
  universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN,
};

if (!serviceAccount.private_key) {
  logger.error("FIREBASE_PRIVATE_KEY is undefined or invalid after processing");
  process.exit(1);
}

// Initialize Firebase Admin SDK with the credentials
try {
  initializeApp({
    credential: cert(serviceAccount),
    databaseURL:
      process.env.REACT_APP_DATABASE_URL ||
      "https://healthtrack-web-app-default-rtdb.asia-southeast1.firebasedatabase.app",
  });
  logger.info("Firebase Admin SDK initialized successfully");
} catch (error) {
  logger.error({ error }, "Failed to initialize Firebase Admin SDK");
  process.exit(1);
}

const db = getDatabase();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Change to HTTP server since Heroku handles SSL
const server = http.createServer(app);

// Define allowed origins dynamically
const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5000",
  "https://healthtrack-app23-8fb2f2d8c68d.herokuapp.com",
];
if (process.env.NODE_ENV === "production") {
  allowedOrigins.push("https://healthtrack-app23-8fb2f2d8c68d.herokuapp.com");
}

// Attach Socket.IO to the HTTP server with updated CORS
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

// Socket.IO authentication middleware
const errorLogs = new Map();
const ERROR_LOG_LIMIT = 100;
const CLEANUP_INTERVAL = 15 * 60 * 1000;

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      logger.warn("Socket.IO connection attempt without token");
      return next(new Error("Authentication error: No token provided"));
    }

    const decodedToken = await getAuth().verifyIdToken(token);
    if (!decodedToken) {
      logger.warn("Socket.IO connection attempt with invalid token");
      return next(new Error("Authentication error: Invalid token"));
    }

    socket.user = decodedToken;
    logger.info({ userId: decodedToken.uid }, "Socket.IO user authenticated");
    next();
  } catch (error) {
    const clientIP = socket.handshake.headers["x-forwarded-for"] || socket.handshake.address;
    const currentCount = errorLogs.get(clientIP) || 0;

    if (currentCount < ERROR_LOG_LIMIT) {
      errorLogs.set(clientIP, currentCount + 1);
      logger.error({ error, clientIP }, "Error verifying token in Socket.IO");
    }

    if (error.code === "auth/id-token-expired") {
      return next(new Error("Authentication error: Token expired"));
    }
    if (error.code === "auth/argument-error") {
      return next(new Error("Authentication error: Invalid token format"));
    }
    return next(new Error("Authentication error: Invalid token"));
  }
});

setInterval(() => {
  errorLogs.clear();
  logger.debug("Cleared Socket.IO error logs");
}, CLEANUP_INTERVAL);

// Middleware to apply body parsing conditionally
const applyBodyParsing = (req, res, next) => {
  const contentType = req.get("Content-Type") || "";
  if (contentType.startsWith("multipart/form-data")) {
    return next();
  }
  json({ limit: "10mb" })(req, res, (err) => {
    if (err) {
      logger.error({ err }, "Body parsing error");
      return next(err);
    }
    express.urlencoded({ limit: "10mb", extended: true })(req, res, next);
  });
};

// Apply middleware
app.use(
  pinoHttp({
    logger,
    autoLogging: {
      ignore: (req) => req.url.includes("healthcheck"),
    },
    customLogLevel: (req, res, err) => {
      if (res.statusCode >= 500) return "error";
      if (res.statusCode >= 400) return "warn";
      return "info";
    },
    serializers: {
      req: (req) => ({
        method: req.method,
        url: req.url,
        headers: req.headers.authorization ? { authorization: "Bearer [REDACTED]" } : req.headers,
      }),
      res: (res) => ({
        statusCode: res.statusCode,
      }),
    },
  })
);

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.use(applyBodyParsing);

// Serve the uploads directory as static to access images
app.use("/Uploads", express.static(path.join(__dirname, "..", "uploads")));

// Middleware to attach Socket.IO to req and handle content type for CSS
app.use((req, res, next) => {
  if (req.path.endsWith(".css")) {
    res.type("text/css");
  }
  req.io = io;
  next();
});

// Use main routes
app.use("/api", routes);

// Serve client build
const clientPath = path.join(__dirname, "..", "client", "build");
app.use(express.static(clientPath));
app.get("/", (req, res) => {
  res.send("HealthTrack server running");
});
app.get("*", (req, res) => {
  res.sendFile(path.join(clientPath, "index.html"));
});

// Global error handling middleware
app.use((err, req, res, next) => {
  logger.error({ err, url: req.url, method: req.method }, "Unhandled error in request");
  res.status(500).json({ error: "Internal Server Error" });
});

io.on("connection", (socket) => {
  logger.info({ socketId: socket.id }, "A user connected via Socket.IO");

  socket.on("join", (userId) => {
    socket.join(userId);
    logger.info({ userId, socketId: socket.id }, "User joined room");
  });

  socket.on("disconnect", (reason) => {
    logger.info({ socketId: socket.id, reason }, "User disconnected");
    socket.emit("disconnection_reason", reason);
  });
});

const port = process.env.PORT || 5000;
server.listen(port, () => {
  logger.info(`Server running on port ${port}`);
  logger.info(
    `Socket.IO server available at ${process.env.BASE_URL || `http://localhost:${port}`}`
  );
});

export { db };