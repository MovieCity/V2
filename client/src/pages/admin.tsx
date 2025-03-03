import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InsertAnime, insertAnimeSchema, insertEpisodeSchema } from "@shared/schema";
import { InsertEpisode } from "@shared/schema";
import type { Episode } from "@shared/schema";
import { apiRequest } from "@/lib/api";
import type { Anime } from "@shared/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Edit2, Pencil, Trash } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { desc, eq } from "drizzle-orm";

interface JikanEpisode {
  mal_id: number;
  title: string;
  episode: number;
}

export default function Admin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [episodes, setEpisodes] = useState<JikanEpisode[]>([]);
  const [episodeUrls, setEpisodeUrls] = useState<string[]>([]);
  const [editingAnimeId, setEditingAnimeId] = useState<number | null>(null);
  const [editingEpisodeId, setEditingEpisodeId] = useState<number | null>(null);
  const [editingEpisodeData, setEditingEpisodeData] = useState({ title: "", iframeUrl: "" }); // State for editing episode data


  const { data: animes } = useQuery<Anime[]>({
    queryKey: ["/api/animes"],
    enabled: true,
  });

  const animeForm = useForm<InsertAnime>({
    resolver: zodResolver(insertAnimeSchema)
  });

  const editAnimeForm = useForm<InsertAnime>({
    resolver: zodResolver(insertAnimeSchema)
  });

  const createEpisodeMutation = useMutation({
    mutationFn: async (episode: InsertEpisode) => {
      const response = await fetch('/api/episodes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(episode),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/animes'] });
    },
  });

  const createAnimeMutation = useMutation({
    mutationFn: async (data: InsertAnime) => {
      const res = await apiRequest("POST", "/api/animes", data);
      return res.json();
    },
    onSuccess: async (newAnime) => {
      for (let i = 0; i < episodes.length; i++) {
        const episode = episodes[i];
        const url = episodeUrls[i];
        if (url) {
          try {
            await createEpisodeMutation.mutateAsync({
              animeId: newAnime.id,
              number: episode.episode,
              title: episode.title,
              iframeUrl: url
            });
          } catch (error) {
            console.error('Failed to create episode:', error);
            toast({
              title: "Error creating episode",
              description: "Failed to create episode " + episode.episode,
              variant: "destructive"
            });
          }
        }
      }

      queryClient.invalidateQueries({ queryKey: ["/api/animes"] });
      toast({ title: "Anime and episodes created successfully" });
      animeForm.reset();
      setEpisodes([]);
      setEpisodeUrls([]);
    }
  });

  const updateAnimeMutation = useMutation({
    mutationFn: async (data: { id: number; anime: InsertAnime }) => {
      const res = await apiRequest("PATCH", `/api/animes/${data.id}`, data.anime);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/animes"] });
      toast({ title: "Anime updated successfully" });
      setEditingAnimeId(null);
    }
  });

  const updateEpisodeMutation = useMutation({
    mutationFn: async (data: Episode) => {
      const res = await apiRequest("PATCH", `/api/episodes/${data.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/animes'] });
      toast({ title: 'Episode updated successfully!' });
      setEditingEpisodeId(null);
    }
  });

  const deleteEpisodeMutation = useMutation({
    mutationFn: async (episodeId: number) => {
      await apiRequest("DELETE", `/api/episodes/${episodeId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/animes'] });
      toast({ title: 'Episode deleted successfully!' });
    }
  });

  const addEpisode = useMutation({
    mutationFn: async (episode: {animeId: number, number: number, title: string, iframeUrl: string}) => {
      await apiRequest("POST", "/api/episodes", episode);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/animes'] });
      toast({ title: 'Episode added successfully!' });
    }
  });


  async function fetchFromJikan(path: string) {
    const res = await fetch(`/api/jikan${path}`);
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message);
    }
    return res.json();
  }

  async function fetchAnimeInfo(malId: number) {
    setLoading(true);
    try {
      const animeData = await fetchFromJikan(`/anime/${malId}/full`);
      const anime = animeData.data;

      animeForm.setValue("title", anime.title);
      animeForm.setValue("posterUrl", anime.images.jpg.large_image_url);
      animeForm.setValue("description", anime.synopsis || "");
      animeForm.setValue("malId", malId);
      animeForm.setValue("episodes", anime.episodes);

      const episodesData = await fetchFromJikan(`/anime/${malId}/episodes`);
      setEpisodes(episodesData.data);
      setEpisodeUrls(new Array(episodesData.data.length).fill(""));
    } catch (error: any) {
      console.error("Error fetching from Jikan:", error);
      toast({
        title: "Error",
        description: "Failed to fetch anime information",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }

  function startEditing(anime: Anime) {
    setEditingAnimeId(anime.id);
    editAnimeForm.reset(anime);
  }

  function startEditingEpisode(episode: Episode) {
    setEditingEpisodeId(episode.id);
    setEditingEpisodeData({ title: episode.title, iframeUrl: episode.iframeUrl });
  }


  return (
    <div className="container py-8 space-y-8">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Add Anime</h2>

        <div className="flex gap-2">
          <Input
            placeholder="MAL ID"
            type="number"
            className="w-32"
            onChange={(e) => {
              const id = parseInt(e.target.value);
              if (id) fetchAnimeInfo(id);
            }}
            disabled={loading}
          />
          <Button disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? 'Loading...' : 'Fetch from MAL'}
          </Button>
        </div>

        <Form {...animeForm}>
          <form onSubmit={animeForm.handleSubmit((data) => createAnimeMutation.mutate(data))} className="space-y-4">
            <FormField
              control={animeForm.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={animeForm.control}
              name="synopsis"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Synopsis</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={animeForm.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={animeForm.control}
              name="episodes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Episodes</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" />
                  </FormControl>
                </FormItem>
              )}
            />

            {episodes.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Episode Links</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto border rounded-lg p-4">
                  {episodes.map((episode, index) => (
                    <div key={episode.mal_id} className="flex gap-2 items-center">
                      <span className="text-sm font-medium min-w-[200px]">
                        {episode.episode}. {episode.title}
                      </span>
                      <Input
                        placeholder="iFrame URL"
                        value={episodeUrls[index]}
                        onChange={(e) => {
                          const newUrls = [...episodeUrls];
                          newUrls[index] = e.target.value;
                          setEpisodeUrls(newUrls);
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={createAnimeMutation.isPending || !episodes.some((_e, i) => episodeUrls[i])}
              onClick={async (e) => {
                e.preventDefault();
                animeForm.handleSubmit(async (data) => {
                  try {
                    // First create the anime
                    const anime = await createAnimeMutation.mutateAsync(data);

                    // Then create episodes that have URLs
                    await Promise.all(
                      episodes.map(async (episode, index) => {
                        const url = episodeUrls[index];
                        if (!url) return; // Skip episodes without URLs

                        await createEpisodeMutation.mutateAsync({
                          animeId: anime.id,
                          number: episode.episode,
                          title: episode.title,
                          iframeUrl: url
                        });
                      })
                    );

                    toast({
                      title: "Success",
                      description: `Created anime "${data.title}" with ${episodes.filter((_, i) => episodeUrls[i]).length} episodes`,
                    });

                    // Reset forms
                    animeForm.reset();
                    setEpisodes([]);
                    setEpisodeUrls([]);

                  } catch (error: any) {
                    toast({
                      title: "Error creating anime",
                      description: error.message,
                      variant: "destructive"
                    });
                  }
                })();
              }}
            >
              {createAnimeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Anime & Episodes
            </Button>
          </form>
        </Form>
      </div>

      {animes && animes.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Manage Anime</h2>
          <div className="space-y-2">
            {animes.map((anime) => (
              <div key={anime.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-semibold">{anime.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {anime.episodes?.length || 0} episodes
                  </p>
                </div>
                <Dialog open={editingAnimeId === anime.id} onOpenChange={(open) => !open && setEditingAnimeId(null)}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon" onClick={() => startEditing(anime)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Anime</DialogTitle>
                    </DialogHeader>
                    <Form {...editAnimeForm}>
                      <form onSubmit={editAnimeForm.handleSubmit((data) => updateAnimeMutation.mutate({ id: anime.id, anime: data }))} className="space-y-4">
                        <FormField
                          control={editAnimeForm.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Title</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={editAnimeForm.control}
                          name="synopsis"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Synopsis</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={editAnimeForm.control}
                          name="imageUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Image URL</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={editAnimeForm.control}
                          name="episodes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Episodes</FormLabel>
                              <FormControl>
                                <Input {...field} type="number" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <Button type="submit" disabled={updateAnimeMutation.isPending}>
                          {updateAnimeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Update Anime
                        </Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
                {anime.episodes && Array.isArray(anime.episodes) && anime.episodes.map((episode) => (
                  <Dialog key={episode.id} open={editingEpisodeId === episode.id} onOpenChange={(open) => !open && setEditingEpisodeId(null)}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="icon" onClick={() => startEditingEpisode(episode)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Episode</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={async (e) => {
                        e.preventDefault();
                        updateEpisodeMutation.mutate({
                          id: episode.id,
                          title: editingEpisodeData.title,
                          iframeUrl: editingEpisodeData.iframeUrl,
                          number: episode.number,
                          animeId: anime.id
                        });
                        setEditingEpisodeId(null);
                      }}>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="episode-title">Episode Title</Label>
                            <Input
                              id="episode-title"
                              value={editingEpisodeData.title}
                              onChange={(e) => setEditingEpisodeData({ ...editingEpisodeData, title: e.target.value })}
                              placeholder="Episode Title"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="episode-url">Iframe URL</Label>
                            <Input
                              id="episode-url"
                              value={editingEpisodeData.iframeUrl}
                              onChange={(e) => setEditingEpisodeData({ ...editingEpisodeData, iframeUrl: e.target.value })}
                              placeholder="https://example.com/embed/..."
                            />
                          </div>
                        </div>
                        <Button type="submit" disabled={updateEpisodeMutation.isPending}>
                          Update Episode
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}