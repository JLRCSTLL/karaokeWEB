import crypto from "crypto";
import type { QueueItem, QueueSnapshot, QueueStatus, Song, UserSession } from "./types";
import { getSupabaseAdmin } from "./supabase";

const liveStatuses: QueueStatus[] = ["pending", "approved", "playing"];

type SongRow = Song & {
  createdAt?: string;
  updatedAt?: string;
  addedBy?: string | null;
};

type SessionRow = UserSession;

type QueueItemRow = Omit<QueueItem, "song"> & {
  song?: SongRow | SongRow[] | null;
};

type PlaybackStateRow = {
  id: string;
  sessionId: string;
  currentQueueItemId: string | null;
  playerState: string;
  updatedAt: string;
};

type QueueHistoryRow = {
  id: string;
  sessionId: string;
  songId: string | null;
  requesterName: string | null;
  action: string;
  timestamp: string;
  song?: SongRow | SongRow[] | null;
};

function id() {
  return crypto.randomUUID();
}

function now() {
  return new Date().toISOString();
}

function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] || null;
  return value || null;
}

function asSong(song: SongRow): Song {
  return {
    id: song.id,
    youtubeVideoId: song.youtubeVideoId,
    title: song.title,
    artist: song.artist,
    channelName: song.channelName,
    thumbnailUrl: song.thumbnailUrl,
    duration: song.duration,
    source: song.source,
    playCount: song.playCount,
    isFavorite: song.isFavorite,
    isBlacklisted: song.isBlacklisted,
  };
}

function asQueueItem(item: QueueItemRow): QueueItem {
  const song = one(item.song);

  if (!song) {
    throw new Error("Queue item is missing song metadata.");
  }

  return {
    id: item.id,
    sessionId: item.sessionId,
    songId: item.songId,
    requesterName: item.requesterName,
    status: item.status,
    position: item.position,
    requestedAt: item.requestedAt,
    startedAt: item.startedAt,
    completedAt: item.completedAt,
    song: asSong(song),
  };
}

function supabaseError(error: unknown) {
  if (error) throw error;
}

export async function getActiveSession() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("UserSession")
    .select("*")
    .eq("isActive", true)
    .order("createdAt", { ascending: false })
    .limit(1)
    .maybeSingle<SessionRow>();

  supabaseError(error);
  return data;
}

export async function countLibrarySongs() {
  const supabase = getSupabaseAdmin();
  const { count, error } = await supabase
    .from("Song")
    .select("*", { count: "exact", head: true })
    .eq("isBlacklisted", false);

  supabaseError(error);
  return count || 0;
}

export async function createSession(name: string, sessionCode: string) {
  const supabase = getSupabaseAdmin();

  await supabase.from("UserSession").update({ isActive: false, endedAt: now() }).eq("isActive", true);

  const { data: session, error } = await supabase
    .from("UserSession")
    .insert({ id: id(), name, sessionCode })
    .select("*")
    .single<SessionRow>();

  supabaseError(error);
  if (!session) throw new Error("Could not create session.");

  await upsertPlaybackState(session.id, null, "idle");
  return session;
}

export async function endSession(sessionCode: string) {
  const supabase = getSupabaseAdmin();
  const session = await getSessionByCode(sessionCode);
  if (!session) return null;

  const { data, error } = await supabase
    .from("UserSession")
    .update({ isActive: false, endedAt: now() })
    .eq("sessionCode", sessionCode)
    .select("*")
    .single<SessionRow>();

  supabaseError(error);
  if (!data) throw new Error("Could not end session.");
  await upsertPlaybackState(session.id, null, "stopped");
  return data;
}

export async function updateSessionSettings(
  sessionCode: string,
  settings: Partial<Pick<UserSession, "guestRequestsEnabled" | "approvalRequired">>,
) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("UserSession")
    .update(settings)
    .eq("sessionCode", sessionCode)
    .select("*")
    .single<SessionRow>();

  supabaseError(error);
  if (!data) throw new Error("Could not update session settings.");
  return data;
}

export async function getSessionByCode(sessionCode: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("UserSession")
    .select("*")
    .eq("sessionCode", sessionCode)
    .maybeSingle<SessionRow>();

  supabaseError(error);
  return data;
}

export async function searchLibrary(query: string) {
  const supabase = getSupabaseAdmin();
  let request = supabase.from("Song").select("*").eq("isBlacklisted", false);

  if (query) {
    const escaped = query.replaceAll(",", " ");
    request = request.or(
      `title.ilike.%${escaped}%,artist.ilike.%${escaped}%,channelName.ilike.%${escaped}%`,
    );
  }

  const { data, error } = await request
    .order("isFavorite", { ascending: false })
    .order("playCount", { ascending: false })
    .order("title", { ascending: true })
    .limit(60)
    .returns<SongRow[]>();

  supabaseError(error);
  const songs = (data || []).map(asSong);

  return { songs, count: await countLibrarySongs() };
}

export async function findSongById(songId: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("Song").select("*").eq("id", songId).maybeSingle<SongRow>();

  supabaseError(error);
  return data ? asSong(data) : null;
}

