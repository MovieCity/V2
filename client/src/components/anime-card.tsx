import { Card, CardContent } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Link } from "wouter";
import type { Anime } from "@shared/schema";

interface AnimeCardProps {
  anime: Anime;
}

export function AnimeCard({ anime }: AnimeCardProps) {
  return (
    <Link href={`/anime/${anime.id}`}>
      <Card className="cursor-pointer hover:shadow-lg transition-shadow overflow-hidden">
        <CardContent className="p-0">
          <AspectRatio ratio={3/4}>
            <img 
              src={anime.imageUrl} 
              alt={anime.title}
              className="object-cover w-full h-full"
            />
          </AspectRatio>
          <div className="p-2">
            <h3 className="font-medium text-sm line-clamp-1">{anime.title}</h3>
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
              {anime.synopsis}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}