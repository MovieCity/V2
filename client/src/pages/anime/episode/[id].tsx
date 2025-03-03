
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft } from "lucide-react";
import type { Episode } from "@shared/schema";

export default function EpisodePage() {
  const { id } = useParams<{ id: string }>();

  const { data: episode, isLoading } = useQuery<Episode>({
    queryKey: [`/api/episodes/${id}`]
  });

  if (isLoading) {
    return (
      <div className="container py-8 space-y-4">
        <Skeleton className="h-[600px] w-full" />
        <Skeleton className="h-8 w-1/3" />
      </div>
    );
  }

  if (!episode) return <div>Episode not found</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href={`/anime/${episode.animeId}`}>
          <Button variant="outline" size="sm">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Series
          </Button>
        </Link>
      </div>

      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Episode {episode.number}: {episode.title}</h1>
        
        <div className="aspect-video w-full">
          <iframe
            src={episode.iframeUrl}
            className="w-full h-full"
            allowFullScreen
            title={episode.title}
          ></iframe>
        </div>
      </div>
    </div>
  );
}
