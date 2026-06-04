export type Song = {
  id: string;
  youtubeVideoId: string;
  title: string;
  artist?: string | null;
  channelName?: string | null;
  thumbnailUrl?: string | null;
  duration?: string | null;
  source: string;
  playCount: number;
  isFavorite: boolean;
  isBlacklisted: boolean;
};

export type QueueStatus = "pending" | "approved" | "playing" | "completed" | "skipped" | "rejected";

export type QueueItem = {
  id: string;
  sessionId: string;
  songId: string;
  requesterName: string;
  status: QueueStatus;
  position: number;
  requestedAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  song: Song;
};

export type UserSession = {
  id: string;
  sessionCode: string;
  name: string;
  isActive: boolean;
  guestRequestsEnabled: boolean;
  approvalRequired: boolean;
  createdAt: string;
  endedAt?: string | null;
};

export type QueueSnapshot = {
  session: UserSession;
  current: QueueItem | null;
  queue: QueueItem[];
};

export type YouTubeResult = {
  youtubeVideoId: string;
  title: string;
  channelName?: string | null;
  thumbnailUrl?: string | null;
  duration?: string | null;
  source: string;
};