export async function findSongByYoutubeId(youtubeVideoId: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("Song")
    .select("*")
    .eq("youtubeVideoId", youtubeVideoId)
    .maybeSingle<SongRow>();

  supabaseError(error);
  return data ? asSong(data) : null;
}

export async function saveSong(song: {
  youtubeVideoId: string;
  title: string;
  artist?: string | null;
  channelName?: string | null;
  thumbnailUrl?: string | null;
  duration?: string | null;
  source?: string;
  addedBy?: string | null;
  isFavorite?: boolean;
}) {
  const supabase = getSupabaseAdmin();
  const existing = await findSongByYoutubeId(song.youtubeVideoId);
  const payload = {
    youtubeVideoId: song.youtubeVideoId,
    title: song.title,
    artist: song.artist || null,
    channelName: song.channelName || null,
    thumbnailUrl: song.thumbnailUrl || null,
    duration: song.duration || null,
    source: song.source || "youtube",
    addedBy: song.addedBy || null,
    isFavorite: song.isFavorite || false,
    updatedAt: now(),
  };

  if (existing) {
    const { data, error } = await supabase
      .from("Song")
      .update(payload)
      .eq("id", existing.id)
      .select("*")
      .single<SongRow>();

    supabaseError(error);
    if (!data) throw new Error("Could not update song.");
    return asSong(data);
  }

  const { data, error } = await supabase
    .from("Song")
    .insert({ id: id(), ...payload })
    .select("*")
    .single<SongRow>();

  supabaseError(error);
  if (!data) throw new Error("Could not create song.");
  return asSong(data);
}

export async function updateSong(
  songId: string,
  changes: Partial<Pick<Song, "title" | "artist" | "isFavorite" | "isBlacklisted" | "playCount">>,
) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("Song")
    .update({ ...changes, updatedAt: now() })
    .eq("id", songId)
    .select("*")
    .single<SongRow>();

  supabaseError(error);
  if (!data) throw new Error("Could not update song.");
  return asSong(data);
}

export async function deleteSong(songId: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("Song").delete().eq("id", songId);
  supabaseError(error);
}

export async function getQueueSnapshot(sessionCode: string): Promise<QueueSnapshot | null> {
  const supabase = getSupabaseAdmin();
  const session = await getSessionByCode(sessionCode);
  if (!session) return null;

  const { data: playback, error: playbackError } = await supabase
    .from("PlaybackState")
    .select("*")
    .eq("sessionId", session.id)
    .maybeSingle<PlaybackStateRow>();
  supabaseError(playbackError);

  const { data: queueRows, error: queueError } = await supabase
    .from("QueueItem")
    .select("*, song:Song(*)")
    .eq("sessionId", session.id)
    .in("status", liveStatuses)
    .order("position", { ascending: true })
    .order("requestedAt", { ascending: true })
    .returns<QueueItemRow[]>();
  supabaseError(queueError);

  const queue = (queueRows || []).map(asQueueItem);
  let current = queue.find((item) => item.status === "playing") || null;

  if (!current && playback?.currentQueueItemId) {
    current = await getQueueItem(playback.currentQueueItemId);
  }

  return { session, current, queue };
}

export async function getQueueItem(queueItemId: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("QueueItem")
    .select("*, song:Song(*)")
    .eq("id", queueItemId)
    .maybeSingle<QueueItemRow>();

  supabaseError(error);
  return data ? asQueueItem(data) : null;
}

export async function nextQueuePosition(sessionId: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("QueueItem")
    .select("position")
    .eq("sessionId", sessionId)
    .in("status", liveStatuses)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle<{ position: number }>();

  supabaseError(error);
  return (data?.position || 0) + 1;
}

export async function normalizeQueuePositions(sessionId: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("QueueItem")
    .select("id")
    .eq("sessionId", sessionId)
    .in("status", ["pending", "approved"])
    .order("position", { ascending: true })
    .order("requestedAt", { ascending: true })
    .returns<{ id: string }[]>();

  supabaseError(error);

  await Promise.all(
    (data || []).map((item, index) =>
      supabase.from("QueueItem").update({ position: index + 1 }).eq("id", item.id),
    ),
  );
}

export async function countQueueItems(filters: {
  sessionId: string;
  songId?: string;
  requesterName?: string;
  statuses: QueueStatus[];
  maxPosition?: number;
}) {
  const supabase = getSupabaseAdmin();
  let request = supabase
    .from("QueueItem")
    .select("*", { count: "exact", head: true })
    .eq("sessionId", filters.sessionId)
    .in("status", filters.statuses);

  if (filters.songId) request = request.eq("songId", filters.songId);
  if (filters.requesterName) request = request.eq("requesterName", filters.requesterName);
  if (filters.maxPosition) request = request.lte("position", filters.maxPosition);

  const { count, error } = await request;
  supabaseError(error);
  return count || 0;
}

