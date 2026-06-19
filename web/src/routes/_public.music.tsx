import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { BentoGrid } from "@/components/reactbits/BentoGrid";
import { ScrollReveal } from "@/components/reactbits/ScrollReveal";
import { ShinyText } from "@/components/reactbits/ShinyText";
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
        <header className="mb-12 max-w-2xl">
          <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
            <ShinyText>音乐</ShinyText>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">当前播放的歌单与灵感来源。</p>
        </header>
      </ScrollReveal>

      {isLoading ? (
        <BentoGrid columns={3}>
          <div className="md:col-span-2 md:row-span-2">
            <Skeleton className="h-full min-h-[420px] w-full rounded-3xl" />
          </div>
          <Skeleton className="h-96 w-full rounded-3xl" />
          <Skeleton className="h-48 w-full rounded-3xl" />
        </BentoGrid>
      ) : songs.length > 0 ? (
        <BentoGrid columns={3}>
          <MusicPlayer
            currentSong={currentSong}
            isPlaying={isPlaying}
            onTogglePlay={handleTogglePlay}
            onPrevious={handlePrevious}
            onNext={handleNext}
          />
          <PlaylistPanel songs={songs} currentIndex={currentIndex} onSelect={handleSelect} />
        </BentoGrid>
      ) : (
        <div className="rounded-3xl border border-dashed bg-muted/30 p-16 text-center text-muted-foreground">
          <p>暂无启用歌单，请在后台导入并启用歌单。</p>
        </div>
      )}
    </div>
  );
}
