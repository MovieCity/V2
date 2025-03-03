import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertAnimeSchema, insertEpisodeSchema } from "@shared/schema";
import axios from "axios";
import { z } from "zod";

const JIKAN_BASE_URL = "https://api.jikan.moe/v4";

// Add delay between Jikan API calls to respect rate limiting
async function fetchWithDelay(url: string) {
  try {
    // Add delay to respect rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
    const response = await axios.get(url);
    return response.data;
  } catch (error: any) {
    console.error('Jikan API Error:', error.response?.data || error.message);
    if (error.response?.status === 429) {
      throw new Error("Rate limit exceeded. Please wait a few seconds and try again.");
    }
    throw new Error(`Jikan API error: ${error.response?.data?.message || error.message}`);
  }
}

export async function registerRoutes(app: Express) {
  // Anime routes
  app.get("/api/animes", async (req, res) => {
    const animes = await storage.getAnimes();
    res.json(animes);
  });

  app.get("/api/animes/:id", async (req, res) => {
    const anime = await storage.getAnime(parseInt(req.params.id));
    if (!anime) return res.status(404).json({ message: "Anime not found" });
    res.json(anime);
  });

  app.post("/api/animes", async (req, res) => {
    const result = insertAnimeSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid anime data" });
    }
    const anime = await storage.createAnime(result.data);
    res.json(anime);
  });

  app.patch("/api/animes/:id", async (req, res) => {
    const result = insertAnimeSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid anime data" });
    }
    const anime = await storage.updateAnime(parseInt(req.params.id), result.data);
    if (!anime) return res.status(404).json({ message: "Anime not found" });
    res.json(anime);
  });

  // Episode routes
  app.get("/api/animes/:animeId/episodes", async (req, res) => {
    const episodes = await storage.getEpisodes(parseInt(req.params.animeId));
    res.json(episodes);
  });

  app.get("/api/episodes/:id", async (req, res) => {
    const episode = await storage.getEpisode(parseInt(req.params.id));
    if (!episode) return res.status(404).json({ message: "Episode not found" });
    res.json(episode);
  });

  app.post("/api/episodes", async (req, res) => {
    const result = insertEpisodeSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid episode data" });
    }
    const episode = await storage.createEpisode(result.data);
    res.json(episode);
  });

  app.patch("/api/episodes/:id", async (req, res) => {
    const result = insertEpisodeSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid episode data" });
    }
    const episode = await storage.updateEpisode(parseInt(req.params.id), result.data);
    if (!episode) return res.status(404).json({ message: "Episode not found" });
    res.json(episode);
  });

  // Jikan API proxy with better error handling
  app.get("/api/jikan/anime/:id", async (req, res) => {
    try {
      const malId = parseInt(req.params.id);
      if (isNaN(malId)) {
        return res.status(400).json({ message: "Invalid MAL ID" });
      }

      console.log(`Fetching anime data for MAL ID: ${malId}`);

      // Fetch anime details first
      const animeData = await fetchWithDelay(`${JIKAN_BASE_URL}/anime/${malId}/full`);

      // Wait before making the second request
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Then fetch episodes
      const episodesData = await fetchWithDelay(`${JIKAN_BASE_URL}/anime/${malId}/episodes`);

      console.log('Fetched anime:', {
        title: animeData.data?.title,
        episodeCount: episodesData.data?.length || 0
      });

      res.json({
        anime: animeData,
        episodes: episodesData
      });
    } catch (error: any) {
      console.error('Error fetching from Jikan:', error);
      const message = error.message || "Failed to fetch from Jikan API";
      res.status(error.response?.status || 500).json({ message });
    }
  });

  return createServer(app);
}