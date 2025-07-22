import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import http from 'http';
import session from "express-session"; // express-sessionをインポート
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// セッションミドルウェアの追加
app.use(
  session({
    secret: process.env.SESSION_SECRET || "supersecret", // 環境変数からシークレットを取得
    resave: false,
    saveUninitialized: false,
    cookie: { secure: app.get("env") === "production" }, // 本番環境ではHTTPSを要求
  })
);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = http.createServer(app);
  registerRoutes(app); // register routes on the express app

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen(port, '0.0.0.0', () => {
    log(`serving on port ${port}`);
    
    // Show URLs to access the application
    console.log('\n🚀 Application is running!');
    console.log(`📱 Local:            http://localhost:${port}`);
    console.log(`🌐 Network:          http://0.0.0.0:${port}`);
    
    // If running on Replit, show the Replit URL
    if (process.env.REPL_SLUG && process.env.REPL_OWNER) {
      console.log(`🔗 Replit:           https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`);
    }
    
    // If running on other platforms, show generic external URL
    if (process.env.RAILWAY_PUBLIC_DOMAIN) {
      console.log(`🚄 Railway:          https://${process.env.RAILWAY_PUBLIC_DOMAIN}`);
    }
    
    if (process.env.VERCEL_URL) {
      console.log(`▲ Vercel:            https://${process.env.VERCEL_URL}`);
    }
    
    console.log('\n📋 API Endpoints:');
    console.log(`   Health Check:     http://localhost:${port}/api/health`);
    console.log(`   Chat Sessions:    http://localhost:${port}/api/chat-sessions`);
    console.log(`   Projects:         http://localhost:${port}/api/projects`);
    console.log('');
  });
})();
