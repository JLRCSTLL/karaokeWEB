import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for seeding.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const songs = [
  {
    youtubeVideoId: "dQw4w9WgXcQ",
    title: "Never Gonna Give You Up",
    artist: "Rick Astley",
    channelName: "Rick Astley",
    thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    duration: "3:33",
    isFavorite: true,
  },
  {
    youtubeVideoId: "fJ9rUzIMcZQ",
    title: "Bohemian Rhapsody",
    artist: "Queen",
    channelName: "Queen Official",
    thumbnailUrl: "https://i.ytimg.com/vi/fJ9rUzIMcZQ/hqdefault.jpg",
    duration: "5:55",
    isFavorite: true,
  },
  {
    youtubeVideoId: "Zi_XLOBDo_Y",
    title: "Billie Jean",
    artist: "Michael Jackson",
    channelName: "Michael Jackson",
    thumbnailUrl: "https://i.ytimg.com/vi/Zi_XLOBDo_Y/hqdefault.jpg",
    duration: "4:56",
  },
  {
    youtubeVideoId: "YQHsXMglC9A",
    title: "Hello",
    artist: "Adele",
    channelName: "Adele",
    thumbnailUrl: "https://i.ytimg.com/vi/YQHsXMglC9A/hqdefault.jpg",
    duration: "6:07",
  },
  {
    youtubeVideoId: "hTWKbfoikeg",
    title: "Smells Like Teen Spirit",
    artist: "Nirvana",
    channelName: "Nirvana",
    thumbnailUrl: "https://i.ytimg.com/vi/hTWKbfoikeg/hqdefault.jpg",
    duration: "4:39",
  },
];

for (const song of songs) {
  const { data: existing, error: findError } = await supabase
    .from("Song")
    .select("id")
    .eq("youtubeVideoId", song.youtubeVideoId)
    .maybeSingle();

  if (findError) throw findError;

  const payload = {
    ...song,
    source: "youtube",
    addedBy: "seed",
    updatedAt: new Date().toISOString(),
  };

  if (existing?.id) {
    const { error } = await supabase.from("Song").update(payload).eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("Song").insert({ id: crypto.randomUUID(), ...payload });
    if (error) throw error;
  }
}
