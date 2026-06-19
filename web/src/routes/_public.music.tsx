import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_public/music")({
  component: MusicPage,
});

/**
 * 音乐页占位
 */
function MusicPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold">音乐</h1>
      <p className="text-muted-foreground">音乐播放器即将呈现。</p>
    </div>
  );
}
