"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle2,
  Copy,
  DoorClosed,
  ListMusic,
  MonitorPlay,
  Play,
  Plus,
  QrCode,
  Trash2,
  Users,
} from "lucide-react";
import { api } from "@/lib/client-api";
import type { QueueSnapshot, UserSession } from "@/lib/types";
import { useRealtimeQueue } from "./use-realtime-queue";

type Props = {
  initialSnapshot: QueueSnapshot | null;
  libraryCount: number;
};

export function AdminDashboard({ initialSnapshot, libraryCount }: Props) {
  const [session, setSession] = useState<UserSession | null>(initialSnapshot?.session || null);
  const [name, setName] = useState("Karaoke Night");
  const [message, setMessage] = useState("");
  const [origin, setOrigin] = useState("");
  const { snapshot } = useRealtimeQueue(session?.sessionCode, initialSnapshot);
  const activeSession = snapshot?.session || session;
  const current = snapshot?.current || null;
  const queue = snapshot?.queue || [];

  const guestUrl = activeSession && origin ? `${origin}/session/${activeSession.sessionCode}` : "";

  useEffect(() => {
    const timeout = window.setTimeout(() => setOrigin(window.location.origin), 0);
    return () => window.clearTimeout(timeout);
  }, []);

  async function createSession() {
    const response = await api<{ session: UserSession }>("/api/session/create", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
    setSession(response.session);
    setMessage("Session created.");
  }

  async function endSession() {
    if (!activeSession) return;
    await api("/api/session/end", {
      method: "POST",
      body: JSON.stringify({ sessionCode: activeSession.sessionCode }),
    });
    setSession({ ...activeSession, isActive: false });
    setMessage("Session ended.");
  }

  async function updateSettings(settings: Partial<UserSession>) {
    if (!activeSession) return;
    const response = await api<{ session: UserSession }>("/api/session/settings", {
      method: "POST",
      body: JSON.stringify({ sessionCode: activeSession.sessionCode, ...settings }),
    });
    setSession(response.session);
  }

  async function clearQueue() {
    if (!activeSession) return;
    await api("/api/queue/clear", {
      method: "POST",
      body: JSON.stringify({ sessionCode: activeSession.sessionCode }),
    });
    setMessage("Queue cleared.");
  }

  async function nextSong() {
    if (!activeSession) return;
    await api("/api/queue/next", {
      method: "POST",
      body: JSON.stringify({ sessionCode: activeSession.sessionCode }),
    });
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="panel p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="eyebrow">Active Session</p>
              <h1 className="mt-2 text-3xl font-semibold text-white">{activeSession?.name || "No session running"}</h1>
              <p className="mt-2 text-sm text-zinc-400">
                {activeSession ? `Code ${activeSession.sessionCode}` : "Create a session to open guest requests."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {activeSession?.isActive ? (
                <button className="btn-danger" onClick={endSession}>
                  <DoorClosed size={16} /> End
                </button>
              ) : (
                <button className="btn-primary" onClick={createSession}>
                  <Plus size={16} /> Create
                </button>
              )}
            </div>
          </div>

          {!activeSession ? (
            <label className="field-label mt-6">
              Session name
              <input className="field" value={name} onChange={(event) => setName(event.target.value)} />
            </label>
          ) : (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                className={activeSession.guestRequestsEnabled ? "toggle-on" : "toggle-off"}
                onClick={() => updateSettings({ guestRequestsEnabled: !activeSession.guestRequestsEnabled })}
              >
                <Users size={16} /> Guest requests {activeSession.guestRequestsEnabled ? "on" : "off"}
              </button>
              <button
                className={activeSession.approvalRequired ? "toggle-on" : "toggle-off"}
                onClick={() => updateSettings({ approvalRequired: !activeSession.approvalRequired })}
              >
                <CheckCircle2 size={16} /> Approval {activeSession.approvalRequired ? "on" : "off"}
              </button>
            </div>
          )}
        </div>

        <div className="panel p-5">
          <div className="flex items-center justify-between">
            <p className="eyebrow">Guest QR</p>
            <QrCode size={20} className="text-cyan-300" />
          </div>
          {activeSession ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-[160px_1fr] lg:grid-cols-1 xl:grid-cols-[160px_1fr]">
              <Image
                className="rounded-md bg-white p-2"
                src={`/api/qr?sessionCode=${activeSession.sessionCode}`}
                alt="Guest QR code"
                width={160}
                height={160}
                unoptimized
              />
              <div className="min-w-0 space-y-3">
                <p className="break-all text-sm text-zinc-300">{guestUrl}</p>
                <button
                  className="btn-secondary"
                  onClick={() => navigator.clipboard.writeText(guestUrl).then(() => setMessage("Guest link copied."))}
                >
                  <Copy size={16} /> Copy link
                </button>
                <Link className="btn-secondary" href={`/display/${activeSession.sessionCode}`} target="_blank">
                  <MonitorPlay size={16} /> Open display
                </Link>
                <a className="btn-secondary" href={`/api/history/export?sessionCode=${activeSession.sessionCode}`}>
                  Export history
                </a>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-zinc-400">The QR code appears after a session starts.</p>
          )}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="metric">
          <ListMusic size={20} />
          <span>{libraryCount}</span>
          <p>Songs saved</p>
        </div>
        <div className="metric">
          <Users size={20} />
          <span>{queue.length}</span>
          <p>Upcoming</p>
        </div>
        <div className="metric">
          <CheckCircle2 size={20} />
          <span>{queue.filter((item) => item.status === "pending").length}</span>
          <p>Pending</p>
        </div>
        <button className="metric text-left" onClick={clearQueue} disabled={!activeSession}>
          <Trash2 size={20} />
          <span>Clear</span>
          <p>Queue reset</p>
        </button>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="panel p-5">
          <p className="eyebrow">Now Singing</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">{current?.song.title || "Waiting for the first song"}</h2>
          <p className="mt-1 text-zinc-400">{current ? `${current.requesterName} • ${current.song.artist || current.song.channelName || "YouTube"}` : "Queue a song, then press next."}</p>
          <button className="btn-primary mt-5" onClick={nextSong} disabled={!activeSession}>
            <Play size={16} /> Next song
          </button>
        </div>
        <div className="panel p-5">
          <div className="flex items-center justify-between">
            <p className="eyebrow">Up Next</p>
            <Link className="text-sm text-cyan-300 hover:text-cyan-100" href="/admin/queue">
              Manage queue
            </Link>
          </div>
          <div className="mt-4 space-y-2">
            {queue.filter((item) => item.status !== "playing").slice(0, 5).map((item) => (
              <div className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-white/[0.03] p-3" key={item.id}>
                <div className="min-w-0">
                  <p className="truncate font-medium text-white">{item.song.title}</p>
                  <p className="text-sm text-zinc-400">{item.requesterName}</p>
                </div>
                <span className="badge">{item.status}</span>
              </div>
            ))}
            {!queue.length ? <p className="text-sm text-zinc-400">No songs queued yet.</p> : null}
          </div>
        </div>
      </section>
      {message ? <p className="toast">{message}</p> : null}
    </div>
  );
}
