"use client";

import { useEffect, useState } from "react";
import { Check, ChevronsUp, GripVertical, ListPlus, Search, SkipForward, Trash2, X } from "lucide-react";
import { api, statusClass } from "@/lib/client-api";
import type { QueueItem, QueueSnapshot, Song } from "@/lib/types";
import { SongArt } from "./song-art";
import { useRealtimeQueue } from "./use-realtime-queue";

type Props = {
  sessionCode?: string;
  initialSnapshot: QueueSnapshot | null;
};

export function QueueManager({ sessionCode, initialSnapshot }: Props) {
  const { snapshot } = useRealtimeQueue(sessionCode, initialSnapshot);
  const [items, setItems] = useState<QueueItem[]>(initialSnapshot?.queue || []);
  const [dragId, setDragId] = useState<string | null>(null);
  const [requesterName, setRequesterName] = useState("Host");
  const [songQuery, setSongQuery] = useState("");
  const [songResults, setSongResults] = useState<Song[]>([]);
  const activeCode = sessionCode || snapshot?.session.sessionCode;

  useEffect(() => {
    if (!snapshot?.queue) return;
    const timeout = window.setTimeout(() => setItems(snapshot.queue), 0);
    return () => window.clearTimeout(timeout);
  }, [snapshot]);

  async function post(path: string, body: object) {
    await api(path, { method: "POST", body: JSON.stringify(body) });
  }

  async function reorder(nextItems: QueueItem[]) {
    setItems(nextItems);
    if (!activeCode) return;
    await post("/api/queue/reorder", {
      sessionCode: activeCode,
      queueItemIds: nextItems.filter((item) => item.status !== "playing").map((item) => item.id),
    });
  }

  function moveToTop(item: QueueItem) {
    const nextItems = [item, ...items.filter((candidate) => candidate.id !== item.id)];
    void reorder(nextItems);
  }

  function onDrop(targetId: string) {
    if (!dragId || dragId === targetId) return;

    const dragged = items.find((item) => item.id === dragId);
    if (!dragged) return;

    const withoutDragged = items.filter((item) => item.id !== dragId);
    const targetIndex = withoutDragged.findIndex((item) => item.id === targetId);
    const nextItems = [...withoutDragged];
    nextItems.splice(targetIndex, 0, dragged);
    setDragId(null);
    void reorder(nextItems);
  }

  async function nextSong() {
    if (!activeCode) return;
    await post("/api/queue/next", { sessionCode: activeCode });
  }

  async function searchSongs() {
    const response = await api<{ songs: Song[]; count: number }>(`/api/library?q=${encodeURIComponent(songQuery)}`);
    setSongResults(response.songs.slice(0, 8));
  }

  async function addManual(song: Song) {
    if (!activeCode) return;
    await api("/api/queue/add", {
      method: "POST",
      body: JSON.stringify({ sessionCode: activeCode, songId: song.id, requesterName }),
    });
    setSongResults([]);
    setSongQuery("");
  }

  if (!activeCode) {
    return <div className="panel p-6 text-zinc-300">Create a session before managing the queue.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Queue Management</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">{snapshot?.session.name || "Active queue"}</h1>
        </div>
        <button className="btn-primary" onClick={nextSong}>
          <SkipForward size={16} /> Skip to next
        </button>
      </div>

      <div className="panel p-4">
        <p className="eyebrow">Manual Add</p>
        <div className="mt-3 grid gap-3 md:grid-cols-[180px_1fr_auto]">
          <input className="field" value={requesterName} onChange={(event) => setRequesterName(event.target.value)} placeholder="Requester" />
          <input className="field" value={songQuery} onChange={(event) => setSongQuery(event.target.value)} placeholder="Search local library" />
          <button className="btn-secondary justify-center" onClick={searchSongs}>
            <Search size={16} /> Search
          </button>
        </div>
        {songResults.length ? (
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {songResults.map((song) => (
              <button className="flex min-w-0 items-center gap-3 rounded-md border border-white/10 bg-white/[0.03] p-3 text-left hover:border-cyan-300/40" key={song.id} onClick={() => addManual(song)}>
                <SongArt song={song} className="h-10 w-14 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-white">{song.title}</span>
                  <span className="block truncate text-xs text-zinc-400">{song.artist || song.channelName || "YouTube"}</span>
                </span>
                <ListPlus size={16} className="shrink-0 text-cyan-300" />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="panel overflow-hidden">
        <div className="grid grid-cols-[48px_1fr_140px_160px] gap-3 border-b border-white/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 max-lg:hidden">
          <span />
          <span>Song</span>
          <span>Status</span>
          <span>Actions</span>
        </div>
        <div className="divide-y divide-white/10">
          {items.map((item) => (
            <div
              key={item.id}
              draggable={item.status !== "playing"}
              onDragStart={() => setDragId(item.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => onDrop(item.id)}
              className="grid gap-3 px-4 py-4 lg:grid-cols-[48px_1fr_140px_160px] lg:items-center"
            >
              <button className="icon-button cursor-grab" title="Drag to reorder">
                <GripVertical size={18} />
              </button>
              <div className="flex min-w-0 items-center gap-3">
                <SongArt song={item.song} />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-white">{item.song.title}</p>
                  <p className="truncate text-sm text-zinc-400">
                    {item.requesterName} • {item.song.artist || item.song.channelName || "YouTube"}
                  </p>
                </div>
              </div>
              <span className={`badge w-fit ${statusClass(item.status)}`}>{item.status}</span>
              <div className="flex flex-wrap gap-2">
                {item.status === "pending" ? (
                  <>
                    <button className="icon-button" title="Approve" onClick={() => post("/api/queue/approve", { queueItemId: item.id })}>
                      <Check size={16} />
                    </button>
                    <button className="icon-button" title="Reject" onClick={() => post("/api/queue/reject", { queueItemId: item.id })}>
                      <X size={16} />
                    </button>
                  </>
                ) : null}
                <button className="icon-button" title="Move to top" onClick={() => moveToTop(item)} disabled={item.status === "playing"}>
                  <ChevronsUp size={16} />
                </button>
                <button className="icon-button" title="Remove" onClick={() => post("/api/queue/remove", { queueItemId: item.id })}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {!items.length ? <p className="p-6 text-sm text-zinc-400">No songs are waiting yet.</p> : null}
        </div>
      </div>
    </div>
  );
}
