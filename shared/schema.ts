import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const animes = pgTable("animes", {
  id: serial("id").primaryKey(),
  malId: integer("mal_id").notNull(),
  title: text("title").notNull(),
  synopsis: text("synopsis").notNull(),
  imageUrl: text("image_url").notNull(),
  episodes: integer("episodes").notNull(),
});

export const episodes = pgTable("episodes", {
  id: serial("id").primaryKey(),
  animeId: integer("anime_id").notNull(),
  number: integer("number").notNull(),
  title: text("title").notNull(),
  iframeUrl: text("iframe_url").notNull(),
});

export const insertAnimeSchema = createInsertSchema(animes).omit({ id: true });
export const insertEpisodeSchema = createInsertSchema(episodes).omit({ id: true });

export type Anime = typeof animes.$inferSelect;
export type InsertAnime = z.infer<typeof insertAnimeSchema>;
export type Episode = typeof episodes.$inferSelect;
export type InsertEpisode = z.infer<typeof insertEpisodeSchema>;