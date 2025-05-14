import express, { json } from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { Server } from "socket.io";
import https from "https";
import fs from "fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import { getAuth } from "firebase-admin/auth";
import dotenv from "dotenv";
import serviceAccount from "./service-account-key.json" with { type: "json" };
import routes from "./routes/index.js";

dotenv.config();

initializeApp({
  credential: cert(serviceAccount),
  databaseURL: "https://healthtrack-9e36c-default-rtdb.asia-southeast1.firebasedatabase.app",
});

const db = getDatabase();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load SSL certificates
const key = fs.readFileSync(path.join(__dirname, '..', 'certs', 'selfsigned.key'));
const sslCert = fs.readFileSync(path.join(__dirname, '..', 'certs', 'selfsigned.crt'));
const options = {
  key: key,
  cert: sslCert,
};

const app = express();

// Create HTTPS server
const server = https.createServer(options, app);

// Attach Socket.IO to the HTTPS server
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
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
      return next(new Error("Authentication error: No token provided"));
    }

    const decodedToken = await getAuth().verifyIdToken(token);
    if (!decodedToken) {
      return next(new Error("Authentication error: Invalid token"));
    }

    socket.user = decodedToken;
    next();
  } catch (error) {
    const clientIP = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address;
    const currentCount = errorLogs.get(clientIP) || 0;

    if (currentCount < ERROR_LOG_LIMIT) {
      errorLogs.set(clientIP, currentCount + 1);
      console.error("Error verifying token in Socket.IO:", error);
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
}, CLEANUP_INTERVAL);

// Middleware to apply body parsing conditionally
const applyBodyParsing = (req, res, next) => {
  const contentType = req.get('Content-Type') || '';
  if (contentType.startsWith('multipart/form-data')) {
    // Skip JSON and URL-encoded parsing for multipart requests
    return next();
  }
  // Apply JSON and URL-encoded parsing for non-multipart requests
  json({ limit: '10mb' })(req, res, (err) => {
    if (err) return next(err);
    express.urlencoded({ limit: '10mb', extended: true })(req, res, next);
  });
};

// Apply middleware
app.use(cors({
  origin: ["https://127.0.0.1:5000", "http://127.0.0.1:3000"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(applyBodyParsing);

// Serve the uploads directory as static to access images
app.use("/Uploads", express.static(path.join(__dirname, "..", "Uploads")));

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
app.get('/', (req, res) => {
  res.send('Now using https..');
});
app.get("*", (req, res) => {
  res.sendFile(path.join(clientPath, "index.html"));
});

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("join", (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined room`);
  });

  socket.on("disconnect", (reason) => {
    console.log("User disconnected:", socket.id, "Reason:", reason);
    socket.emit("disconnection_reason", reason);
  });
});

const port = 5000;
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Socket.IO server available at https://127.0.0.1:${port}`);
});

export { db };