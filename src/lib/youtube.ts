type YouTubeSearchItem = {
  id: { videoId?: string };
  snippet: {
    title: string;
    channelTitle: string;
    thumbnails?: { medium?: { url: string }; high?: { url: string }; default?: { url: string } };
  };
};

type YouTubeVideoItem = {
  id: string;
  contentDetails?: { duration?: string };
};

function durationToLabel(duration?: string) {
  if (!duration) return null;
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return duration;

  const hours = Number(match[1] || 0);
  const minutes = Number(match[2] || 0);
  const seconds = Number(match[3] || 0);
  const parts = hours ? [hours, minutes, seconds] : [minutes, seconds];

  return parts.map((part, index) => (index === 0 ? `${part}` : String(part).padStart(2, "0"))).join(":");
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export async function searchYouTube(query: string) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error("YOUTUBE_API_KEY is not configured.");
  }

  const searchParams = new URLSearchParams({
    key: apiKey,
    part: "snippet",
    q: `${query} karaoke`,
    type: "video",
    videoEmbeddable: "true",
    maxResults: "8",
    safeSearch: "moderate",
  });

  const searchResponse = await fetch(
    `https://www.googleapis.com/youtube/v3/search?${searchParams.toString()}`,
    { cache: "no-store" },
  );

  if (!searchResponse.ok) {
    throw new Error("YouTube search failed.");
  }

  const searchData = (await searchResponse.json()) as { items?: YouTubeSearchItem[] };
  const items = searchData.items?.filter((item) => item.id.videoId) || [];
  const ids = items.map((item) => item.id.videoId).filter(Boolean).join(",");

  let durations = new Map<string, string | null>();
  if (ids) {
    const videoParams = new URLSearchParams({
      key: apiKey,
      part: "contentDetails",
      id: ids,
    });
    const videoResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?${videoParams.toString()}`,
      { cache: "no-store" },
    );

    if (videoResponse.ok) {
      const videoData = (await videoResponse.json()) as { items?: YouTubeVideoItem[] };
      durations = new Map(
        videoData.items?.map((item) => [item.id, durationToLabel(item.contentDetails?.duration)]) || [],
      );
    }
  }

  return items.map((item) => {
    const youtubeVideoId = item.id.videoId || "";
    const thumbnails = item.snippet.thumbnails;

    return {
      youtubeVideoId,
      title: decodeHtml(item.snippet.title),
      channelName: decodeHtml(item.snippet.channelTitle),
      thumbnailUrl: thumbnails?.high?.url || thumbnails?.medium?.url || thumbnails?.default?.url || null,
      duration: durations.get(youtubeVideoId) || null,
      source: "youtube",
    };
  });
}
