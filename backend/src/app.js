import path from "node:path";
import { fileURLToPath } from "node:url";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { sequelize } from "./models/index.js";
import { csrfProtection } from "./middleware/csrf.js";
import { errorHandler, notFound } from "./middleware/error.js";
import { apiRateLimiter } from "./middleware/rateLimiter.js";
import { sanitizeInput } from "./middleware/sanitize.js";
import { handleValidationError } from "./middleware/validate.js";
import { requireAuth } from "./middleware/auth.js";
import { authRouter } from "./routes/auth.routes.js";
import { catalogRouter } from "./routes/catalog.routes.js";
import { documentsRouter } from "./routes/documents.routes.js";
import { exportsRouter } from "./routes/exports.routes.js";
import { universitiesRouter } from "./routes/universities.routes.js";
import { usersRouter } from "./routes/users.routes.js";
import { adminRouter } from "./routes/admin.routes.js";
import { aiRouter } from "./routes/ai.routes.js";
import { applicationsRouter } from "./routes/applications.routes.js";
import { institutionsRouter } from "./routes/institutions.routes.js";
import { notificationsRouter } from "./routes/notifications.routes.js";
import { startupState } from "./startupState.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  if (env.trustProxy) app.set("trust proxy", 1);
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy: env.nodeEnv === "production" ? undefined : false
    })
  );
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || env.corsOrigins.includes(origin)) return callback(null, true);
        return callback(null, false);
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "X-CSRF-Token"]
    })
  );
  app.use(express.json({ limit: "8mb" }));
  app.use(cookieParser());
  app.use("/api", apiRateLimiter);
  app.use(sanitizeInput);
  app.use(csrfProtection);

  app.get("/api/health", (_req, res) => res.json({ ok: true, name: "UniTrack API", mode: env.nodeEnv }));
  app.get("/api/ready", async (_req, res) => {
    try {
      await sequelize.authenticate();
      if (!startupState.databaseReady) {
        return res.status(503).json({
          ok: false,
          database: env.dbDialect,
          startup: startupState.retryAt ? "retrying" : "initializing",
          retryAt: startupState.retryAt || undefined
        });
      }
      return res.json({
        ok: true,
        database: env.dbDialect,
        timestamp: new Date().toISOString(),
        lastReadyAt: startupState.lastReadyAt || undefined
      });
    } catch (error) {
      return res.status(503).json({
        ok: false,
        database: env.dbDialect,
        startup: startupState.retryAt ? "retrying" : "unreachable",
        retryAt: startupState.retryAt || undefined
      });
    }
  });
  app.use("/api/auth", authRouter);
  app.use("/api/institutions", institutionsRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/admin", requireAuth, adminRouter);
  app.use("/api/ai", requireAuth, aiRouter);
  app.use("/api/applications", requireAuth, applicationsRouter);
  app.use("/api/catalog", requireAuth, catalogRouter);
  app.use("/api/universities", requireAuth, universitiesRouter);
  app.use("/api/documents", requireAuth, documentsRouter);
  app.use("/api/notifications", requireAuth, notificationsRouter);
  app.use("/api/exports", requireAuth, exportsRouter);

  const frontendDist = path.resolve(__dirname, "../../frontend/dist");
  app.use(express.static(frontendDist));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    return res.sendFile(path.join(frontendDist, "index.html"), (error) => {
      if (error) next();
    });
  });

  app.use(handleValidationError);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
