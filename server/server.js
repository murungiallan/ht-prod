import express, { json } from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import routes from "./routes/index.js";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware setup
app.use(cors());
app.use(json());

// CSS MIME type middleware
app.use((req, res, next) => {
    if (req.path.endsWith('.css')) {
      res.type('text/css');
    }
    next();
});

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use("/api", routes);

// Handle any requests that don't match the above
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname.parent(), 'client', 'public', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));