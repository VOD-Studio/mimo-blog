import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { GradientText } from "@/components/reactbits/GradientText";
import { ScrollReveal } from "@/components/reactbits/ScrollReveal";
import { Skeleton } from "@/components/ui/skeleton";
import { MusicPlayer } from "@/features/music/components/MusicPlayer";
import { PlaylistPanel } from "@/features/music/components/PlaylistPanel";
import { useActivePlaylists } from "@/features/music/hooks/useMusic";

export const Route = createFileRoute("/_public/music")({
  component: MusicPage,
});

/**
 * 音乐页
 */
function MusicPage() {
  const { data: playlists, isLoading } = useActivePlaylists();
  const activePlaylist = playlists?.[0];
  const songs = activePlaylist?.songs ?? [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const currentSong = useMemo(
    () => songs[currentIndex] ?? { name: "暂无歌曲", artist: "—", url: "" },
    [songs, currentIndex],
  );

  function handleTogglePlay() {
    if (songs.length === 0) return;
    setIsPlaying((prev) => !prev);
  }

  function handlePrevious() {
    if (songs.length === 0) return;
    setCurrentIndex((prev) => (prev === 0 ? songs.length - 1 : prev - 1));
    setIsPlaying(true);
  }

  function handleNext() {
    if (songs.length === 0) return;
    setCurrentIndex((prev) => (prev === songs.length - 1 ? 0 : prev + 1));
    setIsPlaying(true);
  }

  function handleSelect(index: number) {
    setCurrentIndex(index);
    setIsPlaying(true);
  }

  return (
    <div className="container mx-auto px-4 py-12 md:py-20">
      <ScrollReveal>
        <section className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
            <GradientText>音乐空间</GradientText>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">聆听旋律，记录此刻的心情与灵感。</p>
        </section>
      </ScrollReveal>

      <div className="mx-auto mt-12 grid max-w-5xl gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <ScrollReveal delay={100}>
          {isLoading ? (
            <div className="flex aspect-square flex-col items-center justify-center gap-4 rounded-2xl border bg-muted/50 p-8">
              <Skeleton className="h-56 w-56 rounded-full" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
              <div className="flex gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-14 w-14 rounded-full" />
                <Skeleton className="h-10 w-10 rounded-full" />
              </div>
            </div>
          ) : (
            <MusicPlayer
              currentSong={currentSong}
              isPlaying={isPlaying}
              onTogglePlay={handleTogglePlay}
              onPrevious={handlePrevious}
              onNext={handleNext}
            />
          )}
        </ScrollReveal>

        <ScrollReveal delay={200}>
          {isLoading ? (
            <div className="h-[520px] rounded-2xl border bg-muted/50 p-4">
              {Array.from({ length: 6 }).map((_, index) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholders
                <Skeleton key={index} className="mb-3 h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : songs.length > 0 ? (
            <PlaylistPanel songs={songs} currentIndex={currentIndex} onSelect={handleSelect} />
          ) : (
            <div className="flex h-[520px] items-center justify-center rounded-2xl border bg-muted/50 p-8 text-center text-muted-foreground">
              <p>暂无启用歌单，请在后台导入并启用歌单。</p>
            </div>
          )}
        </ScrollReveal>
      </div>
    </div>
  );
}
