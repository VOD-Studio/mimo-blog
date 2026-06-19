"use client";

import { Music } from "lucide-react";

import { BentoCard } from "@/components/reactbits/BentoCard";
import { cn } from "@/lib/utils";

import type { Song } from "../types";

interface PlaylistPanelProps {
  songs: Song[];
  currentIndex: number;
  onSelect: (index: number) => void;
}

/**
 * Bento 风格播放列表面板
 */
export function PlaylistPanel({ songs, currentIndex, onSelect }: PlaylistPanelProps) {
  return (
    <BentoCard className="max-h-[520px] overflow-hidden p-0">
      <div className="border-b border-border/50 px-5 py-4">
        <h3 className="font-semibold">播放列表</h3>
        <p className="text-xs text-muted-foreground">共 {songs.length} 首</p>
      </div>
      <ul className="max-h-[440px] overflow-y-auto p-2">
        {songs.map((song, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: playlist order is stable
          <li key={index}>
            <button
              type="button"
              onClick={() => onSelect(index)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors",
                index === currentIndex ? "bg-primary/10 text-primary" : "hover:bg-muted/50",
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-medium",
                  index === currentIndex ? "bg-primary text-primary-foreground" : "bg-muted",
                )}
              >
                {index === currentIndex ? <Music className="size-4" /> : index + 1}
              </div>
              <div className="min-w-0">
                <p
                  className={cn(
                    "truncate text-sm font-medium",
                    index === currentIndex && "text-primary",
                  )}
                >
                  {song.name}
                </p>
                <p className="truncate text-xs text-muted-foreground">{song.artist}</p>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </BentoCard>
  );
}
