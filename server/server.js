import express, { json } from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { Server } from "socket.io"; // Import Socket.IO
import http from "http"; // Required for Socket.IO
import routes from "./routes/index.js";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app); // Create HTTP server for Socket.IO
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000", // Allow your React app’s origin
        methods: ["GET", "POST"],
    },
}); // Attach Socket.IO to the server

// Middleware setup
app.use(cors());
app.use(json());

// CSS MIME type middleware
app.use((req, res, next) => {
    if (req.path.endsWith(".css")) {
        res.type("text/css");
    }
    next();
});

// API routes
app.use("/api", routes);

// Determine the client path
const clientPath = path.join(__dirname, "..", "client", "build");

// Serve static files from the client build directory
app.use(express.static(clientPath));

// Handle any requests that don't match the above (SPA fallback)
app.get("*", (req, res) => {
    res.sendFile(path.join(clientPath, "index.html"));
});

// Socket.IO connection handling
io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // Example: Send a welcome message
    socket.emit("message", "Welcome to the Socket.IO server!");

    // Example: Listen for client messages
    socket.on("clientMessage", (msg) => {
        console.log("Received from client:", msg);
        socket.emit("serverResponse", `Server received: ${msg}`);
    });

    // Handle disconnection
    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Socket.IO server available at http://localhost:${PORT}`);
});