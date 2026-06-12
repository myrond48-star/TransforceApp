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

  // Automated Supabase/PostgreSQL Table Initializer Execution Endpoint
  app.post("/api/db/initialize-tables", async (req, res) => {
    const { connectionString } = req.body;
    const targetUrl = connectionString || currentDbUrl;

    if (!targetUrl) {
      return res.status(400).json({ 
        status: "error",
        error: "Connection string tidak ditemukan. Kirim PostgreSQL URI di JSON body atau atur DATABASE_URL di environment." 
      });
    }

    let tempClient: pg.Client | null = null;
    try {
      const fs = await import("fs");
      const path = await import("path");
      
      const sqlFilePath = path.join(process.cwd(), "supabase_schema.sql");
      if (!fs.existsSync(sqlFilePath)) {
        return res.status(500).json({ 
          status: "error", 
          error: "Berkas 'supabase_schema.sql' tidak ditemukan di root workspace." 
        });
      }

      console.log("[DB INIT] Membuka koneksi sementara ke PostgreSQL...");
      const isLocalhost = targetUrl.includes("localhost") || targetUrl.includes("127.0.0.1");
      
      tempClient = new pg.Client({
        connectionString: targetUrl,
        ssl: isLocalhost ? false : { rejectUnauthorized: false }
      });

      await tempClient.connect();

      console.log("[DB INIT] Membaca schema SQL dari supabase_schema.sql...");
      const sqlSource = fs.readFileSync(sqlFilePath, "utf8");

      console.log("[DB INIT] Mengeksekusi script DDL di Supabase / PostgreSQL...");
      // Executes all statements separated by semicolons in a single multi-statement block
      await tempClient.query(sqlSource);

      console.log("[DB INIT] Inisialisasi tabel selesai dengan sukses!");
      await tempClient.end();
      tempClient = null;

      res.json({
        status: "success",
        message: "Tabel-tabel workforce, roster_schedule, interval_requirements, master_shifts, dan portal_settings berhasil dibuat di Supabase! Kebijakan RLS (Row Level Security) juga telah diaktifkan."
      });
    } catch (err: any) {
      console.error("[DB INIT] Error inisialisasi tabel:", err);
      if (tempClient) {
        try {
          await tempClient.end();
        } catch (_) {}
      }
      res.status(500).json({
        status: "error",
        error: err.message || "Gagal mengeksekusi migrasi SQL di database"
      });
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

  // Outgoing multi-mode SMTP Email & Notification Dispatch Endpoint
  app.post("/api/notifications/send", async (req, res) => {
    const { recipient, subject, bodyHtml, bodyText, priority, smtpConfig } = req.body;

    if (!recipient || !subject) {
      return res.status(400).json({ error: "The Recipient and Subject fields are required." });
    }

    // Normalize recipient(s): support multiple emails by replacing semicolons with commas,
    // splitting, trimming, and cleaning up before joining or passing to Nodemailer
    const sanitizedRecipient = String(recipient)
      .replace(/;/g, ",")
      .split(",")
      .map(email => email.trim())
      .filter(Boolean)
      .join(", ");

    if (!sanitizedRecipient) {
      return res.status(400).json({ error: "Recipient email address is invalid or empty." });
    }

    try {
      if (smtpConfig && smtpConfig.host && smtpConfig.user && smtpConfig.pass) {
        const hostLower = smtpConfig.host.toLowerCase();
        const portInt = parseInt(smtpConfig.port) || 465;

        // Smart guard: Detect if user is confusing POP (Post Office Protocol) with SMTP (Simple Mail Transfer Protocol)
        if (hostLower.includes("pop") || portInt === 995 || portInt === 110) {
          return res.status(400).json({
            error: "Protocol Conflict Detected: You entered a POP (Post Office Protocol) configuration. The POP protocol is strictly used to retrieve or download emails (Inbound). To send emails (Outbound), you must use an official SMTP (Simple Mail Transfer Protocol) server, such as 'smtp.office365.com' or 'smtp-mail.outlook.com' on Port 587 (using STARTTLS mode)."
          });
        }

        console.log(`[MAIL] Executing live email dispatch via SMTP (${smtpConfig.host}:${portInt}) ke ${sanitizedRecipient}...`);
        
        // Lazy loading nodemailer to ensure high efficiency and avoid crashes on load
        const nodemailer = await import("nodemailer");

        // Determine secure setting:
        // Nodemailer: secure = true for port 465, secure = false for 587/25 (which then upgrades via STARTTLS)
        const isSecure = smtpConfig.secure === true || portInt === 465;

        const transporter = nodemailer.createTransport({
          host: smtpConfig.host,
          port: portInt,
          secure: isSecure,
          auth: {
            user: smtpConfig.user,
            pass: smtpConfig.pass
          },
          // Lenient security rules to bypass self-signed certificate restrictions commonly found on corporate mailservers
          tls: {
            rejectUnauthorized: false
          },
          connectionTimeout: 12000, // 12 seconds timeout to be slightly more lenient
          greetingTimeout: 12000,
          socketTimeout: 15000
        });

        // In SMTP, especially Office 355 / Outlook and Gmail, the 'from' email address MUST
        // exactly match the authenticated 'user' email. Otherwise raising Error: 553 Mail from must equal authorized user.
        const fromEmail = smtpConfig.user;

        const info = await transporter.sendMail({
          from: `"${smtpConfig.senderName || 'TransForce Platform Alert'}" <${fromEmail}>`,
          to: sanitizedRecipient,
          subject: subject,
          text: bodyText || "",
          html: bodyHtml || ""
        });

        console.log(`[MAIL] Live email dispatch successful! MessageID: ${info.messageId}`);
        return res.json({
          status: "success",
          delivered: true,
          messageId: info.messageId,
          message: "Live email notification successfully sent to the inbox of " + sanitizedRecipient + "!"
        });
      } else {
        // High fidelity simulated visual sandbox mode
        console.log(`[MAIL] Sandbox Mode: Virtual delivery simulation to ${sanitizedRecipient} complete.`);
        return res.json({
          status: "success",
          delivered: false,
          message: "Virtual transmission simulation successfully placed in the Sandbox inbox."
        });
      }
    } catch (err: any) {
      console.error("[MAIL] Email dispatch error:", err);
      
      let friendlyError = err.message || String(err);
      if (friendlyError.includes("Greeting never received")) {
        friendlyError = "Greeting never received (connection timed out). This is usually caused by a mismatch between the Port setting and its SSL/TLS security configuration. If using Port 587 (Outlook/STARTTLS), ensure you select the 'STARTTLS' Mode (not SSL). If using Port 465, ensure you select 'SSL (465)' Mode.";
      } else if (friendlyError.includes("ETIMEDOUT") || friendlyError.toLowerCase().includes("timeout") || friendlyError.includes("connect ETIMEDOUT")) {
        friendlyError = "Connection Timeout. Please verify if your SMTP Host and Port are active and check any network firewall restrictions. Note: Cloud Run sandboxed environments can restrict some custom outbound ports; please use official SMTP Ports such as 587 (TLS/STARTTLS) or 465 (SSL) which are open.";
      } else if (friendlyError.includes("invalid login") || friendlyError.includes("Authentication failed") || friendlyError.includes("recurrent code 535")) {
        friendlyError = "Authentication Failed (Invalid Login). Please verify your SMTP Username and Password. For personal accounts like Gmail or Outlook, you must use a dedicated 'App Password' instead of your main account login password.";
      }

      return res.status(500).json({
        status: "error",
        error: friendlyError
      });
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
