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
import pino from "pino";
import pinoHttp from "pino-http";

dotenv.config();

// Initialize logger for production
const logger = pino({
  level: "info",
  redact: ["req.headers.authorization"],
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
  "CLIENT_URL",
  "REACT_APP_DATABASE_URL",
  "PORT",
];

requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    logger.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
});

// Construct Firebase service account credentials
const serviceAccount = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
  universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN,
};

// Initialize Firebase Admin SDK
try {
  initializeApp({
    credential: cert(serviceAccount),
    databaseURL: process.env.REACT_APP_DATABASE_URL,
  });
  logger.info("Firebase Admin SDK initialized successfully");
} catch (error) {
  logger.error({ error: error.message }, "Failed to initialize Firebase Admin SDK");
  process.exit(1);
}

const db = getDatabase();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Define allowed origins for production
const allowedOrigins = [
  process.env.CLIENT_URL,
  "https://healthtrack-app23-8fb2f2d8c68d.herokuapp.com",
];

// Initialize Socket.IO with strict CORS
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

// Socket.IO authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      logger.warn("Socket.IO connection attempt without token");
      return next(new Error("Authentication error: No token provided"));
    }

    const decodedToken = await getAuth().verifyIdToken(token);
    socket.user = decodedToken;
    logger.info({ userId: decodedToken.uid }, "Socket.IO user authenticated");
    next();
  } catch (error) {
    const clientIP = socket.handshake.headers["x-forwarded-for"] || socket.handshake.address;
    logger.error({ error: error.message, clientIP }, "Error verifying token in Socket.IO");
    if (error.code === "auth/id-token-expired") {
      return next(new Error("Authentication error: Token expired"));
    }
    if (error.code === "auth/argument-error") {
      return next(new Error("Authentication error: Invalid token format"));
    }
    return next(new Error("Authentication error: Invalid token"));
  }
});

// Middleware to parse JSON bodies, excluding multipart/form-data
const applyBodyParsing = (req, res, next) => {
  const contentType = req.get("Content-Type") || "";
  if (contentType.startsWith("multipart/form-data")) {
    return next();
  }
  json({ limit: "10mb" })(req, res, (err) => {
    if (err) {
      logger.error({ err: err.message }, "Body parsing error");
      return res.status(400).json({ error: "Invalid JSON payload" });
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

// Serve the uploads directory as static
app.use("/Uploads", express.static(path.join(__dirname, "..", "Uploads")));

// Attach Socket.IO to req
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Use API routes
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
// app.use((err, req, res, next) => {
//   logger.error({
//     error: err.message,
//     stack: err.stack,
//     request: {
//       method: req.method,
//       url: req.url,
//       headers: req.headers.authorization ? { authorization: "Bearer [REDACTED]" } : req.headers,
//     },
//   }, "Unhandled error in request");
//   res.status(500).json({ error: "Internal Server Error" });
// });

// Socket.IO connection handling
io.on("connection", (socket) => {
  logger.info({ socketId: socket.id }, "A user connected via Socket.IO");

  socket.on("join", (userId) => {
    socket.join(userId);
    logger.info({ userId, socketId: socket.id }, "User joined room");
  });

  socket.on("disconnect", (reason) => {
    logger.info({ socketId: socket.id, reason }, "User disconnected");
  });
});

// Start server
const port = process.env.PORT;
server.listen(port, () => {
  logger.info(`Server running on port ${port}`);
  logger.info(`Socket.IO server available at ${process.env.BASE_URL}`);
});

export { db };