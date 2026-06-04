import { z } from "zod";
import { cleanText } from "./http";

const text = (max = 120) =>
  z
    .string()
    .min(1)
    .max(max)
    .transform((value) => cleanText(value, max));

export const loginSchema = z.object({
  username: text(80),
  password: z.string().min(1).max(200),
});

export const sessionCreateSchema = z.object({
  name: text(100).default("Karaoke Night"),
});

export const sessionEndSchema = z.object({
  sessionCode: text(40),
});

export const sessionSettingsSchema = z.object({
  sessionCode: text(40),
  guestRequestsEnabled: z.boolean().optional(),
  approvalRequired: z.boolean().optional(),
});

export const libraryAddSchema = z.object({
  youtubeVideoId: text(32),
  title: text(180),
  artist: text(120).optional().nullable(),
  channelName: text(120).optional().nullable(),
  thumbnailUrl: z.string().url().optional().nullable(),
  duration: text(40).optional().nullable(),
  source: text(40).default("youtube"),
  addedBy: text(80).optional().nullable(),
  isFavorite: z.boolean().optional(),
});

export const libraryUpdateSchema = z.object({
  title: text(180).optional(),
  artist: text(120).optional().nullable(),
  isFavorite: z.boolean().optional(),
  isBlacklisted: z.boolean().optional(),
});

export const queueAddSchema = z.object({
  sessionCode: text(40),
  songId: text(40).optional(),
  youtubeVideoId: text(32).optional(),
  requesterName: text(80),
});

export const queueItemSchema = z.object({
  queueItemId: text(40),
});

export const reorderSchema = z.object({
  sessionCode: text(40),
  queueItemIds: z.array(text(40)).min(1),
});

export const playbackUpdateSchema = z.object({
  sessionCode: text(40),
  currentQueueItemId: text(40).optional().nullable(),
  playerState: text(40).default("idle"),
});

export function extractYouTubeVideoId(input: string) {
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;

  try {
    const url = new URL(trimmed);
    if (url.hostname.includes("youtu.be")) return url.pathname.slice(1, 12);
    if (url.hostname.includes("youtube.com")) return url.searchParams.get("v") || "";
  } catch {
    return "";
  }

  return "";
}
