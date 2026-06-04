import type { Song, YouTubeResult } from "@/lib/types";
import Image from "next/image";

type Props = {
  song: Song | YouTubeResult;
  className?: string;
};

export function SongArt({ song, className = "h-14 w-20" }: Props) {
  return (
    <div className={`${className} overflow-hidden rounded-md bg-zinc-800`}>
      {song.thumbnailUrl ? (
        <Image
          src={song.thumbnailUrl}
          alt=""
          width={160}
          height={90}
          className="h-full w-full object-cover"
          unoptimized
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500">No art</div>
      )}
    </div>
  );
}
