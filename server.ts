import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

async function startServer() {
  const app = express();
  const PORT = 3000;

  let currentDbUrl = process.env.DATABASE_URL;
  let pool = new Pool({
    connectionString: currentDbUrl,
    ssl: currentDbUrl?.includes("localhost") ? false : { rejectUnauthorized: false },
  });

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", database: !!currentDbUrl });
  });

  app.post("/api/db/config", async (req, res) => {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    try {
      const newPool = new Pool({
        connectionString: url,
        ssl: url.includes("localhost") ? false : { rejectUnauthorized: false },
      });

      // Test the new connection
      const client = await newPool.connect();
      client.release();

      // If successful, swap pools
      const oldPool = pool;
      pool = newPool;
      currentDbUrl = url;
      
      // Close old pool asynchronously
      oldPool.end().catch(err => console.error("Error closing old pool:", err));

      res.json({ status: "ok", message: "Database connection updated" });
    } catch (err: any) {
      console.error("Failed to update database config:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Example SQL Query Route
  app.get("/api/users", async (req, res) => {
    try {
      if (!currentDbUrl) {
        return res.status(400).json({ error: "DATABASE_URL is not set" });
      }
      const result = await pool.query("SELECT * FROM users LIMIT 10");
      res.json(result.rows);
    } catch (err: any) {
      console.error("Database query error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
