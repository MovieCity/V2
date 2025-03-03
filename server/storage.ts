import { 
  type Anime, type InsertAnime,
  type Episode, type InsertEpisode,
  animes, episodes
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Anime methods
  getAnimes(): Promise<Anime[]>;
  getAnime(id: number): Promise<Anime | undefined>;
  createAnime(anime: InsertAnime): Promise<Anime>;
  updateAnime(id: number, anime: InsertAnime): Promise<Anime | undefined>;

  // Episode methods
  getEpisodes(animeId: number): Promise<Episode[]>;
  getEpisode(id: number): Promise<Episode | undefined>;
  createEpisode(episode: InsertEpisode): Promise<Episode>;
  updateEpisode(id: number, episode: InsertEpisode): Promise<Episode | null>;
}

export class DatabaseStorage implements IStorage {
  async getAnimes(): Promise<Anime[]> {
    return await db.select().from(animes).orderBy(desc(animes.id));
  }

  async getAnime(id: number): Promise<Anime | undefined> {
    const [anime] = await db.select().from(animes).where(eq(animes.id, id));
    return anime;
  }

  async createAnime(insertAnime: InsertAnime): Promise<Anime> {
    const [anime] = await db.insert(animes).values(insertAnime).returning();
    return anime;
  }

  async updateAnime(id: number, insertAnime: InsertAnime): Promise<Anime | undefined> {
    const [anime] = await db
      .update(animes)
      .set(insertAnime)
      .where(eq(animes.id, id))
      .returning();
    return anime;
  }

  async getEpisodes(animeId: number): Promise<Episode[]> {
    return await db
      .select()
      .from(episodes)
      .where(eq(episodes.animeId, animeId));
  }

  async getEpisode(id: number): Promise<Episode | undefined> {
    const [episode] = await db
      .select()
      .from(episodes)
      .where(eq(episodes.id, id));
    return episode;
  }

  async createEpisode(insertEpisode: InsertEpisode): Promise<Episode> {
    const [episode] = await db
      .insert(episodes)
      .values(insertEpisode)
      .returning();
    return episode;
  }

  async updateEpisode(id: number, data: InsertEpisode): Promise<Episode | null> {
    const result = await db.update(episodes)
      .set(data)
      .where(eq(episodes.id, id))
      .returning();
    return result[0] || null;
  }
}

export const storage = new DatabaseStorage();