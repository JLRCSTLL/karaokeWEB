"use client";

import { useEffect, useState } from "react";
import { ListPlus, Search, User, Video } from "lucide-react";
import { api } from "@/lib/client-api";
import type { QueueSnapshot, Song, YouTubeResult } from "@/lib/types";
import { SongArt } from "./song-art";
import { useRealtimeQueue } from "./use-realtime-queue";

type Props = {
  sessionCode: string;
  initialSnapshot: QueueSnapshot | null;
};

export function GuestSession({ sessionCode, initialSnapshot }: Props) {
  const { snapshot } = useRealtimeQueue(sessionCode, initialSnapshot);
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [songs, setSongs] = useState<Song[]>([]);
  const [youtubeResults, setYoutubeResults] = useState<YouTubeResult[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => setName(localStorage.getItem("karaokeName") || ""), 0);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      const response = await api<{ songs: Song[]; count: number }>(`/api/library?q=${encodeURIComponent(query)}`);
      setSongs(response.songs);
    }, 250);

    return () => clearTimeout(timeout);
  }, [query]);

  function saveName(nextName: string) {
    setName(nextName);
    localStorage.setItem("karaokeName", nextName);
  }

  async function addToQueue(song: Song) {
    if (!name.trim()) {
      setMessage("Enter your display name first.");
      return;
    }

    try {
      const response = await api<{ queuePosition: number }>("/api/queue/add", {
        method: "POST",
        body: JSON.stringify({ sessionCode, songId: song.id, requesterName: name }),
      });
      setMessage(`Added to queue. Your position is ${response.queuePosition}.`);
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Could not add song.");
    }
  }

  async function searchYouTube() {
    if (query.trim().length < 2) return;
    setLoading(true);
    setMessage("");
    try {
      const response = await api<{ results: YouTubeResult[] }>(`/api/youtube/search?q=${encodeURIComponent(query)}`);
      setYoutubeResults(response.results);
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "YouTube search failed.");
    } finally {
      setLoading(false);
    }
  }

  async function saveYouTubeResult(result: YouTubeResult, queueAfterSave = false) {
    const response = await api<{ song: Song }>("/api/library/add", {
      method: "POST",
      body: JSON.stringify({ ...result, addedBy: name || "guest" }),
    });
    setSongs((current) => [response.song, ...current.filter((song) => song.id !== response.song.id)]);
    setMessage("Song added to the local library.");
    if (queueAfterSave) await addToQueue(response.song);
  }

  const current = snapshot?.current;
  const upcoming = snapshot?.queue.filter((item) => item.status !== "playing") || [];

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-5 px-4 py-5">
      <section className="panel p-5">
        <p className="eyebrow">QR Karaoke</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">{snapshot?.session.name || "Karaoke Session"}</h1>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1.4fr]">
          <label className="field-label">
            Display name
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-3 text-zinc-500" size={18} />
              <input className="field pl-10" value={name} onChange={(event) => saveName(event.target.value)} placeholder="Your singer name" />
            </div>
          </label>
          <label className="field-label">
            Search songs
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 text-zinc-500" size={18} />
              <input className="field pl-10" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Title, artist, or keyword" />
            </div>
          </label>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="panel p-4">
          <p className="eyebrow">Now Singing</p>
          <h2 className="mt-2 text-xl font-semibold text-white">{current?.song.title || "No song playing"}</h2>
          <p className="mt-1 text-sm text-zinc-400">{current ? `${current.requesterName} is singing` : "The host will start the queue soon."}</p>
        </div>
        <div className="panel p-4">
          <p className="eyebrow">Your Queue View</p>
          <div className="mt-2 space-y-2">
            {upcoming.slice(0, 3).map((item, index) => (
              <p className="truncate text-sm text-zinc-300" key={item.id}>
                {index + 1}. {item.song.title} by {item.requesterName}
              </p>
            ))}
            {!upcoming.length ? <p className="text-sm text-zinc-400">No upcoming songs yet.</p> : null}
          </div>
        </div>
      </section>

      <section className="panel divide-y divide-white/10 overflow-hidden">
        {songs.map((song) => (
          <div className="flex items-center gap-3 p-4" key={song.id}>
            <SongArt song={song} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-white">{song.title}</p>
              <p className="truncate text-sm text-zinc-400">{song.artist || song.channelName || "YouTube"}</p>
            </div>
            <button className="btn-primary shrink-0" onClick={() => addToQueue(song)}>
              <ListPlus size={16} /> Queue
            </button>
          </div>
        ))}
        {!songs.length ? (
          <div className="p-5 text-center">
            <p className="text-sm text-zinc-400">No local matches.</p>
            <button className="btn-secondary mx-auto mt-3 justify-center" onClick={searchYouTube} disabled={loading || query.length < 2}>
              <Video size={16} /> {loading ? "Searching..." : "Search YouTube"}
            </button>
          </div>
        ) : null}
      </section>

      {youtubeResults.length ? (
        <section className="panel divide-y divide-white/10 overflow-hidden">
          <div className="p-4">
            <p className="eyebrow">YouTube Results</p>
          </div>
          {youtubeResults.map((result) => (
            <div className="grid gap-3 p-4 sm:grid-cols-[1fr_auto]" key={result.youtubeVideoId}>
              <div className="flex min-w-0 items-center gap-3">
                <SongArt song={result} />
                <div className="min-w-0">
                  <p className="line-clamp-2 font-semibold text-white">{result.title}</p>
                  <p className="truncate text-sm text-zinc-400">{result.channelName} {result.duration ? `• ${result.duration}` : ""}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button className="btn-secondary" onClick={() => saveYouTubeResult(result)}>
                  Add to Library
                </button>
                <button className="btn-primary" onClick={() => saveYouTubeResult(result, true)}>
                  Queue
                </button>
              </div>
            </div>
          ))}
        </section>
      ) : null}

      {message ? <p className="toast">{message}</p> : null}
    </div>
  );
}
