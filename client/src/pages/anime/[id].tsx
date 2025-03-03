import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Play } from "lucide-react";
import type { Anime, Episode } from "@shared/schema";

export default function AnimePage() {
  const { id } = useParams<{ id: string }>();

  const { data: anime, isLoading: animeLoading } = useQuery<Anime>({
    queryKey: [`/api/animes/${id}`]
  });

  const { data: episodes, isLoading: episodesLoading } = useQuery<Episode[]>({
    queryKey: [`/api/animes/${id}/episodes`]
  });

  if (animeLoading) {
    return (
      <div className="container py-8 space-y-4">
        <Skeleton className="h-[400px] w-full" />
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!anime) return <div>Anime not found</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-[300px_1fr] gap-8">
        <img 
          src={anime.imageUrl}
          alt={anime.title}
          className="rounded-lg w-full"
        />

        <div>
          <h1 className="text-3xl font-bold mb-4">{anime.title}</h1>
          <p className="text-lg mb-8">{anime.synopsis}</p>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Episodes</h2>

            {episodesLoading ? (
              <div className="space-y-2">
                {Array(3).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {episodes?.map((episode) => (
                  <Link key={episode.id} href={`/anime/episode/${episode.id}`}>
                    <Button className="w-full flex items-center" variant="outline">
                      <Play className="h-4 w-4 mr-2" />
                      <div className="text-left">
                        <div className="font-medium">Episode {episode.number}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {episode.title}
                        </div>
                      </div>
                    </Button>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}