"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { api } from "@/lib/client-api";
import type { QueueSnapshot } from "@/lib/types";
import { useRealtimeQueue } from "./use-realtime-queue";

type Props = {
  sessionCode: string;
  initialSnapshot: QueueSnapshot | null;
};

type YouTubePlayer = {
  loadVideoById: (id: string) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number) => void;
};

declare global {
  interface Window {
    YT?: {
      Player: new (
        elementId: string,
        options: {
          videoId?: string;
          playerVars?: Record<string, number>;
          events?: { onStateChange?: (event: { data: number }) => void; onReady?: () => void };
        },
      ) => YouTubePlayer;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

export function KaraokeDisplay({ sessionCode, initialSnapshot }: Props) {
  const { snapshot } = useRealtimeQueue(sessionCode, initialSnapshot);
  const player = useRef<YouTubePlayer | null>(null);
  const sessionCodeRef = useRef(sessionCode);
  const initialVideoIdRef = useRef<string | undefined>(undefined);
  const [ready, setReady] = useState(false);
  const current = snapshot?.current;
  const videoId = current?.song.youtubeVideoId;
  const upcoming = snapshot?.queue.filter((item) => item.status !== "playing") || [];

  initialVideoIdRef.current ??= videoId;

  useEffect(() => {
    window.onYouTubeIframeAPIReady = () => {
      player.current = new window.YT!.Player("youtube-player", {
        videoId: initialVideoIdRef.current,
        playerVars: { autoplay: 1, controls: 1, rel: 0, modestbranding: 1 },
        events: {
          onReady: () => setReady(true),
          onStateChange: (event) => {
            if (event.data === 0) {
              void api("/api/queue/next", {
                method: "POST",
                body: JSON.stringify({ sessionCode: sessionCodeRef.current }),
              });
            }
          },
        },
      });
    };

    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    } else {
      window.onYouTubeIframeAPIReady();
    }
  }, []);

  useEffect(() => {
    if (ready && videoId) {
      player.current?.loadVideoById(videoId);
    }
  }, [ready, videoId]);

  function nextSong() {
    void api("/api/queue/next", {
      method: "POST",
      body: JSON.stringify({ sessionCode }),
    });
  }

  return (
    <main className="grid min-h-screen gap-4 bg-black p-4 text-white lg:grid-cols-[1fr_360px]">
      <section className="flex min-h-[70vh] flex-col overflow-hidden rounded-md border border-white/10 bg-zinc-950">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-4">
          <div className="min-w-0">
            <p className="eyebrow">Now Singing</p>
            <h1 className="mt-1 truncate text-3xl font-semibold md:text-5xl">{current?.song.title || "Waiting for the next singer"}</h1>
            <p className="mt-2 text-lg text-cyan-200">{current ? `${current.requesterName} • ${current.song.artist || current.song.channelName || "YouTube"}` : "Queue is ready when the host is."}</p>
          </div>
          <div className="flex gap-2">
            <button className="icon-button" title="Play" onClick={() => player.current?.playVideo()}>
              <Play size={18} />
            </button>
            <button className="icon-button" title="Pause" onClick={() => player.current?.pauseVideo()}>
              <Pause size={18} />
            </button>
            <button className="icon-button" title="Replay" onClick={() => player.current?.seekTo(0)}>
              <RotateCcw size={18} />
            </button>
            <button className="icon-button" title="Next" onClick={nextSong}>
              <SkipForward size={18} />
            </button>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center bg-black">
          <div id="youtube-player" className="aspect-video w-full max-w-6xl" />
        </div>
        <div className="overflow-hidden whitespace-nowrap border-t border-white/10 bg-cyan-400 px-4 py-2 text-sm font-semibold text-zinc-950">
          <span className="marquee">Now Singing • Scan the QR code to request your next karaoke song • Up next: {upcoming[0]?.song.title || "open slot"}</span>
        </div>
      </section>

      <aside className="rounded-md border border-white/10 bg-zinc-950 p-4">
        <p className="eyebrow">Up Next</p>
        <div className="mt-4 space-y-3">
          {upcoming.slice(0, 10).map((item, index) => (
            <div className="rounded-md border border-white/10 bg-white/[0.04] p-3" key={item.id}>
              <p className="text-sm text-cyan-300">#{index + 1}</p>
              <p className="truncate font-semibold">{item.song.title}</p>
              <p className="truncate text-sm text-zinc-400">{item.requesterName}</p>
            </div>
          ))}
          {!upcoming.length ? <p className="text-sm text-zinc-400">No upcoming singers.</p> : null}
        </div>
      </aside>
    </main>
  );
}
