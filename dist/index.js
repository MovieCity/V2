var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  animes: () => animes,
  episodes: () => episodes,
  insertAnimeSchema: () => insertAnimeSchema,
  insertEpisodeSchema: () => insertEpisodeSchema
});
import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var animes = pgTable("animes", {
  id: serial("id").primaryKey(),
  malId: integer("mal_id").notNull(),
  title: text("title").notNull(),
  synopsis: text("synopsis").notNull(),
  imageUrl: text("image_url").notNull(),
  episodes: integer("episodes").notNull()
});
var episodes = pgTable("episodes", {
  id: serial("id").primaryKey(),
  animeId: integer("anime_id").notNull(),
  number: integer("number").notNull(),
  title: text("title").notNull(),
  iframeUrl: text("iframe_url").notNull()
});
var insertAnimeSchema = createInsertSchema(animes).omit({ id: true });
var insertEpisodeSchema = createInsertSchema(episodes).omit({ id: true });

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq, desc } from "drizzle-orm";
var DatabaseStorage = class {
  async getAnimes() {
    return await db.select().from(animes).orderBy(desc(animes.id));
  }
  async getAnime(id) {
    const [anime] = await db.select().from(animes).where(eq(animes.id, id));
    return anime;
  }
  async createAnime(insertAnime) {
    const [anime] = await db.insert(animes).values(insertAnime).returning();
    return anime;
  }
  async updateAnime(id, insertAnime) {
    const [anime] = await db.update(animes).set(insertAnime).where(eq(animes.id, id)).returning();
    return anime;
  }
  async getEpisodes(animeId) {
    return await db.select().from(episodes).where(eq(episodes.animeId, animeId));
  }
  async getEpisode(id) {
    const [episode] = await db.select().from(episodes).where(eq(episodes.id, id));
    return episode;
  }
  async createEpisode(insertEpisode) {
    const [episode] = await db.insert(episodes).values(insertEpisode).returning();
    return episode;
  }
  async updateEpisode(id, data) {
    const result = await db.update(episodes).set(data).where(eq(episodes.id, id)).returning();
    return result[0] || null;
  }
};
var storage = new DatabaseStorage();

// server/routes.ts
import axios from "axios";
var JIKAN_BASE_URL = "https://api.jikan.moe/v4";
async function fetchWithDelay(url) {
  try {
    await new Promise((resolve) => setTimeout(resolve, 1e3));
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error("Jikan API Error:", error.response?.data || error.message);
    if (error.response?.status === 429) {
      throw new Error("Rate limit exceeded. Please wait a few seconds and try again.");
    }
    throw new Error(`Jikan API error: ${error.response?.data?.message || error.message}`);
  }
}
async function registerRoutes(app2) {
  app2.get("/api/animes", async (req, res) => {
    const animes2 = await storage.getAnimes();
    res.json(animes2);
  });
  app2.get("/api/animes/:id", async (req, res) => {
    const anime = await storage.getAnime(parseInt(req.params.id));
    if (!anime) return res.status(404).json({ message: "Anime not found" });
    res.json(anime);
  });
  app2.post("/api/animes", async (req, res) => {
    const result = insertAnimeSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid anime data" });
    }
    const anime = await storage.createAnime(result.data);
    res.json(anime);
  });
  app2.patch("/api/animes/:id", async (req, res) => {
    const result = insertAnimeSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid anime data" });
    }
    const anime = await storage.updateAnime(parseInt(req.params.id), result.data);
    if (!anime) return res.status(404).json({ message: "Anime not found" });
    res.json(anime);
  });
  app2.get("/api/animes/:animeId/episodes", async (req, res) => {
    const episodes2 = await storage.getEpisodes(parseInt(req.params.animeId));
    res.json(episodes2);
  });
  app2.get("/api/episodes/:id", async (req, res) => {
    const episode = await storage.getEpisode(parseInt(req.params.id));
    if (!episode) return res.status(404).json({ message: "Episode not found" });
    res.json(episode);
  });
  app2.post("/api/episodes", async (req, res) => {
    const result = insertEpisodeSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid episode data" });
    }
    const episode = await storage.createEpisode(result.data);
    res.json(episode);
  });
  app2.patch("/api/episodes/:id", async (req, res) => {
    const result = insertEpisodeSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid episode data" });
    }
    const episode = await storage.updateEpisode(parseInt(req.params.id), result.data);
    if (!episode) return res.status(404).json({ message: "Episode not found" });
    res.json(episode);
  });
  app2.get("/api/jikan/anime/:id", async (req, res) => {
    try {
      const malId = parseInt(req.params.id);
      if (isNaN(malId)) {
        return res.status(400).json({ message: "Invalid MAL ID" });
      }
      console.log(`Fetching anime data for MAL ID: ${malId}`);
      const animeData = await fetchWithDelay(`${JIKAN_BASE_URL}/anime/${malId}/full`);
      await new Promise((resolve) => setTimeout(resolve, 1e3));
      const episodesData = await fetchWithDelay(`${JIKAN_BASE_URL}/anime/${malId}/episodes`);
      console.log("Fetched anime:", {
        title: animeData.data?.title,
        episodeCount: episodesData.data?.length || 0
      });
      res.json({
        anime: animeData,
        episodes: episodesData
      });
    } catch (error) {
      console.error("Error fetching from Jikan:", error);
      const message = error.message || "Failed to fetch from Jikan API";
      res.status(error.response?.status || 500).json({ message });
    }
  });
  return createServer(app2);
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2, { dirname as dirname2 } from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path, { dirname } from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared")
    }
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = dirname2(__filename2);
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        __dirname2,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(__dirname2, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
