// server.js
import express, { json } from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { Server } from "socket.io";
import http from "http";
import routes from "./routes/index.js";
import { initializeApp, cert } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import { getAuth } from "firebase-admin/auth";
import dotenv from "dotenv";
import serviceAccount from "./service-account-key.json" with { type: "json" };

dotenv.config();

initializeApp({
  credential: cert(serviceAccount),
  databaseURL: "https://healthtrack-9e36c-default-rtdb.asia-southeast1.firebasedatabase.app",
});

const db = getDatabase();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Socket.IO authentication middleware
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
    console.error("Error verifying token in Socket.IO:", error);
    if (error.code === "auth/id-token-expired") {
      return next(new Error("Authentication error: Token expired"));
    }
    if (error.code === "auth/argument-error") {
      return next(new Error("Authentication error: Invalid token format"));
    }
    return next(new Error("Authentication error: Invalid token"));
  }
});

app.use(cors({ origin: "http://127.0.0.1:3000" }));
app.use(json());

app.use((req, res, next) => {
  if (req.path.endsWith(".css")) {
    res.type("text/css");
  }
  req.io = io;
  next();
});

app.use("/api", routes);

const clientPath = path.join(__dirname, "..", "client", "build");

app.use(express.static(clientPath));

app.get("*", (req, res) => {
  res.sendFile(path.join(clientPath, "index.html"));
});

io.on("connection", (socket) => {
  // console.log("A user connected:", socket.id);
  socket.on("disconnect", (reason) => {
    console.log("User disconnected:", socket.id, "Reason:", reason);
    socket.emit("disconnection_reason", reason);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.IO server available at http://127.0.0.1:${PORT}`);
});

export { db };