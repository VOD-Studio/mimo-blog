"use client";

import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { useEffect, useState } from "react";

import { GlassCard } from "@/components/reactbits/GlassCard";
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
 * 音乐播放器视觉占位
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
    <GlassCard className="flex flex-col items-center p-8 text-center">
      <div
        className={cn(
          "relative mb-8 h-56 w-56 overflow-hidden rounded-full shadow-2xl ring-4 ring-white/10 dark:ring-white/5 md:h-64 md:w-64",
          isPlaying && "animate-spin",
        )}
        style={{ animationDuration: "8s" }}
      >
        <img
          src={coverUrl}
          alt={currentSong.name}
          className="h-full w-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 rounded-full shadow-[inset_0_0_40px_rgba(0,0,0,0.3)]" />
      </div>

      <div className="mb-6 space-y-1">
        <h2 className="text-2xl font-bold">{currentSong.name}</h2>
        <p className="text-lg text-muted-foreground">{currentSong.artist}</p>
      </div>

      <div className="mb-6 w-full space-y-2">
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
      </div>

      <div className="flex items-center gap-4">
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
    </GlassCard>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
