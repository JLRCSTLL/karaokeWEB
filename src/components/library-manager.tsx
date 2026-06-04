"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Heart, Pencil, Plus, Save, Search, Trash2, Video, X } from "lucide-react";
import { api } from "@/lib/client-api";
import type { Song, YouTubeResult } from "@/lib/types";
import { extractYouTubeVideoId } from "@/lib/validation";
import { SongArt } from "./song-art";

export function LibraryManager() {
  const [query, setQuery] = useState("");
  const [manualUrl, setManualUrl] = useState("");
  const [manualTitle, setManualTitle] = useState("");
  const [songs, setSongs] = useState<Song[]>([]);
  const [youtubeResults, setYoutubeResults] = useState<YouTubeResult[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editArtist, setEditArtist] = useState("");

  const loadSongs = useCallback(async (search = query) => {
    const response = await api<{ songs: Song[]; count: number }>(`/api/library?q=${encodeURIComponent(search)}`);
    setSongs(response.songs);
  }, [query]);

  useEffect(() => {
    const timeout = setTimeout(() => void loadSongs(), 250);
    return () => clearTimeout(timeout);
  }, [loadSongs]);

  async function searchYouTube() {
    setLoading(true);
    setMessage("");
    try {
      const response = await api<{ results: YouTubeResult[] }>(`/api/youtube/search?q=${encodeURIComponent(query || manualTitle)}`);
      setYoutubeResults(response.results);
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "YouTube search failed.");
    } finally {
      setLoading(false);
    }
  }

  async function saveSong(song: Partial<Song> | YouTubeResult) {
    await api("/api/library/add", {
      method: "POST",
      body: JSON.stringify({ ...song, addedBy: "admin" }),
    });
    setMessage("Song saved.");
    await loadSongs();
  }

  async function addManual(event: FormEvent) {
    event.preventDefault();
    const youtubeVideoId = extractYouTubeVideoId(manualUrl);
    if (!youtubeVideoId || !manualTitle) {
      setMessage("Enter a valid YouTube URL or video ID and title.");
      return;
    }

    await saveSong({
      youtubeVideoId,
      title: manualTitle,
      source: "youtube",
      thumbnailUrl: `https://i.ytimg.com/vi/${youtubeVideoId}/hqdefault.jpg`,
    });
    setManualTitle("");
    setManualUrl("");
  }

  async function updateSong(song: Song, changes: Partial<Song>) {
    await api(`/api/library/${song.id}`, {
      method: "PATCH",
      body: JSON.stringify(changes),
    });
    await loadSongs();
  }

  function startEdit(song: Song) {
    setEditingId(song.id);
    setEditTitle(song.title);
    setEditArtist(song.artist || "");
  }

  async function saveEdit(song: Song) {
    await updateSong(song, { title: editTitle, artist: editArtist });
    setEditingId("");
  }

  async function deleteSong(song: Song) {
    await api(`/api/library/${song.id}`, { method: "DELETE" });
    await loadSongs();
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="eyebrow">Song Library</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Saved karaoke songs</h1>
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-3 top-3 text-zinc-500" size={18} />
            <input className="field pl-10" placeholder="Search title, artist, channel" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
        </div>

        <div className="panel divide-y divide-white/10 overflow-hidden">
          {songs.map((song) => (
            <div className="grid gap-3 p-4 md:grid-cols-[1fr_160px] md:items-center" key={song.id}>
              <div className="flex min-w-0 items-center gap-3">
                <SongArt song={song} />
                {editingId === song.id ? (
                  <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
                    <input className="field" value={editTitle} onChange={(event) => setEditTitle(event.target.value)} />
                    <input className="field" value={editArtist} onChange={(event) => setEditArtist(event.target.value)} placeholder="Artist" />
                  </div>
                ) : (
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-white">{song.title}</p>
                    <p className="truncate text-sm text-zinc-400">
                      {song.artist || song.channelName || "YouTube"} • {song.duration || "Unknown duration"}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {editingId === song.id ? (
                  <>
                    <button className="icon-button" title="Save" onClick={() => saveEdit(song)}>
                      <Save size={16} />
                    </button>
                    <button className="icon-button" title="Cancel" onClick={() => setEditingId("")}>
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <button className="icon-button" title="Edit" onClick={() => startEdit(song)}>
                    <Pencil size={16} />
                  </button>
                )}
                <button className="icon-button" title="Toggle favorite" onClick={() => updateSong(song, { isFavorite: !song.isFavorite })}>
                  <Heart size={16} fill={song.isFavorite ? "currentColor" : "none"} />
                </button>
                <button className="icon-button" title="Delete" onClick={() => deleteSong(song)}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {!songs.length ? <p className="p-6 text-sm text-zinc-400">No songs found.</p> : null}
        </div>
      </section>

      <aside className="space-y-4">
        <form className="panel space-y-3 p-5" onSubmit={addManual}>
          <p className="eyebrow">Manual Add</p>
          <input className="field" placeholder="YouTube URL or video ID" value={manualUrl} onChange={(event) => setManualUrl(event.target.value)} />
          <input className="field" placeholder="Song title" value={manualTitle} onChange={(event) => setManualTitle(event.target.value)} />
          <button className="btn-primary w-full justify-center">
            <Plus size={16} /> Save song
          </button>
        </form>

        <div className="panel space-y-3 p-5">
          <div className="flex items-center justify-between">
            <p className="eyebrow">YouTube Search</p>
            <Video size={20} className="text-red-300" />
          </div>
          <button className="btn-secondary w-full justify-center" onClick={searchYouTube} disabled={loading || !(query || manualTitle)}>
            <Search size={16} /> {loading ? "Searching..." : "Search YouTube"}
          </button>
          <div className="space-y-2">
            {youtubeResults.map((result) => (
              <div className="rounded-md border border-white/10 bg-white/[0.03] p-3" key={result.youtubeVideoId}>
                <div className="flex gap-3">
                  <SongArt song={result} className="h-12 w-16" />
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-sm font-medium text-white">{result.title}</p>
                    <p className="truncate text-xs text-zinc-400">{result.channelName}</p>
                  </div>
                </div>
                <button className="btn-secondary mt-3 w-full justify-center" onClick={() => saveSong(result)}>
                  <Plus size={16} /> Add to library
                </button>
              </div>
            ))}
          </div>
        </div>
        {message ? <p className="toast">{message}</p> : null}
      </aside>
    </div>
  );
}
