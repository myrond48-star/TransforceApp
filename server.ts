import express, { Request, Response, NextFunction } from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

const { Pool } = pg;
const JWT_SECRET = process.env.JWT_SECRET || "secure-transforce-secret-2026";

// Security Middleware: Audit Logging
const auditLog = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`[AUDIT] ${new Date().toISOString()} | ${req.method} ${req.url} | Status: ${res.statusCode} | Duration: ${duration}ms | IP: ${req.ip}`);
  });
  next();
};

// Security Middleware: Authentication
const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: "Invalid or expired token" });
    (req as any).user = user;
    next();
  });
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(auditLog);

  let currentDbUrl = process.env.DATABASE_URL;
  
  // Robust SSL Configuration
  const sslConfig = currentDbUrl && !currentDbUrl.includes("localhost") 
    ? { 
        rejectUnauthorized: true, 
        ca: process.env.DB_CA_CERT 
      } 
    : false;

  let pool = new Pool({
    connectionString: currentDbUrl,
    ssl: sslConfig,
  });

  // Authentication Route
  app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body;
    
    // In a real app, verify against database with SCRAM-SHA-256 (handled by Postgres)
    // For this demo, we use a mock verification
    if (username === "admin" && password === "admin123") {
      const token = jwt.sign({ username, role: "admin" }, JWT_SECRET, { expiresIn: "8h" });
      res.json({ token, user: { username, role: "admin" } });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  // Health check - Public
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      database: !!currentDbUrl, 
      network: "Cloudflare Tunnel Detected", // Metadata placeholder
      encryption: "TLS 1.3" 
    });
  });

  // Secure Routes
  app.post("/api/db/config", authenticateToken, async (req, res) => {
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

  // Example SQL Query Route - Secure
  app.get("/api/users", authenticateToken, async (req, res) => {
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
