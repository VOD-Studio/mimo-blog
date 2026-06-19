"use client";

import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { useEffect, useState } from "react";

import { BentoCard } from "@/components/reactbits/BentoCard";
import { MagneticButton } from "@/components/reactbits/MagneticButton";
import { cn } from "@/lib/utils";

import type { Song } from "../types";

interface MusicPlayerProps {
  currentSong: Song;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onPrevious: () => void;
  onNext: () => void;
}

/**
 * Bento 风格音乐播放器
 */
export function MusicPlayer({
  currentSong,
  isPlaying,
  onTogglePlay,
  onPrevious,
  onNext,
}: MusicPlayerProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 0 : prev + 0.5));
    }, 500);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset progress when the current track changes
  useEffect(() => {
    setProgress(0);
  }, [currentSong]);

  const coverUrl = currentSong.cover ?? "https://placehold.co/400x400/1e293b/ffffff?text=Music";

  return (
    <BentoCard className="overflow-hidden p-0" colSpan={2} rowSpan={2}>
      <div className="grid h-full md:grid-cols-2">
        <div className="relative aspect-square md:aspect-auto">
          <img
            src={coverUrl}
            alt={currentSong.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent md:bg-gradient-to-r" />
          <div className="absolute bottom-4 left-4 text-white md:hidden">
            <p className="font-semibold">{currentSong.name}</p>
            <p className="text-sm opacity-80">{currentSong.artist}</p>
          </div>
        </div>

        <div className="flex flex-col justify-between p-6 md:p-8">
          <div>
            <h2 className="hidden text-2xl font-bold md:block">{currentSong.name}</h2>
            <p className="hidden text-lg text-muted-foreground md:block">{currentSong.artist}</p>

            <div className="mt-6 flex h-12 items-end gap-1">
              {Array.from({ length: 24 }).map((_, index) => (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: static visualization bars
                  key={index}
                  className={cn(
                    "flex-1 rounded-full bg-primary/60 transition-all duration-300",
                    isPlaying && "animate-pulse",
                  )}
                  style={{
                    height: isPlaying ? `${20 + Math.random() * 80}%` : "20%",
                    animationDelay: `${index * 50}ms`,
                  }}
                />
              ))}
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand to-accent-brand transition-all duration-500 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatTime((progress / 100) * 180)}</span>
              <span>3:00</span>
            </div>

            <div className="flex items-center justify-center gap-4">
              <MagneticButton variant="outline" size="icon" onClick={onPrevious}>
                <SkipBack className="size-5" />
              </MagneticButton>
              <MagneticButton size="icon" className="h-14 w-14" onClick={onTogglePlay}>
                {isPlaying ? <Pause className="size-6" /> : <Play className="size-6" />}
              </MagneticButton>
              <MagneticButton variant="outline" size="icon" onClick={onNext}>
                <SkipForward className="size-5" />
              </MagneticButton>
            </div>
          </div>
        </div>
      </div>
    </BentoCard>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