export async function createQueueItem(data: {
  sessionId: string;
  songId: string;
  requesterName: string;
  status: QueueStatus;
  position: number;
}) {
  const supabase = getSupabaseAdmin();
  const { data: queueItem, error } = await supabase
    .from("QueueItem")
    .insert({ id: id(), ...data })
    .select("*, song:Song(*)")
    .single<QueueItemRow>();

  supabaseError(error);
  if (!queueItem) throw new Error("Could not create queue item.");
  return asQueueItem(queueItem);
}

export async function updateQueueItemStatus(queueItemId: string, status: QueueStatus) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("QueueItem")
    .update({ status, completedAt: ["completed", "skipped", "rejected"].includes(status) ? now() : null })
    .eq("id", queueItemId)
    .select("*, song:Song(*)")
    .single<QueueItemRow>();

  supabaseError(error);
  if (!data) throw new Error("Could not update queue item.");
  return asQueueItem(data);
}

export async function reorderQueueItems(queueItemIds: string[]) {
  const supabase = getSupabaseAdmin();
  await Promise.all(
    queueItemIds.map((queueItemId, index) =>
      supabase.from("QueueItem").update({ position: index + 1 }).eq("id", queueItemId),
    ),
  );
}

export async function clearQueuedItems(sessionId: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("QueueItem")
    .update({ status: "skipped", completedAt: now() })
    .eq("sessionId", sessionId)
    .in("status", ["pending", "approved"]);

  supabaseError(error);
}

export async function addHistory(data: {
  sessionId: string;
  songId?: string | null;
  requesterName?: string | null;
  action: string;
}) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("QueueHistory").insert({ id: id(), ...data });
  supabaseError(error);
}

export async function getHistory(sessionId: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("QueueHistory")
    .select("*, song:Song(*)")
    .eq("sessionId", sessionId)
    .order("timestamp", { ascending: true })
    .returns<QueueHistoryRow[]>();

  supabaseError(error);
  return data || [];
}

export async function getPlaybackBySessionCode(sessionCode: string) {
  const supabase = getSupabaseAdmin();
  const session = await getSessionByCode(sessionCode);
  if (!session) return null;

  const { data, error } = await supabase
    .from("PlaybackState")
    .select("*")
    .eq("sessionId", session.id)
    .maybeSingle<PlaybackStateRow>();

  supabaseError(error);

  return {
    playbackState: data
      ? {
          ...data,
          currentQueueItem: data.currentQueueItemId ? await getQueueItem(data.currentQueueItemId) : null,
        }
      : null,
  };
}

export async function upsertPlaybackState(
  sessionId: string,
  currentQueueItemId: string | null,
  playerState: string,
) {
  const supabase = getSupabaseAdmin();
  const existing = await supabase
    .from("PlaybackState")
    .select("id")
    .eq("sessionId", sessionId)
    .maybeSingle<{ id: string }>();
  supabaseError(existing.error);

  const payload = { sessionId, currentQueueItemId, playerState, updatedAt: now() };

  if (existing.data?.id) {
    const { data, error } = await supabase
      .from("PlaybackState")
      .update(payload)
      .eq("id", existing.data.id)
      .select("*")
      .single<PlaybackStateRow>();
    supabaseError(error);
    return data;
  }

  const { data, error } = await supabase
    .from("PlaybackState")
    .insert({ id: id(), ...payload })
    .select("*")
    .single<PlaybackStateRow>();

  supabaseError(error);
  return data;
}

export async function advanceQueue(sessionCode: string, finishCurrentAs: "completed" | "skipped" = "completed") {
  const session = await getSessionByCode(sessionCode);
  if (!session) return null;

  const playback = await getPlaybackBySessionCode(sessionCode);
  const currentId = playback?.playbackState?.currentQueueItemId;

  if (currentId) {
    const current = await updateQueueItemStatus(currentId, finishCurrentAs);

    if (finishCurrentAs === "completed") {
      const song = await findSongById(current.songId);
      if (song) await updateSong(song.id, { playCount: song.playCount + 1 } as Partial<Song>);
    }

    await addHistory({
      sessionId: session.id,
      songId: current.songId,
      requesterName: current.requesterName,
      action: finishCurrentAs,
    });
  }

  const supabase = getSupabaseAdmin();
  const { data: next, error } = await supabase
    .from("QueueItem")
    .select("*, song:Song(*)")
    .eq("sessionId", session.id)
    .eq("status", "approved")
    .order("position", { ascending: true })
    .order("requestedAt", { ascending: true })
    .limit(1)
    .maybeSingle<QueueItemRow>();
  supabaseError(error);

  if (next) {
    await supabase
      .from("QueueItem")
      .update({ status: "playing", startedAt: now(), position: 0 })
      .eq("id", next.id);
    await upsertPlaybackState(session.id, next.id, "playing");
    await addHistory({
      sessionId: session.id,
      songId: next.songId,
      requesterName: next.requesterName,
      action: "started",
    });
  } else {
    await upsertPlaybackState(session.id, null, "idle");
  }

  await normalizeQueuePositions(session.id);
  return getQueueSnapshot(sessionCode);
}
