import { useQuery } from "@tanstack/react-query";
import { AnimeCard } from "@/components/anime-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Anime } from "@shared/schema";

function AnimeCardSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-[200px] w-full" />
      <div className="space-y-1">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-full" />
      </div>
    </div>
  );
}

export default function Home() {
  const { data: animes, isLoading } = useQuery<Anime[]>({ 
    queryKey: ["/api/animes"]
  });

  return (
    <main className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Latest Anime</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {isLoading ? (
          Array(10).fill(0).map((_, i) => (
            <AnimeCardSkeleton key={i} />
          ))
        ) : (
          animes?.map((anime) => (
            <AnimeCard key={anime.id} anime={anime} />
          ))
        )}
      </div>
    </main>
  );
}